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

import HttpStatus from 'http-status';
import {MarcRecord} from '@natlibfi/marc-record';
import fetch from 'isomorphic-fetch';
import {exceptCoreErrors} from '../utils';
import {FetchNotOkError} from '../errors';
import {v4 as uuid} from 'uuid';


import {
  INSERT_SUBRECORD_ROW, REMOVE_SUBRECORD_ROW, CHANGE_SOURCE_SUBRECORD_ROW, CHANGE_TARGET_SUBRECORD_ROW,
  CHANGE_SUBRECORD_ROW, SET_MERGED_SUBRECORDS, SET_SUBRECORD_ACTION, SET_MERGED_SUBRECORD, SET_MERGED_SUBRECORD_ERROR,
  EXPAND_SUBRECORD_ROW, COMPRESS_SUBRECORD_ROW, ADD_SOURCE_SUBRECORD_FIELD, REMOVE_SOURCE_SUBRECORD_FIELD,
  UPDATE_SUBRECORD_ARRANGEMENT, EDIT_MERGED_SUBRECORD, SAVE_SUBRECORD_START, SAVE_SUBRECORD_SUCCESS, SAVE_SUBRECORD_FAILURE
} from '../constants/action-type-constants';

import {SubrecordActionTypes} from 'commons/constants';
import createRecordMerger from '@natlibfi/marc-record-merge';
// import mergeConfiguration from '../config/merge-config';
import * as MergeValidation from '../marc-record-merge-validate-service';
import * as PostMerge from '../marc-record-merge-postmerge-service';
import {selectPreferredHostRecord, selectOtherHostRecord} from '../selectors/record-selectors';
import _ from 'lodash';
import {decorateFieldsWithUuid, selectRecordId, resetComponentHostLinkSubfield} from '../record-utils';
import * as subrecordMergeTypes from '../config/subrecord-merge-types';

export function expandSubrecordRow(rowId) {
  return {type: EXPAND_SUBRECORD_ROW, rowId};
}

export function compressSubrecordRow(rowId) {
  return {type: COMPRESS_SUBRECORD_ROW, rowId};
}

export function insertSubrecordRow(rowIndex) {
  return {'type': INSERT_SUBRECORD_ROW, rowIndex};
}

export function removeSubrecordRow(rowId) {
  return {'type': REMOVE_SUBRECORD_ROW, rowId};
}

export function changeSourceSubrecordRow(fromRowId, toRowId) {
  return {'type': CHANGE_SOURCE_SUBRECORD_ROW, fromRowId, toRowId};
}

export function changeTargetSubrecordRow(fromRowId, toRowId) {
  return {'type': CHANGE_TARGET_SUBRECORD_ROW, fromRowId, toRowId};
}

export function changeSubrecordRow(fromRowIndex, toRowIndex) {
  return {'type': CHANGE_SUBRECORD_ROW, fromRowIndex, toRowIndex};
}

export function setSubrecordAction(rowId, actionType) {
  return {'type': SET_SUBRECORD_ACTION, rowId, actionType};
}

export function setEverySubrecordAction() {
  return function (dispatch, getState) {
    getState().getIn(['subrecords', 'index']).forEach(rowId => {

      const subrecordRow = getState().getIn(['subrecords', rowId]).toJS();
      const hasSource = subrecordRow.sourceRecord !== undefined;
      const hasTarget = subrecordRow.targetRecord !== undefined;

      if (hasSource && hasTarget) {
        dispatch(setSubrecordAction(rowId, SubrecordActionTypes.MERGE));
      } else if (hasSource || hasTarget) {
        dispatch(setSubrecordAction(rowId, SubrecordActionTypes.COPY));
      } else {
        dispatch(setSubrecordAction(rowId, SubrecordActionTypes.UNSET));
      }

      dispatch(updateMergedSubrecord(rowId));
    });
  };
}


export function setEveryMatchedSubrecordAction() {
  return function (dispatch, getState) {
    getState().getIn(['subrecords', 'index']).forEach(rowId => {

      const subrecordRow = getState().getIn(['subrecords', rowId]).toJS();
      const hasSource = subrecordRow.sourceRecord !== undefined;
      const hasTarget = subrecordRow.targetRecord !== undefined;

      if (hasSource && hasTarget) {
        dispatch(setSubrecordAction(rowId, SubrecordActionTypes.MERGE));
        dispatch(updateMergedSubrecord(rowId));
      }

    });
  };
}


export function updateSubrecordArrangement(pairs) {
  return {'type': UPDATE_SUBRECORD_ARRANGEMENT, pairs};
}

export function changeSubrecordAction(rowId, actionType) {
  return function (dispatch) {
    dispatch(setSubrecordAction(rowId, actionType));
    dispatch(updateMergedSubrecord(rowId));
  };
}

export function updateMergedSubrecords() {
  return function (dispatch, getState) {
    const rows = getState().getIn(['subrecords', 'index']);

    const mergeProfile = getState().getIn(['config', 'mergeProfiles', getState().getIn(['config', 'selectedMergeProfile']), 'subrecords']);

    const preferredHostRecord = selectPreferredHostRecord(getState());
    const otherHostRecord = selectOtherHostRecord(getState());
    let targetRecord = mergeProfile.get('targetRecord');

    if (mergeProfile.has('mergeTargetRecordWithHost') && mergeProfile.get('mergeTargetRecordWithHost') !== undefined) targetRecord = mergeTargetRecordWithHost({targetRecord, otherHostRecord, preferredHostRecord, mergeConfiguration: mergeProfile.get('mergeTargetRecordWithHost')});

    Promise.all(rows.map((rowId) => {
      const row = getState().getIn(['subrecords', rowId]);

      const preferredRecord = row.get('targetRecord');
      const otherRecord = row.get('sourceRecord');

      return mergeSubrecord({preferredRecord: preferredRecord || targetRecord, otherRecord, preferredHostRecord, otherHostRecord, mergeProfile})
        .then(record => ({rowId, record}))
        .catch(error => ({rowId, error}));
    })).then((rows) => dispatch(setMergedSubrecords(rows, SubrecordActionTypes.MERGE)));
  };
}

export function setMergedSubrecords(rows, actionType) {
  return {'type': SET_MERGED_SUBRECORDS, rows, actionType};
}

export function updateMergedSubrecord(rowId) {
  return function (dispatch, getState) {

    const row = getState().getIn(['subrecords', rowId]);

    const selectedActionType = row.get('selectedAction');
    const preferredRecord = row.get('targetRecord');
    const otherRecord = row.get('sourceRecord');

    if (selectedActionType === SubrecordActionTypes.COPY) {
      if (preferredRecord && otherRecord) {
        throw new Error('Cannot copy both records');
      }

      let hostRecordId;
      let recordToCopy;

      if (preferredRecord) {
        hostRecordId = selectRecordId(selectPreferredHostRecord(getState()));
        recordToCopy = new MarcRecord(preferredRecord, {subfieldValues: false});
      } else {
        hostRecordId = selectRecordId(selectOtherHostRecord(getState()));
        recordToCopy = new MarcRecord(otherRecord, {subfieldValues: false});
      }

      // reset 773w
      recordToCopy.fields.filter(field => {
        return field.tag === '773' && field.subfields.filter(s => s.code === 'w').some(s => s.value === `(FI-MELINDA)${hostRecordId}`);
      }).map(resetComponentHostLinkSubfield);

      // Note: We don't handle LOW/SID tags when subrecord action=COPY.
      // LOW-SYNC will handle that after the record has been added to melinda.
      return dispatch(setMergedSubrecord(rowId, recordToCopy));

    }

    if (selectedActionType === SubrecordActionTypes.BLOCK) {
      return dispatch(setMergedSubrecord(rowId, undefined));
    }

    if (selectedActionType === SubrecordActionTypes.UNSET || selectedActionType === undefined) {
      return dispatch(setMergedSubrecord(rowId, undefined));
    }

    if (selectedActionType === SubrecordActionTypes.MERGE) {
      const mergeProfile = getState().getIn(['config', 'mergeProfiles', getState().getIn(['config', 'selectedMergeProfile']), 'subrecords']);

      const preferredHostRecord = selectPreferredHostRecord(getState());
      const otherHostRecord = selectOtherHostRecord(getState());

      let targetRecord = mergeProfile.get('targetRecord');

      if (mergeProfile.has('mergeTargetRecordWithHost') && mergeProfile.get('mergeTargetRecordWithHost') !== undefined) targetRecord = mergeTargetRecordWithHost({targetRecord, otherHostRecord, preferredHostRecord, mergeConfiguration: mergeProfile.get('mergeTargetRecordWithHost')});

      return mergeSubrecord({preferredRecord: preferredRecord || targetRecord, otherRecord, preferredHostRecord, otherHostRecord, mergeProfile})
        .then(record => dispatch(setMergedSubrecord(rowId, record)))
        .catch(error => dispatch(setMergedSubrecordError(rowId, error)));
    }
  };
}

function mergeTargetRecordWithHost({targetRecord, otherHostRecord, preferredHostRecord, mergeConfiguration}) {
  let sourceRecord, mergedRecord = _.clone(targetRecord);

  if (preferredHostRecord) {
    sourceRecord = _.clone(preferredHostRecord);

    if (mergeConfiguration.both) {
      const merge = createRecordMerger(mergeConfiguration.both);

      mergedRecord = merge(mergedRecord, sourceRecord);
    }
    if (mergeConfiguration.target) {
      const merge = createRecordMerger(mergeConfiguration.target);

      mergedRecord = merge(mergedRecord, sourceRecord);
    }
  }
  else {
    sourceRecord = _.clone(otherHostRecord);

    if (mergeConfiguration.both) {
      const merge = createRecordMerger(mergeConfiguration.both);

      mergedRecord = merge(mergedRecord, sourceRecord);
    }
    if (mergeConfiguration.source) {
      const merge = createRecordMerger(mergeConfiguration.source);

      mergedRecord = merge(mergedRecord, sourceRecord);
    }
  }

  mergedRecord.fields.forEach((field) => {
    delete field.wasUsed;
    delete field.fromOther;
  });

  return mergedRecord;
}

function mergeSubrecord({preferredRecord, otherRecord, preferredHostRecord, otherHostRecord, mergeProfile}) {
  const mergeConfiguration = mergeProfile.get('mergeConfiguration');
  const newFields = mergeProfile.get('newFields');
  const validationRules = _.clone(mergeProfile.get('validationRules'));
  const postMergeFixes = _.clone(mergeProfile.get('postMergeFixes'));

  let preferredHostRecordId, otherHostRecordId;

  if (preferredHostRecord) preferredHostRecordId = selectRecordId(preferredHostRecord);
  if (otherHostRecord) otherHostRecordId = selectRecordId(otherHostRecord);

  if (otherRecord) {
    if (mergeProfile.get('mergeType') === subrecordMergeTypes.SHARED) {
      if (selectRecordId(preferredRecord) === selectRecordId(otherRecord)) {
        return Promise.resolve(preferredRecord);
      }

      postMergeFixes.unshift(PostMerge.add035zFromOther);
      postMergeFixes.unshift(PostMerge.addLOWSIDFieldsFromOther);
    }
    else {
      const sortMergedRecordFieldsIndex = postMergeFixes.indexOf(PostMerge.sortMergedRecordFields);
      if (sortMergedRecordFieldsIndex === -1) {
        postMergeFixes.push(PostMerge.select773Fields(preferredHostRecordId, otherHostRecordId));
      }
      else {
        // insert select773 just before sort
        postMergeFixes.splice(sortMergedRecordFieldsIndex, 0, PostMerge.select773Fields(preferredHostRecordId, otherHostRecordId));
      }
    }

    if (mergeProfile.get('mergeType') === subrecordMergeTypes.MERGE) {
      validationRules.push(MergeValidation.recordsHaveDifferentIds);
    }

    const merge = createRecordMerger(mergeConfiguration);

    return MergeValidation.validateMergeCandidates(validationRules, preferredRecord, otherRecord)
      .then(() => merge(preferredRecord, otherRecord))
      .then((originalMergedRecord) => {
        if (!newFields) return originalMergedRecord;
        var mergedRecord = new MarcRecord(originalMergedRecord, {subfieldValues: false});

        newFields.forEach(field => {
          const fields = mergedRecord.fields.filter(fieldInMerged => {
            return field.tag === fieldInMerged.tag && _.isEqual(field.subfields, fieldInMerged.subfields);
          });

          if (fields.length === 0) mergedRecord.appendField({...field, uuid: uuid()});
        });

        return mergedRecord;
      })
      .then(mergedRecord => PostMerge.applyPostMergeModifications(postMergeFixes, preferredRecord, otherRecord, mergedRecord))
      .then(result => {
        return result.record;
      }).catch(error => {
        return Promise.reject(error);
      });

  } else {
    return Promise.reject(new Error('Cannot merge undefined records'));
  }
}

export function editMergedSubrecord(rowId, record) {
  return {'type': EDIT_MERGED_SUBRECORD, rowId, record};
}

export function setMergedSubrecord(rowId, record) {
  return {'type': SET_MERGED_SUBRECORD, rowId, record};
}

export function setMergedSubrecordError(rowId, error) {
  return {'type': SET_MERGED_SUBRECORD_ERROR, rowId, error};
}

export function addSourceSubrecordField(rowId, field) {
  return {'type': ADD_SOURCE_SUBRECORD_FIELD, rowId, field};
}
export function removeSourceSubrecordField(rowId, field) {
  return {'type': REMOVE_SOURCE_SUBRECORD_FIELD, rowId, field};
}

export function toggleSourceSubrecordFieldSelection(rowId, fieldInSourceRecord) {
  return function (dispatch, getState) {

    const row = getState().getIn(['subrecords', rowId]);
    const mergedRecord = row.get('mergedRecord');

    const field = mergedRecord.fields.find(fieldInMergedRecord => fieldInMergedRecord.uuid === fieldInSourceRecord.uuid);

    if (field === undefined) {
      dispatch(addSourceSubrecordField(rowId, fieldInSourceRecord));
    } else {
      dispatch(removeSourceSubrecordField(rowId, fieldInSourceRecord));
    }

  };
}

export const saveSubrecord = (function () {
  const APIBasePath = __DEV__ ? 'http://localhost:3001/api' : '/api';

  return function (rowId, recordId, record) {

    return function (dispatch) {

      dispatch(saveSubrecordStart(rowId, recordId));

      const fetchOptions = {
        method: 'PUT',
        body: JSON.stringify({
          record: record
        }),
        headers: new Headers({
          'Content-Type': 'application/json'
        }),
        credentials: 'include'
      };

      return fetch(`${APIBasePath}/${recordId}`, fetchOptions)
        .then(validateResponseStatus)
        .then(response => response.json())
        .then(json => {

          const marcRecord = new MarcRecord(json.record, {subfieldValues: false});
          decorateFieldsWithUuid(marcRecord);

          dispatch(saveSubrecordSuccess(rowId, marcRecord));

        }).catch(exceptCoreErrors((error) => {

          if (error instanceof FetchNotOkError) {
            switch (error.response.status) {
              case HttpStatus.BAD_REQUEST: return dispatch(saveSubrecordFailure(rowId, recordId, new Error(error.message)));
              case HttpStatus.NOT_FOUND: return dispatch(saveSubrecordFailure(rowId, recordId, new Error('Tietuetta ei löytynyt')));
              case HttpStatus.INTERNAL_SERVER_ERROR: return dispatch(saveSubrecordFailure(rowId, recordId, new Error('Tietueen tallentamisessa tapahtui virhe.')));
            }
          }

          dispatch(saveSubrecordFailure(rowId, recordId, new Error('There has been a problem with fetch operation: ' + error.message)));

        }));
    };
  };
})();

export function saveSubrecordStart(rowId, recordId) {
  return {type: SAVE_SUBRECORD_START, rowId, recordId};
}

export function saveSubrecordSuccess(rowId, record) {
  return {type: SAVE_SUBRECORD_SUCCESS, rowId, record};
}

export function saveSubrecordFailure(rowId, recordId, error) {
  return {type: SAVE_SUBRECORD_FAILURE, rowId, recordId, error};
}

function validateResponseStatus(response) {
  if (response.status !== HttpStatus.OK) {

    return response.text().then(errorReason => {
      throw new FetchNotOkError(response, errorReason);
    });
  }
  return response;
}
