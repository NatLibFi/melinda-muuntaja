/**
*
* @licstart  The following is the entire license notice for the JavaScript code in this file.
*
* UI for merging MARC records
*
* Copyright (C) 2015-2017 University Of Helsinki (The National Library Of Finland)
*
* This file is part of marc-merge-ui
*
* marc-merge-ui program is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as
* published by the Free Software Foundation, either version 3 of the
* License, or (at your option) any later version.
*
* oai-pmh-server-backend-module-melinda is distributed in the hope that it will be useful,
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
import { SWITCH_MERGE_CONFIG } from '../constants/action-type-constants';
import { CREATE_SESSION_SUCCESS } from 'commons/constants/action-type-constants';
import { preset } from '../config/config-presets';

const INITIAL_STATE = Map({
  selectedMergeProfile: 'default',
  mergeProfiles: Map()
});

export default function ui(state = INITIAL_STATE, action) {
  switch (action.type) {
    case SWITCH_MERGE_CONFIG:
      return state.set('selectedMergeProfile', action.config);

    case CREATE_SESSION_SUCCESS:
      return setConfiguration(state, action.userinfo.department.toLowerCase());
  }
  return state;
}

function setConfiguration(state, department) {
  let configPreset;

  if (preset.hasOwnProperty(department)) configPreset = preset[department];
  else configPreset = preset.defaults;

  return state.set('mergeProfiles', Object.keys(configPreset).reduce((mergeProfiles, key) => mergeProfiles.set(key, Map({
    name: configPreset[key].name,
    record: Map({
      'targetRecord': configPreset[key].record.targetRecord,
      'validationRules': configPreset[key].record.validationRules,
      'postMergeFixes': configPreset[key].record.postMergeFixes,
      'mergeConfiguration': configPreset[key].record.mergeConfiguration,
      'newFields': configPreset[key].record.newFields
    }),
    subrecords: Map({
      'mergeType': configPreset[key].subrecords.mergeType,
      'targetRecord': configPreset[key].subrecords.targetRecord,
      'validationRules': configPreset[key].subrecords.validationRules,
      'postMergeFixes': configPreset[key].subrecords.postMergeFixes,
      'mergeTargetRecordWithHost': configPreset[key].subrecords.mergeTargetRecordWithHost,
      'mergeConfiguration': configPreset[key].subrecords.mergeConfiguration,
      'newFields': configPreset[key].subrecords.newFields
    })
  })), Map()));
}
