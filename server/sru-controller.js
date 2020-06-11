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

import express from 'express';
import cors from 'cors';
import {readEnvironmentVariable, corsOptions} from 'server/utils';
import {logger} from 'server/logger';
import marc_record_converters from '@natlibfi/marc-record-converters';
import createSruClient from '@natlibfi/sru-client';

const RECORDS_PER_PAGE = 10;
const sruClient = createSruClient({
  serverUrl: readEnvironmentVariable('SRU_URL'),
  recordSchema: 'marcxml',
  maximumRecords: RECORDS_PER_PAGE
});

export const sruController = express();

sruController.options('/', cors(corsOptions)); // enable pre-flight

sruController.get('/', cors(corsOptions), (req, res) => {
  const records = [];
  const {q, page = 1} = req.query;
  const startRecord = (page - 1) * RECORDS_PER_PAGE + 1;

  logger.log('info', `SRU query: '${q}'`);

  sruClient.searchRetrieve({query: req.query.q, offset: startRecord})
    .on('record', record => {
      if (records.length < RECORDS_PER_PAGE) {
        records.push(record);

        if (records.length === RECORDS_PER_PAGE) {
          sendResponse();
        }
      }
    })
    .on('end', () => {
      if (!res.headerSent) {
        sendResponse();
      }
    })
    .on('error', err => {
      logger.log('error', 'SRU error:', err);
      res.status(500).send(err);
    });

  function sendResponse() {
    logger.log('info', `SRU records found: ${records.length}`);
    res.send({
      numberOfRecords: records.length,
      numberOfPages: Math.ceil(records.length / RECORDS_PER_PAGE),
      currentPage: page,
      records: records.map(recordxml => marc_record_converters.marc21slimXML.from(recordxml)),
    });
  }
});
