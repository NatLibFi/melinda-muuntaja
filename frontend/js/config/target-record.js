import MarcRecord from 'marc-record-js';

module.exports = new MarcRecord({
  leader: '00000cam^a2200613^i^4500',
  fields: [
    {
      tag: '001',
      value: '000000000'
    },
    {
      tag: '007',
      value: 'cr^||^||||||||'
    },
    {
      tag: '008',
      value: '^^^^^^s2016^^^^fi^||||^o^^^^^|0|^0|fin|^'
    },
    {
      tag: '020',
      ind1: ' ',
      ind2: ' ',
      subfields: [
        {
          code: 'a',
          value: ''
        },
        {
          code: 'q',
          value: 'PDF'
        }
      ]
    },
    {
      tag: '041',
      ind1: '0',
      ind2: ' ',
      subfields: [
        {
          code: 'a',
          value: 'eng'
        }
      ]
    },
    {
      tag: '336',
      ind1: ' ',
      ind2: ' ',
      subfields: [
        {
          code: 'a',
          value: 'teksti'
        },
        {
          code: 'b',
          value: 'txt'
        },
        {
          code: '2',
          value: 'rdacontent'
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
          value: 'tietokonekäyttöinen'
        },
        {
          code: 'b',
          value: 'c'
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
          value: 'verkkoaineisto'
        },
        {
          code: 'b',
          value: 'cr'
        },
        {
          code: '2',
          value: 'rdacarrier'
        }
      ]
    },
    {
      tag: '538',
      ind1: ' ',
      ind2: ' ',
      subfields: [
        {
          code: 'a',
          value: 'Internet-yhteys.'
        },
        {
          code: '9',
          value: 'FENNI<KEEP>'
        }
      ]
    },
    {
      tag: 'LOW',
      ind1: ' ',
      ind2: ' ',
      subfields: [
        {
          code: 'a',
          value: 'FENNI'
        }
      ]
    }
  ]
});
