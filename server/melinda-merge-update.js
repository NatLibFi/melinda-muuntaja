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

import _ from 'lodash';
import { logger } from 'server/logger';
import uuid from 'uuid';

export function commitMerge(client, preferredRecord, mergedRecord) {

  const jobId = uuid.v4().slice(0,8);

  const preferredId = getRecordId(preferredRecord.record);

  if (preferredId === '000000000') {
    return createRecord(mergedRecord.record);
  }
  else {
    if (!isValidId(preferredId)) {
      return Promise.reject(new Error('Id not found for preferred record.'));
    }
    else {
      return updateRecord(preferredId, mergedRecord.record);
    }
  }

  function createRecord(record) {
    logger.log('info', `${jobId}] Creating new record`);
    return client.createRecord(record, {bypass_low_validation: 1, bypass_index_check: 1}).then(res => {
      logger.log('info', `${jobId}] Create record ok for ${res.recordId}`, res.messages);
      return _.assign({}, res, {operation: 'CREATE'});
    }).catch(err => {
      logger.log('info', `${jobId}] Failed to create record`, err);
      throw err;
    });
  }

  function updateRecord(recordId, record) {
    logger.log('info', `${jobId}] Updating record ${recordId}`);

    const idFields = record.fields.filter(field => field.tag === '001');

    idFields[0].value = recordId;
    
    return client.updateRecord(record, {bypass_low_validation: 1, bypass_index_check: 1}).then(res => {
      logger.log('info', `${jobId}] Update record ok for ${recordId}`, res.messages);
      return _.assign({}, res, {operation: 'UPDATE'});
    }).catch(err => {
      logger.log('info', `${jobId}] Failed to update record`, err);
      throw err;
    });
  }
}

function isValidId(id) {
  return id !== undefined && !isNaN(id);
}

function getRecordId(record) {
  return _.get(record.fields.filter(f => f.tag == '001'), '[0].value');
}