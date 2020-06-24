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

import {executeTransaction, RollbackError} from './async-transaction';
import _ from 'lodash';
import {logger} from 'server/logger';
import {v4 as uuid} from 'uuid';

const FUTURE_HOST_ID_PLACEHOLDER = '(FI-MELINDA)[future-host-id]';

export function commitMerge(client, operationType, subrecordMergeType, otherRecord, preferredRecord, mergedRecord) {

  const jobId = uuid().slice(0, 8);

  if (operationType == 'CREATE') {
    return createRecord(mergedRecord.record).then(saveSubrecords).catch(error => {
      error.message += ' (rollback was successful)';
      logger.log('info', `${jobId}] Rollback was successful`);
      throw error;
    });
  }
  else if (operationType == 'UPDATE') {
    const idValidation = validateIds(mergedRecord);

    if (idValidation.error) {
      return Promise.reject(idValidation.error);
    }

    return updateRecord(mergedRecord.record).then(saveSubrecords).catch(error => {
      error.message += ' (rollback was successful)';
      logger.log('info', `${jobId}] Rollback was successful`);
      throw error;
    });
  }
  else return Promise.reject(new Error(`Unknown operationType ${operationType}.`));

  function saveSubrecords(res) {
    if (mergedRecord.subrecords.length === 0 || subrecordMergeType === 'KEEP_BOTH') return [res];

    const newParentRecordId = res.recordId;

    const mergedRecordRollbackAction = preferredRecord ? () => updateRecord(preferredRecord) : () => deleteRecordById(newParentRecordId);

    mergedRecord.subrecords = mergedRecord.subrecords.map(setParentRecordId(newParentRecordId));

    let otherSubrecordActions = [];

    if (subrecordMergeType === 'SHARED') {
      otherSubrecordActions = otherRecord.subrecords.map(rec => {
        return {
          action: () => deleteRecordFromMelinda(rec),
          rollback: () => undeleteRecordFromMelinda(getRecordId(rec))
        };
      });
    }

    const mergedSubrecordActions = mergedRecord.subrecords.map(record => {
      const originalRecord = preferredRecord ? findRecordById(getRecordId(record), preferredRecord.subrecords) : null;

      if (originalRecord) {
        return {
          action: () => updateRecord(record),
          rollback: () => updateRecord(originalRecord)
        };
      }
      else {
        return {
          action: () => createRecord(record),
          rollback: (res) => deleteRecordById(res.recordId)
        };
      }
    });

    return executeTransaction(_.concat(
      otherSubrecordActions,
      mergedSubrecordActions
    ), [mergedRecordRollbackAction]).then(function (results) {
      results.unshift(res);
      logger.log('info', `${jobId}] Commit merge job ${jobId} completed.`);
      return results;
    }).catch(function (error) {
      if (error instanceof RollbackError) {
        logger.log('error', `${jobId}] Rollback failed`);
        logger.log('error', jobId, error);
        logger.log('error', `${jobId}] Commit merge job ${jobId} failed.`);
        logger.log('info', `${jobId}] Rollback failed`);
        logger.log('info', jobId, error);
        logger.log('info', `${jobId}] Commit merge job ${jobId} failed.`);
      } else {
        error.message += ' (rollback was successful)';
        logger.log('info', `${jobId}] Rollback was successful`);
        logger.log('info', `${jobId}] Error in transaction`, error);
        logger.log('info', `${jobId}] Commit merge job ${jobId} failed.`);
      }
      throw error;
    });
  }

  function createRecord(record) {
    logger.log('info', `${jobId}] Creating new record`);

    return client.create(record, {noop: 0, unique: 0}).then(res => {
      logger.log('info', `${jobId}] Create record ok for ${res.recordId}`), res.messages;
      return _.assign({}, res, {operation: 'CREATE'});
    }).catch(err => {
      logger.log('info', `${jobId}] Failed to create record ${err.status} - ${err.message}`);
      throw err;
    });
  }

  function undeleteRecordFromMelinda(recordId) {
    logger.log('info', `${jobId}] Undeleting ${recordId}`);
    return client.read(recordId).then(({record}) => {
      record.get(/^STA$/u).forEach(field => record.removeField(field));
      updateRecordLeader(record, 5, 'c');
      return client.updateRecord({params: {noop: 0}, body: JSON.stringify(record)}, recordId).then(res => {
        logger.log('info', `${jobId}] Undelete ok for ${recordId}`, res.messages);
        return _.assign({}, res, {operation: 'UNDELETE'});
      });
    }).catch(err => {
      logger.log('info', `${jobId}] Failed to undelete record`, err);
      throw err;
    });
  }

  function deleteRecordFromMelinda(record) {
    const recordId = getRecordId(record);
    logger.log('info', `${jobId}] Deleting ${recordId}`);

    record.appendField(['STA', '', '', 'a', 'DELETED']);
    updateRecordLeader(record, 5, 'd');

    return client.update(record, recordId, {noop: 0}).then(res => {
      logger.log('info', `${jobId}] Delete ok for ${recordId}`, res.messages);
      return _.assign({}, res, {operation: 'DELETE'});
    }).catch(err => {
      logger.log('info', `${jobId}] Failed to delete record`, err);
      throw err;
    });
  }

  function updateRecord(record) {
    const recordId = getRecordId(record);
    logger.log('info', `${jobId}] Updating record ${recordId}`);

    return client.update(record, recordId, {noop: 0}).then(res => {
      logger.log('info', `${jobId}] Update record ok for ${recordId}`, res.messages);
      return _.assign({}, res, {operation: 'UPDATE'});
    }).catch(err => {
      logger.log('info', `${jobId}] Failed to update record ${recordId}`, err);
      throw err;
    });
  }

  function deleteRecordById(recordId) {
    logger.log('info', `${jobId}] Deleting ${recordId}`);
    return client.read(recordId).then(({record}) => {
      record.appendField(['STA', '', '', 'a', 'DELETED']);
      updateRecordLeader(record, 5, 'd');
      return client.update(record, recordId, {noop: 0}).then(res => {
        logger.log('info', `${jobId}] Delete ok for ${recordId}`, res.messages);
        return _.assign({}, res, {operation: 'DELETE'});
      });
    }).catch(err => {
      logger.log('info', `${jobId}] Failed to delete record`, err);
      throw err;
    });
  }
}

function setParentRecordId(id) {
  return (subrecord) => {
    logger.log('debug', `Setting parent id ${id} to subrecord`);
    const f773s = subrecord.get(/^773$/u);
    const updatedF773s = f773s.map(field => {
      field.subfields = field.subfields.map(sub => {
        if (sub.code === 'w' && sub.value === FUTURE_HOST_ID_PLACEHOLDER) {
          return _.assign({}, sub, {value: `(FI-MELINDA)${id}`});
        }
        return sub;
      });
      return field;
    });
    f773s.forEach(field => subrecord.removeField(field));
    updatedF773s.forEach(field => subrecord.appendField(field));
    return subrecord;
  };
}

function validateIds(family) {
  if (!isValidId(getRecordId(family.record))) {
    return notValid('Id not found for record.');
  }

  const invalidOtherSubrecordIndex = _.findIndex(family.subrecords, (record) => !isValidId(getRecordId(record)));
  if (invalidOtherSubrecordIndex !== -1) {
    return notValid(`Id not found for ${invalidOtherSubrecordIndex + 1}. subrecord from record.`);
  }

  return {
    ok: true
  };

  function notValid(message) {
    return {
      error: new Error(message)
    };
  }
}

function findRecordById(recordId, records) {
  return records.filter(record => getRecordId(record) === recordId).shift();
}

function isValidId(id) {
  return id !== undefined && !isNaN(id) && id !== '';
}

function getRecordId(record) {
  const [f001] = record.get(/^001$/);
  if (f001 === undefined) {
    return '';
  }
  return f001.value;
}

function updateRecordLeader(record, index, characters) {
  record.leader = record.leader.substr(0, index) + characters + record.leader.substr(index + characters.length);
}