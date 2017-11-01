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

import express from 'express';
import cors from 'cors';
import { readEnvironmentVariable, corsOptions } from 'server/utils';
import { logger } from 'server/logger';
import bodyParser from 'body-parser';
import MarcRecord from 'marc-record-js';
import cookieParser from 'cookie-parser';
import HttpStatus from 'http-status-codes';
import { commitMerge } from './melinda-merge-update';
import { readSessionMiddleware } from 'server/session-controller';
import _ from 'lodash';
import { createArchive } from './archive-service';
import marc_record_converters from '@natlibfi/marc-record-converters';

const sruClient = require('@natlibfi/sru-client')({
  url: readEnvironmentVariable('SRU_URL'),
  recordSchema: 'marcxml',
  maximumRecords: 15 
});

console.log(sruClient);

export const sruController = express();

sruController.options('/', cors(corsOptions)); // enable pre-flight

sruController.get('/', cors(corsOptions), (req, res) => {
  logger.log('info', `SRU query: '${req.query.q}'`);
  sruClient.searchRetrieve(req.query.q).then(result => {
    logger.log('info', `SRU records found: ${result.numberOfRecords}`);

    result.records = result.records.map(recordxml => marc_record_converters.marc21slimXML.from(recordxml));

    res.send(result);
  }).catch(error => {
    logger.log('error', 'SRU error:', error);
    res.status(500).send(error);
  });
});
