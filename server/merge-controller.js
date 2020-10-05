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

import express from 'express';
import cors from 'cors';
import {corsOptions, requireBodyParams} from 'server/utils';
import bodyParser from 'body-parser';
import {MarcRecord} from '@natlibfi/marc-record';
import cookieParser from 'cookie-parser';
import httpStatus from 'http-status';
import {commitMerge} from './melinda-merge-update';
import {readSessionMiddleware} from 'server/session-controller';
import _ from 'lodash';
import {createArchive} from './archive-service';
import {createApiClient} from '@natlibfi/melinda-rest-api-client-js';
import {createSubrecordPicker} from '@natlibfi/melinda-commons';
import {createLogger} from '@natlibfi/melinda-backend-commons';
import {sruUrl, restApiUrl} from './config';



const logger = createLogger();

logger.log('info', `merge-controller endpoint: ${restApiUrl}`);

export const mergeController = express();

mergeController.use(cookieParser());
mergeController.use(bodyParser.json({limit: '15mb'}));
mergeController.use(readSessionMiddleware);
mergeController.set('etag', false);
mergeController.options('/commit-merge', cors(corsOptions)); // enable pre-flight
mergeController.post('/commit-merge', cors(corsOptions), requireSession, requireBodyParams('operationType', 'subrecordMergeType', 'otherRecord', 'mergedRecord', 'unmodifiedRecord'), initCommit);

function initCommit(req, res) {
  const {username, password} = req.session;

  const {operationType, subrecordMergeType} = req.body;

  const [otherRecord, mergedRecord, unmodifiedRecord] =
    [req.body.otherRecord, req.body.mergedRecord, req.body.unmodifiedRecord].map(transformToMarcRecordFamily);

  const preferredRecord = req.body.preferredRecord ? transformToMarcRecordFamily(req.body.preferredRecord) : {record: new MarcRecord()};

  const subrecordPicker = createSubrecordPicker(sruUrl, true);

  const clientConfig = {
    restApiUrl,
    restApiUsername: username,
    restApiPassword: password,
    cataloger: username
  };

  const client = createApiClient(clientConfig);

  logger.log('debug', `Operation type: ${JSON.stringify(operationType)}`);
  logger.log('debug', `Subrecord merge type: ${JSON.stringify(subrecordMergeType)}`);
  logger.log('debug', `Other record: ${JSON.stringify(otherRecord)}`);
  logger.log('debug', `Prefered record: ${JSON.stringify(preferredRecord)}`);
  logger.log('debug', `Merged record: ${JSON.stringify(mergedRecord)}`);

  commitMerge(client, operationType, subrecordMergeType, otherRecord, preferredRecord, mergedRecord)
    .then((response) => {
      logger.log('info', `Commit merge successful ${JSON.stringify(response)}`);
      const mergedMainRecordResult = _.get(response, '[0]');

      createArchive(username, otherRecord, preferredRecord, mergedRecord, unmodifiedRecord, mergedMainRecordResult.recordId).then((res) => {
        logger.log('info', `Created archive file of the merge action: ${res.filename} (${res.size} bytes)`);
      });

      const createdRecordId = mergedMainRecordResult.recordId;
      const subrecordIdList = _.chain(response).filter(res => res.operation === 'CREATE').map('recordId').tail().value();

      client.read(createdRecordId).then((record) =>
        Promise.resolve(subrecordPicker.readAllSubrecords(createdRecordId)).then(({records}) => {
          if (record === undefined) {
            logger.log('debug', `Record ${createdRecordId} appears to be empty record.`);
            return res.sendStatus(httpStatus.NOT_FOUND);
          }
          const subrecords = records;
          const subrecordsById = _.zipObject(subrecords.map(selectRecordId), subrecords);
          const subrecordsInRequestOrder = subrecordIdList.map(id => subrecordsById[id]);

          if (_.difference(subrecords, subrecordsInRequestOrder).length !== 0) {
            logger.log('info', `Warning: merge request had ${subrecords.length} subrecords while merged response had ${subrecordsInRequestOrder.length}`);
          }

          const response = _.extend({}, mergedMainRecordResult, {
            record,
            subrecords: subrecordsInRequestOrder
          });

          res.status(httpStatus.OK).send(response);
        }).catch(error => {
          logger.log('error', error);
          return res.status(httpStatus.INTERNAL_SERVER_ERROR).send(error);
        })
      ).catch(error => {
        logger.log('error', error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).send(error);
      });
    }).catch(error => {
      logger.log('error', error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).send(error);
    });

  function transformToMarcRecordFamily(json) {
    if (!json) return;

    return {
      record: transformToMarcRecord(json.record),
      subrecords: json.subrecords.map(transformToMarcRecord)
    };
  }

  function transformToMarcRecord(json) {
    const {sourceRecordId, preferredRecordId} = json;
    return {...new MarcRecord(json, {subfieldValues: false}), sourceRecordId, preferredRecordId};
  }

  function selectRecordId(record) {

    const field001List = record.fields.filter(field => field.tag === '001');

    if (field001List.length === 0) {
      throw new Error('Could not parse record id');
    } else {
      return field001List[0].value;
    }
  }
}

function requireSession(req, res, next) {
  const username = _.get(req, 'session.username');
  const password = _.get(req, 'session.password');

  if (username && password) {
    return next();
  }

  res.sendStatus(httpStatus.UNAUTHORIZED);
}
