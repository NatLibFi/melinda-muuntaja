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

import { Map   } from 'immutable';
import _ from 'lodash';
import { SWITCH_MERGE_CONFIG, SWITCH_MERGE_TYPE } from '../ui-actions';
import { CREATE_SESSION_SUCCESS } from 'commons/constants/action-type-constants';
import { printToE } from '../config/config-presets';
import { eToPrint } from '../config/e-to-print/config-presets';

const INITIAL_STATE = Map({
  selectedMergeProfile: 'default',
  mergeProfiles: Map(),
  userInfo: Map(),
  mergeType: 'printToE'
});

export default function ui(state = INITIAL_STATE, action) {
  const userinfo = state.get('userInfo');
  switch (action.type) {
    case SWITCH_MERGE_TYPE:
      return setConfiguration(state, userinfo, action.config);
    case SWITCH_MERGE_CONFIG:
      window.localStorage.setItem('muuntajaConfig', action.config);
      return state.set('selectedMergeProfile', action.config);

    case CREATE_SESSION_SUCCESS:
      return setConfiguration(state, action.userinfo);
  }
  return state;
}

function setConfiguration(state, userinfo, mergeType = 'printToE') {
  const configPresets = [printToE, eToPrint]; // TODO: create separate file for all mergetype definitions and import them here
  const presets = mergeType ? configPresets.find(preset => preset.mergeType === mergeType) : printToE;
  let configPreset;
  const department = userinfo.department.toLowerCase();
  
  if (presets.hasOwnProperty(department)) configPreset = presets[department];
  else configPreset = presets.defaults;
  return setMergeProfiles(state, configPreset, userinfo, mergeType);
}

function setMergeProfiles (state, configPreset, userinfo, mergeType) {
  return state.set('mergeProfiles', Object.keys(configPreset).reduce((mergeProfiles, key) => {
    if (configPreset[key] === undefined) return mergeProfiles;

    const mergeProfile = replaceConfigVariables(configPreset[key], userinfo, configPreset[key].lowTag);
    return mergeProfiles.set(key, Map({
      name: mergeProfile.name,
      description: mergeProfile.description,
      mergeType: mergeProfile.mergeType,
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
  }, Map()))
    .set('userInfo', userinfo)
    .set('mergeType', mergeType)
    .set('selectedMergeProfile', 'default');
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
