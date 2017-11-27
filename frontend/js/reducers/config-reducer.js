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
import _ from 'lodash';
import { SWITCH_MERGE_CONFIG } from '../ui-actions';
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
      return setConfiguration(state, action.userinfo);
  }
  return state;
}

function setConfiguration(state, userinfo) {
  let configPreset;

  const department = userinfo.department.toLowerCase();

  if (preset.hasOwnProperty(department)) configPreset = preset[department];
  else configPreset = preset.defaults;

  return state.set('mergeProfiles', Object.keys(configPreset).reduce((mergeProfiles, key) => {
    const mergeProfile = replaceConfigVariables(configPreset[key], userinfo, configPreset[key].lowTag);

    return mergeProfiles.set(key, Map({
      name: mergeProfile.name,
      description: mergeProfile.description,
      record: Map({
        'targetRecord': mergeProfile.record.targetRecord,
        'validationRules': mergeProfile.record.validationRules,
        'postMergeFixes': mergeProfile.record.postMergeFixes,
        'mergeConfiguration': mergeProfile.record.mergeConfiguration,
        'newFields': mergeProfile.record.newFields
      }),
      subrecords: Map({
        'mergeType': mergeProfile.subrecords.mergeType,
        'targetRecord': mergeProfile.subrecords.targetRecord,
        'validationRules': mergeProfile.subrecords.validationRules,
        'postMergeFixes': mergeProfile.subrecords.postMergeFixes,
        'mergeTargetRecordWithHost': mergeProfile.subrecords.mergeTargetRecordWithHost,
        'mergeConfiguration': mergeProfile.subrecords.mergeConfiguration,
        'newFields': mergeProfile.subrecords.newFields,
      })
    }));
  }, Map()));
}

function replaceConfigVariables(orig_config, userinfo, forcedLowTag = null) {
  let config = _.clone(orig_config);

  config = replacePropertyValue('[LOWTAG]', forcedLowTag || userinfo.department, config);

  return config;
}

function replacePropertyValue(regexp, newSubstr, object) {
  const newObject = _.clone(object);

  _.each(object, (val, key) => {
    if (typeof val === 'string') {
      newObject[key] = val.replace(regexp, newSubstr);
    } else if(typeof(val) === 'object' && val instanceof RegExp) {
      const { source, flags } = val;

      newObject[key] = new RegExp(source.replace(regexp, newSubstr), flags);
    } else if (typeof(val) === 'object') {
      newObject[key] = replacePropertyValue(regexp, newSubstr, val);
    } else {
      newObject[key] = val;
    }
  });

  return newObject;
}