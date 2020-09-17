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
  leader: '00000cam^a22006134i^4500',
  fields: [
    {
      tag: '008',
      value: '^^^^^^s2018^^^^fi^|^^|^|^^^^||0|^0^fin|c'
    },
    {
      tag: '041',
      ind1: ' ',
      ind2: ' ',
      subfields: [
        {
          code: 'a',
          value: 'fin'
        }
      ]
    },
    {
      tag: '337',
      ind1: ' ',
      ind2: ' ',
      subfields: [
        {
          code: 'a',
          value: 'käytettävissä ilman laitetta'
        },
        {
          code: 'b',
          value: 'n'
        },
        {
          code: '2',
          value: 'rdamedia'
        }
      ]
    },
    {
      tag: '338',
      ind1: ' ',
      ind2: ' ',
      subfields: [
        {
          code: 'a',
          value: 'nide'
        },
        {
          code: 'b',
          value: 'nc'
        },
        {
          code: '2',
          value: 'rdacarrier'
        }
      ]
    },
    {
      tag: '530',
      ind1: ' ',
      ind2: ' ',
      subfields: [
        {
          code: 'a',
          value: 'Julkaistu myös verkkoaineistona.'
        }
      ]
    }
  ]
}, {subfieldValues: false});

decorateFieldsWithUuid(record);

module.exports = record;
