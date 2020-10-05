// preferredRecord(pohjatietue), otherRecord(lähdetietue), result.mergedRecord
import {MarcRecord} from '@natlibfi/marc-record';
import {isEmpty, isUndefined} from 'lodash';
import {hyphenate} from 'isbn-utils';
import {v4 as uuid} from 'uuid';
import {curry} from 'ramda';
import {filterTag, findIndex, updateParamsfield, addTag, updatedMergedRecordParams, addIntoArray, replaceFieldsFromSource} from '../../../utils';



export const eToPrintPreset = [
  eToPrintRemoveTags,
  eToPrintSelect008,
  eToPrintSelect040,
  eToPrintSelect020,
  eToPrintSelect300,
  eToPrintSelect655,
  eToPrintSelect776,
  replaceSourceFields,
  ISBNhyphenate,
  eToPrintSelect490_830
];


// eToPrint postmerge functions ->
export function replaceSourceFields(targetRecord, sourcerecord, mergedRecordParam) {
  const mergeConfigurationFields = /^(1..|041|080|084|240|245|246|250|260|263|264|336|490|500|502|504|505|509|520|546|567|6[^5].|65[^5]|700|710|711|800|810|811|830)$/;

  return replaceFieldsFromSource(mergeConfigurationFields, sourcerecord, mergedRecordParam);
}

// removes specified tags from record (mergedRecordParam)
export function eToPrintRemoveTags(preferredRecord, otherRecord, mergedRecordParam) {
  const tagList = ['007', '347', '506', '540', '588', '856']; // tags to be removed
  const filteredMergedRecordParam = {
    ...mergedRecordParam,
    fields: mergedRecordParam.fields.filter(field => !tagList.includes(field.tag))
  };
  const mergedRecord = new MarcRecord(filteredMergedRecordParam, {subfieldValues: false});

  return {
    mergedRecord
  };
}

// Replaces 008 string content
export function eToPrintSelect008(preferredRecord, otherRecord, mergedRecordParam) {
  const fieldTag = '008';
  const indexList = [0, 1, 2, 3, 4, 5, 23, 39];
  const sourceTag = {...filterTag(otherRecord, fieldTag)};
  const targetRecordTag = {...filterTag(preferredRecord, fieldTag)};

  const updated008field = indexList.reduce((tag, index) => {
    const replaceWith = targetRecordTag.value[index];
    tag.value = replaceString(sourceTag, index, replaceWith);
    return tag;
  }, sourceTag);

  const updateTag = curry((updated008field, field) => {
    if (field.tag === '008') {
      return updated008field;
    }
    return field;
  });

  const updatedMergeParams = {
    ...mergedRecordParam,
    fields: mergedRecordParam.fields.map(updateTag(updated008field))
  };

  return {
    mergedRecord: new MarcRecord(updatedMergeParams, {subfieldValues: false})
  };

  function replaceString(sourceTag, index, replaceWith) {
    return sourceTag.value.substring(0, index) + replaceWith + sourceTag.value.substring(index + 1);
  }
}

// if tag 040 in fields, imports 040 from sourceRecord and creates/replaces with postMergeContent
export function eToPrintSelect040(targetRecord, sourceRecord, mergedRecordParam) {
  const fieldTag = '040';
  const tag040 = {...filterTag(sourceRecord, fieldTag)};
  const postMergeContent = [
    {code: 'a', value: ''},
    {code: 'b', value: 'fin'},
    {code: 'e', value: 'rda'}
  ];

  if (!isEmpty(tag040)) {
    const index = findIndex(sourceRecord, fieldTag);

    const updated040Field = {
      ...sourceRecord.fields[index]
    };

    updated040Field.subfields = postMergeContent;

    const fieldIndex = findIndex(mergedRecordParam, fieldTag);
    const updatedMergedRecordParam = fieldIndex > -1 ? updateParamsfield(mergedRecordParam, updated040Field.subfields, fieldIndex) : addTag(mergedRecordParam, updated040Field);

    return {
      mergedRecord: new MarcRecord(updatedMergedRecordParam, {subfieldValues: false})
    };
  }

  return {
    mergedRecord: new MarcRecord(mergedRecordParam, {subfieldValues: false})
  };
}

//
function eToPrintSelect020(targetRecord, sourceRecord, mergedRecordParam) {
  const fieldTag = '020';
  const tag020 = {...filterTag(sourceRecord, fieldTag)};
  const tag776 = filterTag(sourceRecord, '776');
  const field776a = tag776 !== undefined ? tag776.subfields.find(obj => obj.code === 'z') : '';

  if (!isEmpty(tag020)) {
    const updatedSubfields = tag020.subfields.map((field) => updateValue(field, field776a.value));
    tag020.subfields = {...updatedSubfields};

    if (tag020.subfields) {
      tag020.subfields = [
        {code: 'a', value: field776a.value ? field776a.value : ''},
        {code: 'q', value: ' '}
      ];
    }

    const fieldIndex = findIndex(mergedRecordParam, fieldTag);

    const updatedMergedRecordParam = fieldIndex > -1 ? updateParamsfield(mergedRecordParam, tag020.subfields, fieldIndex) : addTag(mergedRecordParam, tag020);

    return {
      mergedRecord: new MarcRecord(updatedMergedRecordParam, {subfieldValues: false})
    };
  }

  return {
    mergedRecord: new MarcRecord(mergedRecordParam, {subfieldValues: false})
  };

  function updateValue(field, value) {
    if (field.code === 'q') {
      return {
        ...field,
        value: ' '
      };
    }
    if (field.code === 'a') {
      return {
        ...field,
        value
      };
    }
    return field;
  }

}

// 300 field, imports code a and b from sourcerecord. Subfield a returns string according to regexp match and always adds subfield c at the end
function eToPrintSelect300(targetRecord, sourceRecord, mergedRecordParam) {
  const fieldTag = '300';
  const tag300 = {...filterTag(sourceRecord, fieldTag)};
  const fieldIndex = findIndex(mergedRecordParam, fieldTag);

  if (!isEmpty(tag300)) {
    const tag300C = {
      ...tag300,
      subfields: addIntoArray(tag300.subfields, {code: 'c', value: ''})
    };

    // no code a, creates an empty value
    if (isEmpty(tag300C.subfields.filter(field => field.code === 'a'))) {
      tag300C.subfields = [...tag300C.subfields, {code: 'a', value: ''}];
    }

    const updateValues = curry((length, field) => {
      if (field.code === 'a') {
        const match = checkMatch(field, length);
        return {...field, value: match};
      }
      if (field.code === 'b') {
        return {...field, value: field.value + ';'};
      }
      return field;
    });

    const updatedASubfields = tag300C.subfields.map(updateValues(tag300C.subfields.length));

    const updatedTag300 = {
      ...tag300C,
      subfields: updatedASubfields
    };
    const updatedMergedRecordParam = fieldIndex > -1 ? updateParamsfield(mergedRecordParam, updatedTag300.subfields, fieldIndex) : addTag(mergedRecordParam, updatedTag300);

    return {
      mergedRecord: new MarcRecord(updatedMergedRecordParam, {subfieldValues: false})
    };
  }
  return {
    mergedRecord: new MarcRecord(mergedRecordParam, {subfieldValues: false})
  };

  function checkMatch(field, subfieldsLength) {
    const isMatch = /\((.*?)\)/.exec(field.value);
    const punctuation = createAPunctuation(subfieldsLength);
    return isMatch ? `${isMatch[1]} ${punctuation}` : '';
  }

  function createAPunctuation(subfieldsLength) {
    return subfieldsLength > 2 ? ':' : ';';
  }
}

// removes tag 655 if match in a-field
// 'e-kirjat',
// 'e-böcker',
// 'sähköiset julkaisut',
// 'elektroniska publikationer',
// 'Electronic books.'

function eToPrintSelect655(targetRecord, sourceRecord, mergedRecordParam) {
  const fieldTag = '655';
  const tags655 = [...sourceRecord.fields
    .filter(field => field.tag === fieldTag)]
    .filter(tag => filterStrigs(tag.subfields));

  if (!isEmpty(tags655)) {
    const filtered655 = {
      ...mergedRecordParam,
      fields: mergedRecordParam.fields.filter(field => field.tag !== '655')
    };

    const updatedMergedRecordParam = {
      ...mergedRecordParam,
      fields: filtered655.fields.concat(tags655)
    };

    return {
      mergedRecord: new MarcRecord(updatedMergedRecordParam, {subfieldValues: false})
    };
  }
  return {
    mergedRecord: new MarcRecord(mergedRecordParam, {subfieldValues: false})
  };

  function filterStrigs(field) {
    const testField = field.filter(obj => {
      if (obj.code === 'a') {
        const isMatch = obj.value.match(/(e-kirjat|e-böcker|sähköiset julkaisut|elektroniska publikationer|Electronic books)/i);
        return isMatch ? isMatch[1] : null;
      }
      return false;
    });
    return isEmpty(testField);
  }
}

function eToPrintSelect776(targetRecord, sourceRecord, mergedRecordParam) {
  const fieldTag = '776';
  const tag020Field = {...filterTag(sourceRecord, '020')};

  if (!isEmpty(tag020Field)) {
    const tag020a = tag020Field.subfields.find(field => field.code == 'a');
    const tag020q = tag020Field.subfields.find(field => field.code == 'q');
    const fieldIndex = findIndex(mergedRecordParam, fieldTag);
    const match = !isUndefined(tag020q) ? testContent(tag020q.value) : null;

    const base776tag = {
      ...tag020Field,
      tag: '776',
      ind1: '0',
      ind2: '8',
      uuid: uuid(),
      subfields: [
        {
          code: 'i',
          value: match !== null ? `Verkkoaineisto (${match.toUpperCase()}):` : 'Verkkoaineisto:'
        },
        {
          code: 'z',
          value: trim020a(tag020a.value)
        }
      ]
    };

    const baseMergedRecordParam = createBaseMergeParams(mergedRecordParam, base776tag, fieldIndex);
    const removedSubfieldMergeParams = removeEmptySubfield(base776tag, fieldIndex);
    const updatedMergedRecordParam = isEmpty(removedSubfieldMergeParams) ? baseMergedRecordParam : removedSubfieldMergeParams;

    return {
      mergedRecord: new MarcRecord(updatedMergedRecordParam, {subfieldValues: false})
    };
  }
  return {
    mergedRecord: new MarcRecord(mergedRecordParam, {subfieldValues: false})
  };

  function trim020a(fieldA) {
    return fieldA ? fieldA.replace(/-/g, '') : '';
  }

  function testContent(tag020q) {
    const isMatch = tag020q.match(/\b(\w*pdf|epub\w*)\b/i);
    return isMatch ? isMatch[1] : null;
  }

  function createBaseMergeParams(mergedRecordParam, base776tag, fieldIndex) {
    return fieldIndex > -1 ? updateParamsfield(mergedRecordParam, base776tag.subfields, fieldIndex) : addTag(mergedRecordParam, base776tag);
  }

  function removeEmptySubfield(base776tag, fieldIndex) {
    if (isEmpty(base776tag.subfields[1].value)) {
      const updated776tag = {
        ...base776tag,
        subfields: base776tag.subfields.filter(field => field.code == 'i')
      };

      return {
        ...mergedRecordParam,
        fields: mergedRecordParam.fields.map((field, index) => updateTag(field, updated776tag, fieldIndex, index))
      };
    }
  }

  function updateTag(field, updated776tag, fieldIndex, index) {
    if (index === fieldIndex) {
      return field = updated776tag;
    }
    return field;
  }
}

// Hyphenates 020 a value (ISBN)
export function ISBNhyphenate(targetRecord, sourceRecord, mergedRecordParam) {
  const updatedMergedRecordParam = {
    ...mergedRecordParam,
    fields: mergedRecordParam.fields.map(findTag)
  };

  return {
    mergedRecord: new MarcRecord(updatedMergedRecordParam, {subfieldValues: false})
  };

  function findTag(field) {
    if (field.tag === '020') {
      return {
        ...field,
        subfields: field.subfields.map(subfield => hyphenateValue(subfield))
      };
    }
    return field;
  }

  function hyphenateValue(subfield) {
    if (subfield.code === 'a') {
      return {
        ...subfield,
        value: hyphenate(subfield.value)
      };
    }
    return subfield;
  }
}

// if tags 490/830 subfields x/v have content returns an empty x/v value
export function eToPrintSelect490_830(targetRecord, sourceRecord, mergedRecordParam) {
  const fieldTag = ['490', '830'];

  const fieldPresent = curry((length, field) => {
    if (field.code === 'x') {
      return xSubfieldPunctuation(length, field);
    }
    if (field.code === 'v') {
      return {...field, value: ''};
    }
    return field;
  });

  const updatedRecord = fieldTag.reduce((record, fieldTag) => {
    const tag = {...filterTag(sourceRecord, fieldTag)};
    if (!isEmpty(tag)) {
      const updatedSubfields = {
        ...tag,
        subfields: tag.subfields.map(fieldPresent(tag.subfields.length))
      };
      const recordParams = updatedMergedRecordParams(record, updatedSubfields, findIndex(mergedRecordParam, fieldTag));
      record = recordParams;
    }

    return record;
  }, mergedRecordParam);

  return {
    mergedRecord: new MarcRecord(updatedRecord, {subfieldValues: false})
  };

  function xSubfieldPunctuation(length, field) {
    return length > 2 ? {...field, value: ';'} : {...field, value: ''};
  }
}