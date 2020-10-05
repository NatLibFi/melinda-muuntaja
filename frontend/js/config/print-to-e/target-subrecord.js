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

import {MarcRecord} from '@natlibfi/marc-record';
import {decorateFieldsWithUuid} from '../../record-utils';

const record = new MarcRecord({
  leader: '^^^^^caa^a22002174i^4500',
  fields: [
    {
      tag: '001',
      value: '000000000'
    },
    {
      tag: '773',
      ind1: '0',
      ind2: ' ',
      subfields: [
        {
          code: '7',
          value: 'p1am'
        },
        {
          code: 'w',
          value: '(FI-MELINDA)[future-host-id]'
        }
      ]
    }
  ]
}, {subfieldValues: false});

decorateFieldsWithUuid(record);

module.exports = record;