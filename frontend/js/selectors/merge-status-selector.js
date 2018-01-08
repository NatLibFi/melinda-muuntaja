/**
*
* @licstart  The following is the entire license notice for the JavaScript code in this file.
*
* UI for transforming MARC records
*
* Copyright (C) 2015-2017 University Of Helsinki (The National Library Of Finland)
*
* This file is part of melinda-eresource-tool
*
* melinda-eresource-tool program is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as
* published by the Free Software Foundation, either version 3 of the
* License, or (at your option) any later version.
*
* melinda-eresource-tool is distributed in the hope that it will be useful,
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

import _ from 'lodash';
import { createSelector } from 'reselect';
import { subrecordRows } from './subrecord-selectors';
import { subrecordMergeType } from './config-selectors';
import { CommitMergeStates } from '../constants';
import * as subrecordMergeTypes from '../config/subrecord-merge-types';

const mergedRecordState = state => state.getIn(['mergedRecord', 'state']);
const commitMergeStatus = state => state.getIn(['mergeStatus', 'status']) || CommitMergeStates.COMMIT_MERGE_NOT_STARTED;

const allSubrecordActionsAreDefined = createSelector([subrecordRows], (subrecordRows) => {

  const firstUndefinedActionIndex = _.findIndex(subrecordRows, ({sourceRecord, targetRecord, selectedAction, mergeError}) => {
    return mergeError !== undefined || selectedAction === undefined && (sourceRecord !== undefined || targetRecord !== undefined);
  });

  return (firstUndefinedActionIndex === -1);

});

export const mergeButtonEnabled = createSelector(
  [mergedRecordState, commitMergeStatus, subrecordMergeType, allSubrecordActionsAreDefined], 
  (mergedRecordState, commitMergeStatus, subrecordMergeType, allSubrecordActionsAreDefined) => {

    const disablingCommitMergeStates = [CommitMergeStates.COMMIT_MERGE_ONGOING, CommitMergeStates.COMMIT_MERGE_COMPLETE];

    const mergeAvailable = !_.includes(disablingCommitMergeStates, commitMergeStatus);
    const subrecordsReady = subrecordMergeType === subrecordMergeTypes.KEEP_BOTH || allSubrecordActionsAreDefined;
    return (mergedRecordState === 'LOADED' && mergeAvailable && subrecordsReady);
  }
);

export const recordSaveActionAvailable = createSelector([mergedRecordState], (mergedRecordState) => {
  const enableSaveActionStates = ['SAVE_ONGOING', 'SAVE_FAILED', 'SAVED'];
  return _.includes(enableSaveActionStates, mergedRecordState);
});

export const subrecordActionsEnabled = createSelector([commitMergeStatus, subrecordMergeType], (commitMergeStatus, subrecordMergeType) => {
  return commitMergeStatus !== CommitMergeStates.COMMIT_MERGE_COMPLETE && (subrecordMergeType === subrecordMergeTypes.MERGE || subrecordMergeType === subrecordMergeTypes.SHARED);
});

export const hostRecordActionsEnabled = createSelector([commitMergeStatus], (commitMergeStatus) => {
  return commitMergeStatus !== CommitMergeStates.COMMIT_MERGE_COMPLETE;
});
