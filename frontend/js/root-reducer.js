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

import { Map } from 'immutable';
import { combineReducers } from 'redux-immutable';

import { RESET_STATE } from './ui-actions';

import session from 'commons/reducers/session-reducer';
import subrecords from './reducers/subrecord-reducer';
import location from './reducers/location-reducer';
import sourceRecord from './reducers/source-record-reducer';
import targetRecord from './reducers/target-record-reducer';
import mergedRecord from './reducers/merged-record-reducer';
import mergeStatus from  './reducers/merge-status-reducer';
import config from  './reducers/config-reducer';
import search from  './reducers/search-reducer';
import ui from  './reducers/ui-reducer';

export const DEFAULT_MERGED_RECORD = Map({
  state: 'EMPTY',
});

export default function reducer(state = Map(), action) {
  if (action.type === RESET_STATE) {
    state = Map();
  }

  let rawState = combinedRootReducer(state, action);
  return normalizeMergedRecord(rawState);
}

export const combinedRootReducer = combineReducers({
  ui,
  location,
  session,
  sourceRecord,
  targetRecord,
  mergedRecord,
  mergeStatus,
  subrecords,
  config,
  search
});

function normalizeMergedRecord(state) {
  const sourceRecordStatus = state.getIn(['sourceRecord', 'state']);
  const targetRecordStatus = state.getIn(['targetRecord', 'state']);

  if (sourceRecordStatus == 'LOADING' || targetRecordStatus == 'LOADING') {
    return state.set('mergedRecord', DEFAULT_MERGED_RECORD);
  }
  return state;
}
