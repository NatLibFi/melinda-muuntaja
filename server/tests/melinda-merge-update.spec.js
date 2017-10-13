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

import sinon from 'sinon';
import chai from 'chai';
import sinonChai from 'sinon-chai';
import sinonAsPromised from 'sinon-as-promised'; // eslint-disable-line
chai.use(sinonChai);
const expect = chai.expect;
import { commitMerge } from '../melinda-merge-update';

import MarcRecord from 'marc-record-js';

describe('melinda merge update', function() {
  describe('commitMerge', function() {
    let clientStub;

    beforeEach(() => {
      clientStub = createClientStub();
    });

    it('returns metadata of successful create operation', function(done) {
      const expectedRecordId = 15;

      clientStub.updateRecord.resolves('UPDATE-OK');
      clientStub.createRecord.resolves(createSuccessResponse(expectedRecordId));

      const merged =createRecordFamily();
  
      commitMerge(clientStub, 'CREATE', null, merged)
        .then(res => {
          expect(res).not.to.be.undefined;
          expect(res.recordId).to.equal(expectedRecordId);
          done();
        })
        .catch(done);
    });

    it('returns metadata of successful update operation', function(done) {
      const expectedRecordId = 123456789;

      clientStub.updateRecord.resolves(createSuccessResponse(expectedRecordId));
      clientStub.createRecord.resolves('CREATE-OK');

      const [preferred, merged] = [createRecordFamily(expectedRecordId), createRecordFamily('000000000')];
    
      commitMerge(clientStub, 'UPDATE', preferred, merged)
        .then(res => {
          expect(res).not.to.be.undefined;
          expect(res.recordId).to.equal(expectedRecordId);
          done();
        })
        .catch(done);
    });


    it('requires that preferred record has id', function(done) {

      const [preferred, merged] = [createRecordFamily(), createRecordFamily()];

      commitMerge(clientStub, 'UPDATE', preferred, merged)
        .then(expectFulfillmentToNotBeCalled(done))
        .catch(expectErrorMessage('Id not found for preferred record.', done));

    });
  });
});

function createClientStub() {
  return {
    updateRecord: sinon.stub(),
    createRecord: sinon.stub()
  };
}

function expectFulfillmentToNotBeCalled(done) {
  return () => done(new Error('Fulfillment handler was called unexpectedly.'));
}

function expectErrorMessage(msg, done) {
  return function(err) {
    try {
      expect(err.message).to.equal(msg);
      done();
    } catch(e) {
      done(e);
    }
  };
}


function createRecordFamily(id = false) {
  return {
    record: createRecord(id),
    subrecords: []
  };
}

function createRecord(id = false) {
  const record = new MarcRecord();
  if (id) record.appendControlField(['001', id]);

  return record;
}

function createSuccessResponse(recordId) {
  return { 
    messages: [ { code: '0018', message: `Document: ${recordId} was updated successfully.` } ],
    errors: [],
    triggers: [ 
      { code: '0101', message: 'Field SID with text "$$c757724$$boula" is a duplicate entry in the INDEX file.' },
      { code: '0101', message: 'Field SID with text "$$c757724$$boula" is a duplicate entry in the INDEX file.' } 
    ],
    warnings: [ 
      { code: '0121', message: 'Document is duplicate in the database (Matched against System No. 003342333 by LOCATE command).' },
      { code: '0121', message: 'Document is duplicate in the database (Matched against System No. 000698067 by LOCATE command).' } 
    ],
    recordId: recordId
  };
}