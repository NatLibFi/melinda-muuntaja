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

'use strict';
import express from 'express';
import path from 'path';
import { logger, expressWinston } from 'server/logger';
import { readEnvironmentVariable } from 'server/utils';
import { sessionController } from 'server/session-controller';
import { marcIOController } from 'server/marc-io-controller';
import { mergeController } from './merge-controller';
import { sruController } from './sru-controller';
import cookieParser from 'cookie-parser';

//const NODE_ENV = readEnvironmentVariable('NODE_ENV', 'dev');
const PORT = readEnvironmentVariable('HTTP_PORT', 3001);

const app = express();
process.on('SIGINT', () => {
  process.exit(-1);
});

app.use(expressWinston);
app.use(cookieParser());

app.use('/api', marcIOController);
app.use('/sru', sruController);
app.use('/session', sessionController);
app.use('/merge', mergeController);

app.use(express.static(path.resolve(__dirname, 'public')));


const server = app.listen(PORT, () => logger.log('info', `Application started on port ${PORT}`));

server.timeout = 1800000; // Half an hour
