/**
*
* @licstart  The following is the entire license notice for the JavaScript code in this file.
*
* UI for transforming MARC records in Melinda
*
* Copyright (C) 2015-2019 University Of Helsinki (The National Library Of Finland)
*
* This file is part of melinda-muuntaja
*
* melinda-muuntaja program is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as
* published by the Free Software Foundation, either version 3 of the
* License, or (at your option) any later version.
*
* melinda-muuntaja is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU Affero General Public License for more details.
*
* You should have received a copy of the GNU Affero General Public License
* along with this program.  If not, see <http://www.gnu.org/licenses/>.
*
* @licend  The above is the entire license notice
* for the JavaScript code in this file.
*
*/

import fetch from 'isomorphic-fetch';
import {MarcRecord} from '@natlibfi/marc-record';
import HttpStatus from 'http-status';
import _ from 'lodash';
import createRecordMerger from '@natlibfi/marc-record-merge';
import {exceptCoreErrors} from './utils';
import {RESET_WORKSPACE, TOGGLE_COMPACT_SUBRECORD_VIEW} from './constants/action-type-constants';
import {FetchNotOkError} from './errors';
import {subrecordRows, sourceSubrecords, targetSubrecords, rowsWithResultRecord} from './selectors/subrecord-selectors';
import {updateSubrecordArrangement, updateMergedSubrecords, saveSubrecordSuccess} from './action-creators/subrecord-actions';
import {match} from './component-record-match-service';
import {decorateFieldsWithUuid, setRecordId, selectRecordId} from './record-utils';
import {v4 as uuid} from 'uuid';
import * as subrecordMergeTypes from './config/subrecord-merge-types';

import * as MergeValidation from './marc-record-merge-validate-service';
import * as PostMerge from './marc-record-merge-postmerge-service';
import history from './history';
import {CHANGE_MERGE_PROFILE} from './constants/action-type-constants';



export const SWITCH_MERGE_CONFIG = 'SWITCH_MERGE_CONFIG';
export const SWITCH_MERGE_TYPE = 'SWITCH_MERGE_TYPE';

export function switchMergeType(mergeType) {
  const config = {mergeType, mergeProfile: 'default'};
  return function (dispatch) {
    dispatch({
      type: SWITCH_MERGE_TYPE,
      config
    });
    dispatch(updateMergedRecord());
  };
}

export function switchMergeConfig(config) {
  return function (dispatch) {
    dispatch({
      type: SWITCH_MERGE_CONFIG,
      config
    });
    dispatch(updateMergedRecord());
  };
}

export function changeMergeProfile(config) {
  return function (dispatch) {
    dispatch({
      type: CHANGE_MERGE_PROFILE,
      config
    });
    dispatch(updateMergedRecord());
  };
}

export function commitMerge() {

  const APIBasePath = __DEV__ ? 'http://localhost:3001/merge' : '/merge';

  return function (dispatch, getState) {
    dispatch(commitMergeStart());
    const operationType = getState().getIn(['targetRecord', 'state']) !== 'EMPTY' ? 'UPDATE' : 'CREATE';
    const subrecordMergeType = getState().getIn(['config', 'mergeProfiles', getState().getIn(['config', 'selectedMergeProfile']), 'subrecords', 'mergeType']);

    const sourceRecord = getState().getIn(['sourceRecord', 'record']);
    const targetRecord = getState().getIn(['targetRecord', 'record']);
    const mergedRecord = getState().getIn(['mergedRecord', 'record']);
    const unmodifiedRecord = getState().getIn(['mergedRecord', 'unmodifiedRecord']);

    if (targetRecord) {
      setRecordId(mergedRecord, selectRecordId(targetRecord));
    }

    const subrecords = subrecordRows(getState());

    const {sourceSubrecordList, targetSubrecordList, mergedSubrecordList, unmodifiedMergedSubrecordList} = subrecords.reduce((result, row) => {
      if (row.targetRecord) {
        row.mergedRecord = new MarcRecord(row.mergedRecord, {subfieldValues: false});

        setRecordId(row.mergedRecord, selectRecordId(row.targetRecord));
      }

      if (row.targetRecord) result.targetSubrecordList.push(row.targetRecord);
      if (row.sourceRecord) result.sourceSubrecordList.push(row.sourceRecord);
      if (row.mergedRecord) result.mergedSubrecordList.push(row.mergedRecord);
      if (row.unmodifiedMergedRecord) result.unmodifiedMergedSubrecordList.push(row.unmodifiedMergedRecord);

      return result;
    }, {sourceSubrecordList: [], targetSubrecordList: [], mergedSubrecordList: [], unmodifiedMergedSubrecordList: []});

    const body = {
      operationType,
      subrecordMergeType,
      otherRecord: {
        record: sourceRecord,
        subrecords: sourceSubrecordList,
      },
      mergedRecord: {
        record: mergedRecord,
        subrecords: mergedSubrecordList
      },
      unmodifiedRecord: {
        record: unmodifiedRecord,
        subrecords: unmodifiedMergedSubrecordList
      }
    };


    if (getState().getIn(['targetRecord', 'state']) !== 'EMPTY') {
      body.preferredRecord = {
        record: targetRecord,
        subrecords: targetSubrecordList
      };
    }

    const fetchOptions = {
      method: 'POST',
      body: JSON.stringify(body),
      headers: new Headers({
        'Content-Type': 'application/json'
      }),
      credentials: 'include'
    };

    return fetch(`${APIBasePath}/commit-merge`, fetchOptions)
      .then(response => {

        response.json().then(res => {
          if (response.status == HttpStatus.OK) {

            const newMergedRecordId = res.recordId;

            const {record, subrecords} = marcRecordsFrom(res.record, res.subrecords);

            dispatch(commitMergeSuccess(newMergedRecordId, res));
            dispatch(saveRecordSuccess(record));

            // subrecords
            const rowIds = rowsWithResultRecord(getState()).map(row => row.rowId);
            _.zip(rowIds, subrecords).forEach(([rowId, subrecord]) => {
              dispatch(saveSubrecordSuccess(rowId, subrecord));
            });

          } else {
            switch (response.status) {
              case HttpStatus.UNAUTHORIZED: return dispatch(commitMergeError('Käyttäjätunnus ja salasana eivät täsmää.'));
              case HttpStatus.INTERNAL_SERVER_ERROR: return dispatch(commitMergeError('Tietueen tallennuksessa tapahtui virhe.', res));
            }

            dispatch(commitMergeError('Tietueen tallennuksessa tapahtui virhe.', res));
          }
        });

      }).catch((error) => {
        dispatch(commitMergeError('There has been a problem with operation: ' + error.message));
      });

  };
}

export const COMMIT_MERGE_START = 'COMMIT_MERGE_START';

export function commitMergeStart() {
  return {
    type: COMMIT_MERGE_START
  };
}

export const COMMIT_MERGE_ERROR = 'COMMIT_MERGE_ERROR';

export function commitMergeError(errorMessage, response) {
  return {
    type: COMMIT_MERGE_ERROR,
    error: errorMessage,
    response
  };
}

export const COMMIT_MERGE_SUCCESS = 'COMMIT_MERGE_SUCCESS';

export function commitMergeSuccess(recordId, response) {
  return {
    type: COMMIT_MERGE_SUCCESS,
    recordId: recordId,
    response: response
  };
}

export const CLOSE_MERGE_DIALOG = 'CLOSE_MERGE_DIALOG';

export function closeMergeDialog() {
  return {
    type: CLOSE_MERGE_DIALOG
  };
}

export const RESET_STATE = 'RESET_STATE';
export function resetState() {
  return {
    type: RESET_STATE,
  };
}


export function resetWorkspace() {

  history.push('/');

  return {
    type: RESET_WORKSPACE,
  };
}

export const OPEN_SEARCH_DIALOG = 'OPEN_SEARCH_DIALOG';

export function openSearchDialog() {
  return {
    type: OPEN_SEARCH_DIALOG
  };
}

export const CLOSE_SEARCH_DIALOG = 'CLOSE_SEARCH_DIALOG';

export function closeSearchDialog() {
  return {
    type: CLOSE_SEARCH_DIALOG
  };
}

export const CLEAR_SEARCH_RESULTS = 'CLEAR_SEARCH_RESULTS';

export function clearSearchResults() {
  return {
    type: CLEAR_SEARCH_RESULTS
  };
}

export function handleSearch() {
  const APIBasePath = __DEV__ ? 'http://localhost:3001/sru' : '/sru';

  return function (dispatch, getState) {
    const query = getState().getIn(['search', 'query']);
    const page = getState().getIn(['search', 'currentPage']);
    const index = getState().getIn(['search', 'index']);

    dispatch(executeSearch());

    const indexPrefix = index ? index + '=' : '';

    return fetch(`${APIBasePath}/?q=${indexPrefix}${query}&page=${page}`)
      .then(validateResponseStatus)
      .then(response => response.json())
      .then(json => {
        json.records = json.records.map(record => {
          const marcRecord = new MarcRecord(record, {subfieldValues: false});
          decorateFieldsWithUuid(marcRecord);

          return marcRecord;
        });

        dispatch(setSearchResults(json));
      })
      .catch(() => {
        dispatch(setSearchError());
      });
  };
}

export const EXECUTE_SEARCH = 'EXECUTE_SEARCH';

export function executeSearch() {
  return {
    type: EXECUTE_SEARCH
  };
}

export const SET_SEARCH_RESULTS = 'SET_SEARCH_RESULTS';

export function setSearchResults(results) {
  return {
    type: SET_SEARCH_RESULTS,
    results
  };
}

export const SET_SEARCH_ERROR = 'SET_SEARCH_ERROR';

export function setSearchError(error) {
  return {
    type: SET_SEARCH_ERROR,
    error
  };
}


export const SET_SEARCH_QUERY = 'SET_SEARCH_QUERY';

export function setSearchQuery(query) {
  return {
    type: SET_SEARCH_QUERY,
    query
  };
}

export const SET_SEARCH_PAGE = 'SET_SEARCH_PAGE';

export function setSearchPage(page) {
  return {
    type: SET_SEARCH_PAGE,
    page
  };
}


export const SET_SEARCH_INDEX = 'SET_SEARCH_INDEX';

export function setSearchIndex(index) {
  return {
    type: SET_SEARCH_INDEX,
    index
  };
}

export function locationDidChange(location) {
  return function (dispatch, getState) {
    dispatch(setLocation(location));

    const match = _.get(location, 'pathname', '').match('/record/(\\d+)(?:/to/(\\d+))?/?$');

    if (match !== null) {
      const [, nextSourceId, nextTargetId] = match;

      const currentSourceId = getState().getIn(['sourceRecord', 'id']);
      const currentTargetId = getState().getIn(['targetRecord', 'id']);

      if (nextSourceId !== currentSourceId) {
        dispatch(fetchRecord(nextSourceId, 'SOURCE'));
        dispatch(setSourceRecordId(nextSourceId));
      }

      if (nextTargetId && nextTargetId !== currentTargetId) {
        dispatch(fetchRecord(nextTargetId, 'TARGET'));
        dispatch(setTargetRecordId(nextTargetId));
      }
    }
  };
}

export const SAVE_RECORD_SUCCESS = 'SAVE_RECORD_SUCCESS';

export function saveRecordSuccess(record) {
  return {type: SAVE_RECORD_SUCCESS, record};
}

export const SET_LOCATION = 'SET_LOCATION';

export function setLocation(location) {
  return {
    type: SET_LOCATION,
    location: location
  };
}

export const LOAD_SOURCE_RECORD = 'LOAD_SOURCE_RECORD';

export function loadSourceRecord(recordId) {
  return {
    type: LOAD_SOURCE_RECORD,
    id: recordId
  };
}

export const RESET_SOURCE_RECORD = 'RESET_SOURCE_RECORD';

export function resetSourceRecord() {
  return function (dispatch) {
    dispatch({
      'type': RESET_SOURCE_RECORD,
    });
    dispatch(updateMergedRecord());
  };
}

export const SET_SOURCE_RECORD = 'SET_SOURCE_RECORD';

export function setSourceRecord(record, subrecords, recordId) {
  return {
    'type': SET_SOURCE_RECORD,
    'record': record,
    'subrecords': subrecords,
    recordId
  };
}

export const LOAD_TARGET_RECORD = 'LOAD_TARGET_RECORD';

export function loadTargetRecord(recordId) {
  return {
    type: LOAD_TARGET_RECORD,
    id: recordId
  };
}

export const RESET_TARGET_RECORD = 'RESET_TARGET_RECORD';

export function resetTargetRecord() {
  return function (dispatch) {
    dispatch({
      'type': RESET_TARGET_RECORD,
    });
    dispatch(updateMergedRecord());
  };
}

export const SET_TARGET_RECORD = 'SET_TARGET_RECORD';

export function setTargetRecord(record, subrecords, recordId) {
  return {
    'type': SET_TARGET_RECORD,
    'record': record,
    'subrecords': subrecords,
    recordId
  };
}

export const SET_TARGET_RECORD_ERROR = 'SET_TARGET_RECORD_ERROR';

export function setTargetRecordError(error) {
  return {
    'type': SET_TARGET_RECORD_ERROR,
    'error': error
  };
}

export const SET_SOURCE_RECORD_ERROR = 'SET_SOURCE_RECORD_ERROR';

export function setSourceRecordError(error) {
  return {
    'type': SET_SOURCE_RECORD_ERROR,
    'error': error
  };
}

export const SWAP_RECORDS = 'SWAP_RECORDS';

export function swapRecords() {

  return function (dispatch, getState) {
    const sourceRecordId = getState().getIn(['sourceRecord', 'id']);
    const targetRecordId = getState().getIn(['targetRecord', 'id']);
    dispatch(setSourceRecordId(targetRecordId));
    dispatch(setTargetRecordId(sourceRecordId));

    if (targetRecordId) {
      dispatch(fetchRecord(targetRecordId, 'SOURCE'));
    } else {
      dispatch(resetSourceRecord());
    }

    if (sourceRecordId) {
      dispatch(fetchRecord(sourceRecordId, 'TARGET'));
    } else {
      dispatch(resetTargetRecord());
    }
  };
}

export const SET_SOURCE_RECORD_ID = 'SET_SOURCE_RECORD_ID';

export function setSourceRecordId(recordId) {
  return {'type': SET_SOURCE_RECORD_ID, 'recordId': recordId};
}

export const SET_TARGET_RECORD_ID = 'SET_TARGET_RECORD_ID';

export function setTargetRecordId(recordId) {
  return {'type': SET_TARGET_RECORD_ID, 'recordId': recordId};
}

export function updateMergedRecord() {
  return function (dispatch, getState) {
    const getMergeProfile = getState().getIn(['config', 'mergeProfiles', getState().getIn(['config', 'selectedMergeProfile']), 'record']);
    const defaultProfile = getState().getIn(['config', 'mergeProfiles']);
    const mergeProfile = getMergeProfile === undefined ? defaultProfile.first() : getMergeProfile;
    const subrecordMergeType = getState().getIn(['config', 'mergeProfiles', getState().getIn(['config', 'selectedMergeProfile']), 'subrecords', 'mergeType']);

    const mergeConfiguration = mergeProfile.get('mergeConfiguration');
    const validationRules = mergeProfile.get('validationRules');
    const postMergeFixes = mergeProfile.get('postMergeFixes');
    const newFields = mergeProfile.get('newFields');

    const preferredState = getState().getIn(['targetRecord', 'state']);
    const preferredRecord = preferredState === 'EMPTY' ? mergeProfile.get('targetRecord') : getState().getIn(['targetRecord', 'record']);
    const preferredHasSubrecords = preferredState === 'EMPTY' ? false : getState().getIn(['targetRecord', 'hasSubrecords']);
    const otherRecord = getState().getIn(['sourceRecord', 'record']);
    const otherRecordHasSubrecords = getState().getIn(['sourceRecord', 'hasSubrecords']);

    if (preferredRecord && otherRecord) { //targetRecord and sourceRecord
      const merge = createRecordMerger(mergeConfiguration);
      const validationRulesClone = _.clone(validationRules);
      if (subrecordMergeType === subrecordMergeTypes.DISALLOW_SUBRECORDS) {
        validationRulesClone.push(MergeValidation.otherRecordDoesNotHaveSubrecords);
        validationRulesClone.push(MergeValidation.preferredRecordDoesNotHaveSubrecords);
      }

      MergeValidation.validateMergeCandidates(validationRulesClone, preferredRecord, otherRecord, preferredHasSubrecords, otherRecordHasSubrecords)
        .then(() => merge(preferredRecord, otherRecord))
        .then((originalMergedRecord) => {
          if (!newFields) {
            return originalMergedRecord;
          }

          let mergedRecord = new MarcRecord(originalMergedRecord, {subfieldValues: false});

          newFields.forEach(field => {
            const fields = mergedRecord.fields.filter(fieldInMerged => {
              return field.tag === fieldInMerged.tag && _.isEqual(field.subfields, fieldInMerged.subfields);
            });

            if (fields.length === 0) mergedRecord.appendField({...field, uuid: uuid()});
          });

          return mergedRecord;
        })
        .then(mergedRecord => {
          return PostMerge.applyPostMergeModifications(postMergeFixes, preferredRecord, otherRecord, mergedRecord);
        })
        .then(result => {
          dispatch(setMergedRecord(result.record));
        })
        .catch(exceptCoreErrors(error => {
          dispatch(setMergedRecordError(error));
        }));

      // find pairs for subrecods
      const sourceSubrecordList = sourceSubrecords(getState());
      const targetSubrecordList = targetSubrecords(getState());

      const matchedSubrecordPairs = match(sourceSubrecordList, targetSubrecordList);

      dispatch(updateSubrecordArrangement(matchedSubrecordPairs));

      if (subrecordMergeType === subrecordMergeTypes.MERGE || subrecordMergeType === subrecordMergeTypes.SHARED) {
        dispatch(updateMergedSubrecords(matchedSubrecordPairs));
      }
    }
  };
}

export const SET_MERGED_RECORD = 'SET_MERGED_RECORD';

export function setMergedRecord(record) {
  return {
    'type': SET_MERGED_RECORD,
    'record': record
  };
}

export const EDIT_MERGED_RECORD = 'EDIT_MERGED_RECORD';

export function editMergedRecord(record) {
  return {
    'type': EDIT_MERGED_RECORD,
    'record': record
  };
}

export const SET_MERGED_RECORD_ERROR = 'SET_MERGED_RECORD_ERROR';

export function setMergedRecordError(error) {
  return {
    'type': SET_MERGED_RECORD_ERROR,
    'error': error
  };
}


export const CLEAR_MERGED_RECORD = 'CLEAR_MERGED_RECORD';

export function clearMergedRecord() {
  return {
    'type': CLEAR_MERGED_RECORD
  };
}

export const fetchRecord = (function () {
  const APIBasePath = __DEV__ ? 'http://localhost:3001/api' : '/api';
  const fetchSourceRecord = recordFetch(APIBasePath, loadSourceRecord, setSourceRecord, setSourceRecordError);
  const fetchTargetRecord = recordFetch(APIBasePath, loadTargetRecord, setTargetRecord, setTargetRecordError);
  return function (recordId, type) {
    return function (dispatch) {
      if (type !== 'SOURCE' && type !== 'TARGET') {
        throw new Error('fetchRecord type parameter must be either SOURCE or TARGET');
      }
      if (type === 'SOURCE') {
        return fetchSourceRecord(recordId, dispatch);
      }
      if (type === 'TARGET') {
        return fetchTargetRecord(recordId, dispatch);
      }
    };
  };

})();

function recordFetch(APIBasePath, loadRecordAction, setRecordAction, setRecordErrorAction) {
  let currentRecordId;
  return function (recordId, dispatch) {
    currentRecordId = recordId;
    // sets state to loading
    dispatch(loadRecordAction(recordId));

    return fetch(`${APIBasePath}/${recordId}`)
      .then(validateResponseStatus)
      .then(response => response.json())
      .then(json => {
        if (currentRecordId === recordId) {
          const {record, subrecords} = marcRecordsFrom(json.record, json.subrecords);
          dispatch(setRecordAction(record, subrecords, recordId));
          dispatch(updateMergedRecord());
        }
      }).catch(exceptCoreErrors((error) => {
        if (error instanceof FetchNotOkError) {
          switch (error.response.status) {
            case HttpStatus.NOT_FOUND: return dispatch(setRecordErrorAction('Tietuetta ei löytynyt'));
            case HttpStatus.INTERNAL_SERVER_ERROR: return dispatch(setRecordErrorAction('Tietueen lataamisessa tapahtui virhe.'));
          }
        }
        dispatch(setRecordErrorAction('There has been a problem with fetch operation: ' + error.message));
      }));
  };
}

function marcRecordsFrom(record, subrecords) {
  const marcRecord = new MarcRecord(record, {subfieldValues: false});
  const marcSubrecords = subrecords.map(record => new MarcRecord(record, {subfieldValues: false}));

  decorateFieldsWithUuid(marcRecord);
  marcSubrecords.forEach(decorateFieldsWithUuid);

  return {
    record: marcRecord,
    subrecords: marcSubrecords
  };
}

function validateResponseStatus(response) {
  if (response.status !== HttpStatus.OK) {
    throw new FetchNotOkError(response);
  }
  return response;
}

export const ADD_SOURCE_RECORD_FIELD = 'ADD_SOURCE_RECORD_FIELD';
export const REMOVE_SOURCE_RECORD_FIELD = 'REMOVE_SOURCE_RECORD_FIELD';

export function addSourceRecordField(field) {
  return {'type': ADD_SOURCE_RECORD_FIELD, field};
}
export function removeSourceRecordField(field) {
  return {'type': REMOVE_SOURCE_RECORD_FIELD, field};
}

export function toggleSourceRecordFieldSelection(fieldInSourceRecord) {
  return function (dispatch, getState) {
    const mergedRecord = getState().getIn(['mergedRecord', 'record']);
    const field = mergedRecord.fields.find(fieldInMergedRecord => fieldInMergedRecord.uuid === fieldInSourceRecord.uuid);

    if (field === undefined) {
      dispatch(addSourceRecordField(fieldInSourceRecord));
      dispatch(updateMergedRecord());
    } else {
      dispatch(removeSourceRecordField(fieldInSourceRecord));
    }

  };
}

export function setCompactSubrecordView(enabled) {
  return function (dispatch, getState) {

    const rowsToCompact = rowsWithResultRecord(getState()).map(row => row.rowId);

    dispatch({'type': TOGGLE_COMPACT_SUBRECORD_VIEW, enabled, rowsToCompact});
  };
}

