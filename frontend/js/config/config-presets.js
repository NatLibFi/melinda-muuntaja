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

import TargetRecord from './target-record';
import { preset as MergeValidationPreset } from '../marc-record-merge-validate-service';
import { preset as PostMergePreset } from '../marc-record-merge-postmerge-service';

import mergeConfigurations from './merge-configs';

const defaultPreset = {
  targetRecord: TargetRecord,
  mergeConfigurations: {
    default: mergeConfigurations.default
  },
  validationRules: MergeValidationPreset.defaults,
  postMergeFixes: PostMergePreset.defaults
};

export const preset = {
  defaults: defaultPreset,
  aleph: {
    targetRecord: TargetRecord,
    mergeConfigurations: mergeConfigurations,
    validationRules: MergeValidationPreset.defaults,
    postMergeFixes: PostMergePreset.defaults
  }
};