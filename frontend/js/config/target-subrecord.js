import MarcRecord from 'marc-record-js';
import { decorateFieldsWithUuid } from '../record-utils';

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
});

decorateFieldsWithUuid(record);

module.exports = record;