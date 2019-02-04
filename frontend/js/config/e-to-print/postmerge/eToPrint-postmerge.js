// preferredRecord(pohjatietue), otherRecord(lähdetietue), result.mergedRecord
import MarcRecord from 'marc-record-js';
import { isEmpty, orderBy, isUndefined} from 'lodash';
import { hyphenate } from 'isbn-utils';
import uuid from 'node-uuid';

export const eToPrintPreset = [
  eToPrintRemoveTags,
  eToPrintSelect008,
  eToPrintSelect040,
  eToPrintSelect020,
  eToPrintSelect300,
  eToPrintSelect655,
  eToPrintSelect776, // TODO: Fix React unique "key" prop console warning
  replaceFieldsFromSource,
  ISBNhyphenate
];

// helper functions ->
function filterTag (record, fieldTag) {
  return record.fields.find(obj => obj.tag === fieldTag);
}

function findIndex (record, fieldTag) {
  return record.fields.findIndex(obj => obj.tag === fieldTag);
}

function updateField(field, updatedSubfields, fieldIndex, index) {
  if (index === fieldIndex) {
    return {
      ...field,
      subfields: updatedSubfields
    };
  }
  return field;
}

function updateParamsfield(mergedRecordParam, subfields, fieldIndex) {
  return { 
    ...mergedRecordParam,
    fields: mergedRecordParam.fields.map((field, index) => updateField(field, subfields, fieldIndex, index))
  };
}

function addTag(mergedRecordParam, tag) {
  return { 
    ...mergedRecordParam,
    fields: orderBy([ ...mergedRecordParam.fields, tag], 'tag')
  };
}

// eToPrint postmerge functions ->
export function replaceFieldsFromSource(targetRecord, sourcerecord, mergedRecordParam) {
  const mergeConfigurationFields = /^(1..|041|080|084|240|245|246|250|260|263|264|490|500|502|504|505|509|520|546|567|6[^5].|65[^5]|700|710|711|800|810|811|830)$/;

  const fieldsFromSourceRecord = sourcerecord.fields.filter(field => mergeConfigurationFields.test(field.tag));
  
  const filteredMergedRecordParam = {
    ...mergedRecordParam, 
    fields: mergedRecordParam.fields.filter(field => !mergeConfigurationFields.test(field.tag))
      .concat(fieldsFromSourceRecord)
  };

  return { mergedRecord: new MarcRecord({ 
    ...filteredMergedRecordParam,
    fields: orderBy([ ...filteredMergedRecordParam.fields], 'tag')}) 
  };
}

// removes specified tags from record (mergedRecordParam)
export function eToPrintRemoveTags(preferredRecord, otherRecord, mergedRecordParam) {
  const tagList = ['007', '347', '506', '540', '588', '856']; // tags to be removed
  const filteredMergedRecordParam = {
    ...mergedRecordParam, 
    fields: mergedRecordParam.fields.filter(field => !tagList.includes(field.tag))
  };
  const mergedRecord = new MarcRecord(filteredMergedRecordParam);
  
  return {
    mergedRecord
  };
}

// Replaces 008 string content
export function eToPrintSelect008(preferredRecord, otherRecord, mergedRecordParam) {
  const fieldTag = '008';
  const indexList = [0, 1, 2, 3, 4, 5, 23, 39];
  const mergedRecordParamCopy = { ...mergedRecordParam };
  const sourceRecordTag = filterTag(otherRecord, fieldTag);
  const targetRecordTag = filterTag(preferredRecord, fieldTag);
  const sourceTag = { ...sourceRecordTag };
  let updated008record;

  indexList.forEach(index => {
    const replaceWith = targetRecordTag.value[index];
    sourceTag.value = replaceString(sourceTag, index, replaceWith);
    updated008record = updateProperty(mergedRecordParamCopy, sourceTag, fieldTag);
  });

  return {
    mergedRecord: new MarcRecord(updated008record)
  };

  function replaceString(sourceTag, index, replaceWith) {
    return sourceTag.value.substring(0, index) + replaceWith + sourceTag.value.substring(index+1);
  }
  
  function updateProperty(record, sourceRecordTag, fieldTag) {
    const tagIndex = findIndex(record, fieldTag);
    const recordCopy = { ...record };
    const updatedTag = {
      ...record.fields[tagIndex]
    };
  
    updatedTag.value = sourceRecordTag.value;
    recordCopy.fields[tagIndex] = updatedTag;
  
    return recordCopy;
  }
}

// if tag 040 in fields, imports 040 from sourceRecord and creates/replaces with postMergeContent
export function eToPrintSelect040(targetRecord, sourceRecord, mergedRecordParam) {
  const fieldTag = '040';
  const tag040 = { ...filterTag(sourceRecord, fieldTag)};
  const postMergeContent = [
    { code: 'a', value: '' },
    { code: 'b', value: 'fin' },
    { code: 'e', value: 'rda' }
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
      mergedRecord: new MarcRecord(updatedMergedRecordParam)
    };
  }

  return { 
    mergedRecord: new MarcRecord(mergedRecordParam)
  };
}

// 
function eToPrintSelect020 (targetRecord, sourceRecord, mergedRecordParam) {
  const fieldTag = '020';
  const tag020 = { ...filterTag(sourceRecord, fieldTag) };
  const tag776 = filterTag(sourceRecord, '776');
  const field776a = tag776 !== undefined ? tag776.subfields.find(obj => obj.code === 'z') : '';
    
  if (!isEmpty(tag020)) {
    const updatedSubfields = tag020.subfields.map((field) => updateValue(field, field776a.value));
    tag020.subfields = {...updatedSubfields};

    if (tag020.subfields) {
      tag020.subfields = [
        { code: 'a', value: field776a.value ?  field776a.value : '' }, 
        { code: 'q', value: ' ' }
      ];
    }

    const fieldIndex = findIndex(mergedRecordParam, fieldTag);
    
    const updatedMergedRecordParam = fieldIndex > -1 ? updateParamsfield(mergedRecordParam, tag020.subfields, fieldIndex) : addTag(mergedRecordParam, tag020);
    
    return { 
      mergedRecord: new MarcRecord(updatedMergedRecordParam)
    };
  }

  return { 
    mergedRecord: new MarcRecord(mergedRecordParam)
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

// 300 field, imports code a and b from sourcerecord. Subfield a returns string according to regexp match
function eToPrintSelect300(targetRecord, sourceRecord, mergedRecordParam) {
  const fieldTag = '300';
  const tag300 = {...filterTag(sourceRecord, fieldTag)};
  const fieldIndex = findIndex(mergedRecordParam, fieldTag);
  
  if (!isEmpty(tag300)) {
    const tag300a = tag300.subfields.map(field => updateA(field, tag300.subfields))
      .find(field => field.code === 'a');
    const tag300b = {...filterTag(sourceRecord, fieldTag)}
      .subfields.find(field => field.code === 'b');
    
    if (tag300b !== undefined) {
      tag300.subfields = [tag300a, tag300b];
      
      const updatedMergedRecordParam = fieldIndex > -1 ? updateParamsfield(mergedRecordParam, tag300.subfields, fieldIndex) : addTag(mergedRecordParam, tag300);
        
      return { 
        mergedRecord: new MarcRecord(updatedMergedRecordParam)
      };
    }
    
    tag300.subfields = [tag300a];
    
    const updatedMergedRecordParam = fieldIndex > -1 ? updateParamsfield(mergedRecordParam, tag300.subfields, fieldIndex) : addTag(mergedRecordParam, tag300);
    
    return { 
      mergedRecord: new MarcRecord(updatedMergedRecordParam)
    };
  }
  return { 
    mergedRecord: new MarcRecord(mergedRecordParam)
  };

  function updateA(field, subfields) {
    if (field.code === 'a') {
      const match = checkMatch(field, subfields.every(obj => obj.code === 'a'));
      return {
        ...field,
        value: match !== null ? match : ''
      };
    }
    return field;
  }

  function checkMatch(field, aFields) {
    const isMatch =/\((.*?)\)/.exec(field.value);   
    if (isMatch && !aFields) {
      return `${isMatch[1]} :`;
    }
    if (isMatch && aFields) {
      return isMatch[1];
    } else {
      return null;
    }
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
      mergedRecord: new MarcRecord(updatedMergedRecordParam)
    };
  }
  return { 
    mergedRecord: new MarcRecord(mergedRecordParam)
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
    
  if(!isEmpty(tag020Field)) {
    const tag020a = tag020Field.subfields.find(field => field.code == 'a');
    const tag020q = tag020Field.subfields.find(field => field.code == 'q');
    const fieldIndex = findIndex(mergedRecordParam, fieldTag);
    const match = !isUndefined(tag020q) ? testContent(tag020q.value) : null;
    
    const base776tag = {
      ...tag020Field,
      tag: '776',
      ind1: '0',
      ind2: '8',
      uuid: uuid.v4(),
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
      mergedRecord: new MarcRecord(updatedMergedRecordParam)
    };
  }
  return { 
    mergedRecord: new MarcRecord(mergedRecordParam)
  };

  function trim020a(fieldA){
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
    mergedRecord: new MarcRecord(updatedMergedRecordParam)
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