// preferredRecord(pohjatietue), otherRecord(lähdetietue), result.mergedRecord
import MarcRecord from 'marc-record-js';
import { isEmpty, isEqual } from 'lodash';

export const eToPrintPreset = [
  eToPrintRemoveTags,
  eToPrintSelect008,
  eToPrintSelect040,
  eToPrintSelect020,
  eToPrintSelect300,
  eToPrintSelect655
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

// eToPrint Postmerge functions ->

// removes specified tags from record (mergedRecordParam)
export function eToPrintRemoveTags(preferredRecord, otherRecord, mergedRecordParam) {
  const tagList = ['007', '347', '506', '540', '856']; // tags to be removed
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
  const indexList = [23, 39];
  const mergedRecordParamCopy = { ...mergedRecordParam};
  const sourceRecordTag = filterTag(otherRecord, fieldTag);
  const targetRecordTag = filterTag(preferredRecord, fieldTag);
  const sourceTag = { ...sourceRecordTag};
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

    const fields = [ ...sourceRecord.fields ];
    fields[index] = updated040Field;
    
    return { 
      mergedRecord: new MarcRecord({ ...mergedRecordParam, fields })
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

  if (!isEmpty(field776a) && !isEmpty(tag020)) {
    const updatedSubfields = tag020.subfields.map((field) => updateValue(field, field776a.value));
    tag020.subfields = updatedSubfields;
  
    if (!tag020.subfields.some(obj => obj.code === 'a')) {
      tag020.subfields = [ ...tag020.subfields, { code: 'a', value: field776a.value } ];
    }

    if (!tag020.subfields.some(obj => obj.code === 'q')) {
      tag020.subfields = [ ...tag020.subfields, { code: 'q', value: ' ' } ];
    }

    const fieldIndex = findIndex(mergedRecordParam, fieldTag);
    
    const updatedMergedRecordParam = { 
      ...mergedRecordParam,
      fields: mergedRecordParam.fields.map((field, index) => updateField(field, tag020.subfields, fieldIndex, index))
    };
    
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

// 300 field, imports code a and b from sourcerecord. Subfield a is manipulated with x sivua if regexp matches
function eToPrintSelect300(targetRecord, sourceRecord, mergedRecordParam) {
  const fieldTag = '300';
  const tag300 = {...filterTag(sourceRecord, fieldTag)};
  
  if (!isEmpty(tag300)) {
    const tag300a = tag300.subfields.map(field => updateA(field))
      .find(field => field.code === 'a');
    
    const tag300b = {...filterTag(sourceRecord, fieldTag)}
      .subfields.find(field => field.code === 'b');

    tag300.subfields = [tag300a, tag300b];
    
    const fieldIndex = findIndex(mergedRecordParam, fieldTag);
    
    const updatedMergedRecordParam = {
      ...mergedRecordParam,
      fields: mergedRecordParam.fields.map((field, index) => updateField(field, tag300.subfields, fieldIndex, index))
    };

    return { 
      mergedRecord: new MarcRecord(updatedMergedRecordParam)
    };
  }

  return { 
    mergedRecord: new MarcRecord(mergedRecordParam)
  };

  function updateA(field) {
    if (field.code === 'a') {
      return {
        ...field,
        value: checkMatch(field.value)
      };
    }
    return field;
  }

  function checkMatch(value) {    
    const isMatch =/^1 verkkoaineisto \((.*)\)$/.exec(value);
    if (isMatch) {
      return isMatch[1];
    }
    return value;
  }
}

function eToPrintSelect655(targetRecord, sourceRecord, mergedRecordParam) {
  // mock object for development
  // const mockRecord = {
  //   fields: [
  //     {
  //       tag: 'SID',
  //       ind1: ' ',
  //       ind2: ' ',
  //       subfields: [
  //         {
  //           code: 'a',
  //           value: 'e-tietuekirjat'
  //         },
  //         {
  //           code: 'b',
  //           value: 'n'
  //         },
  //         {
  //           code: '2',
  //           value: 'rdamedia'
  //         }
  //       ]
  //     }
  //   ]
  // };
  const fieldTag = '655';
  const fieldIndex = findIndex(sourceRecord, fieldTag);
  const tag655 = {...filterTag(sourceRecord, fieldTag)};
  
  if(!isEmpty(tag655.subfields)) {
    const updatedSubfields = tag655.subfields.map(checkContent);
    tag655.subfields = updatedSubfields;

    const updatedMergedRecordParam = { 
      ...mergedRecordParam,
      fields: mergedRecordParam.fields.map((field, index) => updateField(field, tag655.subfields, fieldIndex, index))
    };

    return { 
      mergedRecord: new MarcRecord(updatedMergedRecordParam)
    };
  }

  return { 
    mergedRecord: new MarcRecord(mergedRecordParam)
  }; 

  function checkContent(field) {
    if (field.code === 'a' && isEqual(field.value, 'e-tietuekirjat')) {
      return {
        ...field,
        value: ' '
      };
    }
    return field;
  }
}