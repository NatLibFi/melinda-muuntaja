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
        },
        {
          code: 'q',
          value: 'epub'
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
          value: 'fin'
        }
      ]
    },
    {
      tag: '264',
      ind1: ' ',
      ind2: '1',
      subfields: [
        {
          code: 'a',
          value: ' :'
        },
        {
          code: 'b',
          value: ' ,'
        },
        {
          code: 'c',
          value: ' .'
        }
      ]
    },
    {
      tag: '300',
      ind1: ' ',
      ind2: ' ',
      subfields: [
        {
          code: 'a',
          value: '1 verkkoaineisto (XXX sivua)'
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
      tag: '490',
      ind1: '1',
      ind2: ' ',
      subfields: [
        {
          code: 'a',
          value: ' ,'
        },
        {
          code: 'x',
          value: ' ;'
        },
        {
          code: 'v',
          value: ''
        }
      ]
    },
    {
      tag: '830',
      ind1: ' ',
      ind2: '0',
      subfields: [
        {
          code: 'a',
          value: ' ,'
        },
        {
          code: 'x',
          value: ' ;'
        },
        {
          code: 'v',
          value: ' .'
        }
      ]
    }
  ]
});
