// preferredRecord(pohjatietue), otherRecord(lähdetietue), result.mergedRecord
import MarcRecord from 'marc-record-js';
import { merge, isEmpty } from 'lodash';

export const eToPrintPreset = [
  eToPrintRemoveTags,
  eToPrintSelect008,
  eToPrintSelect040,
  eToPrintSelect020
];

// helper functions
function filterTag (record, fieldTag) {
  return record.fields.find(obj => obj.tag === fieldTag);
}

function findIndex (record, fieldTag) {
  return record.fields.findIndex(obj => obj.tag === fieldTag);
}

// eToPrint Postmerge functions

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

// if tag 040 in fields, imports 040 from sourceRecord and creates, replaces or merges with postMergeContent
export function eToPrintSelect040(targetRecord, sourceRecord, mergedRecordParam) {
  const fieldTag = '040';
  const tag040 = { ...filterTag(sourceRecord, fieldTag)};
  const postMergeContent = [
    { code: 'a', value: '' },
    { code: 'b', value: 'fin' },
    { code: 'c', value: 'rda' }
  ]; 

  if (!isEmpty(tag040)) {
    const filteredTags = tag040.subfields.filter(tag => tag.code !== 'a' && tag.code !== 'b' && tag.code !== 'e');
    
    const mergedSubfields = merge( ...filteredTags, postMergeContent);
    const index = findIndex(sourceRecord, fieldTag);
 
    const updated040Field = {
      ...sourceRecord.fields[index]
    };
    
    updated040Field.subfields = mergedSubfields; 

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
  
  const field776a = tag776.subfields.find(obj => obj.code === 'z').value;
  const updatedSubfields = tag020.subfields.map((field) => updateValue(field, field776a));
  tag020.subfields = updatedSubfields;
  
  const fieldIndex = findIndex(mergedRecordParam, fieldTag);
  
  const updatedMergedRecordParam = { 
    ...mergedRecordParam,
    fields: mergedRecordParam.fields.map((field, index) => updateField(field, updatedSubfields, fieldIndex, index)) 
  };
  
  return { 
    mergedRecord: new MarcRecord(updatedMergedRecordParam)
  };

  function updateField(field, updatedSubfields, fieldIndex, index) {
    if (index === fieldIndex) {
      return {
        ...field,
        subfields: updatedSubfields
      };
    }
    return field;
  }

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
