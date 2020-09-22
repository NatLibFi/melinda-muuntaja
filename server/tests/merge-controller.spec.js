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

import sinon from 'sinon';
import chai from 'chai';
import sinonChai from 'sinon-chai';
import request from 'supertest';
import HttpStatus from 'http-status';
import {__RewireAPI__ as RewireAPI} from '../merge-controller';
import {mergeController} from '../merge-controller';
import {createSessionToken} from 'server/session-crypt';
import {MarcRecord} from '@natlibfi/marc-record';

chai.use(sinonChai);

const sessionToken = createSessionToken('test-user', 'test-pass');

describe('MARC IO controller', () => {

  describe('commit-merge', () => {

    let commitMergeStub;
    let createArchiveStub;
    let readStub;
    let readSubrecordsStub;

    beforeEach(() => {
      commitMergeStub = sinon.stub();
      readStub = sinon.stub();
      readSubrecordsStub = sinon.stub();
      const createApiClientStub = sinon.stub().returns({
        read: readStub
      });

      const createSubrecordPickerStub = sinon.stub().returns({
        readAllSubrecords: readSubrecordsStub
      });

      createArchiveStub = sinon.stub().resolves({
        filename: 'FAKE-FILENAME',
        size: 'FAKE-SIZE'
      });

      RewireAPI.__Rewire__('commitMerge', commitMergeStub);
      RewireAPI.__Rewire__('createArchive', createArchiveStub);
      RewireAPI.__Rewire__('createApiClient', createApiClientStub);
      RewireAPI.__Rewire__('createSubrecordPicker', createSubrecordPickerStub);
    });

    afterEach(() => {
      RewireAPI.__ResetDependency__('commitMerge');
      RewireAPI.__ResetDependency__('createArchive');
      RewireAPI.__ResetDependency__('createApiClient');
      RewireAPI.__ResetDependency__('createSubrecordPicker');
    });

    it('returns UNAUTHORIZED if credentials are missing', (done) => {

      request(mergeController)
        .post('/commit-merge')
        .expect(HttpStatus.UNAUTHORIZED, done);

    });

    it('returns BAD_REQUEST if records are missing', (done) => {

      commitMergeStub.rejects('Error');

      request(mergeController)
        .post('/commit-merge')
        .set('Cookie', `sessionToken=${sessionToken}`)
        .expect(HttpStatus.BAD_REQUEST, done);

    });

    it('returns 200 if commit is successful', (done) => {

      commitMergeStub.resolves('Ok');
      const {record, subrecords} = createFakeRecordFamily();
      record.fields.push({'tag': '001', 'value': '123'});
      readStub.resolves(record);
      readSubrecordsStub.resolves({records: subrecords});

      request(mergeController)
        .post('/commit-merge')
        .set('Cookie', `sessionToken=${sessionToken}`)
        .send({
          'operationType': 'CREATE',
          'subrecordMergeType': 'MERGE',
          'otherRecord': createFakeRecordFamily(),
          'preferredRecord': createFakeRecordFamily(),
          'mergedRecord': createFakeRecordFamily(),
          'unmodifiedRecord': createFakeRecordFamily()
        })
        .expect(HttpStatus.OK, done);

    });

    it('returns error from server if commit-merge fails', (done) => {

      commitMergeStub.rejects('Error from backend server');

      request(mergeController)
        .post('/commit-merge')
        .set('Cookie', `sessionToken=${sessionToken}`)
        .send({
          'operationType': 'CREATE',
          'subrecordMergeType': 'MERGE',
          'otherRecord': createFakeRecordFamily(),
          'preferredRecord': createFakeRecordFamily(),
          'mergedRecord': createFakeRecordFamily(),
          'unmodifiedRecord': createFakeRecordFamily()
        })
        .expect(HttpStatus.INTERNAL_SERVER_ERROR, done);

    });
  });

});

function createFakeRecord() {
  return MarcRecord.fromString([
    'LDR    abcdefghijk',
    '001    28474',
    '003    aaabbb',
    '100    ‡aTest Author',
    '245 0  ‡aSome content',
    '245 0  ‡aTest Title‡bTest field‡cTest content'
  ].join('\n'));
}

function createFakeRecordFamily() {
  return {
    record: createFakeRecord(),
    subrecords: []
  };
}
