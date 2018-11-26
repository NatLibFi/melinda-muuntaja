// preferredRecord(pohjatietue), otherRecord(lähdetietue), result.mergedRecord
import MarcRecord from 'marc-record-js';
import { isEmpty, isEqual, orderBy} from 'lodash';

export const eToPrintPreset = [
  eToPrintRemoveTags,
  eToPrintSelect008,
  eToPrintSelect040,
  eToPrintSelect020,
  eToPrintSelect300,
  eToPrintSelect655,
  eToPrintSelect776
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

// eToPrint Postmerge functions ->

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

// 300 field, imports code a and b from sourcerecord. Subfield a is manipulated with x sivua if regexp matches
function eToPrintSelect300(targetRecord, sourceRecord, mergedRecordParam) {
  const fieldTag = '300';
  const tag300 = {...filterTag(sourceRecord, fieldTag)};
  const fieldIndex = findIndex(mergedRecordParam, fieldTag);
  
  if (!isEmpty(tag300)) {
    const tag300a = tag300.subfields.map(field => updateA(field))
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
    return isMatch ? isMatch[1] : value;
  }
}

// removes string a content if 'e-kirjat' match and replaces with an empty content
function eToPrintSelect655(targetRecord, sourceRecord, mergedRecordParam) {
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

function eToPrintSelect776(targetRecord, sourceRecord, mergedRecordParam) {
  const fieldTag = '776';
  const tag776 = {...sourceRecord.fields.find(field => field.tag === fieldTag)};
  const tag020Field = {...filterTag(sourceRecord, '020')};
  
  if(!isEmpty(tag776) && !isEmpty(tag020Field)) {
    const tag020a = tag020Field.subfields.find(field => field.code == 'a');
    const tag020q = tag020Field.subfields.find(field => field.code == 'q');
    const fieldIndex = findIndex(mergedRecordParam, fieldTag);
    
    const base776tag = {
      tag: '776',
      ind1: '0',
      ind2: '8',
      subfields: [
        {
          code: 'i',
          value: check020q(tag020q.value)
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

    const mergedRecord = new MarcRecord({...updatedMergedRecordParam});
    
    return { 
      mergedRecord 
    };
  }
  return { 
    mergedRecord: new MarcRecord(mergedRecordParam)
  };
  
  function check020q(value){
    return value ? `Verkkoaineisto (${value}):` : 'Verkkoaineisto:';
  }

  function trim020a(fieldA){
    return fieldA ?  fieldA.replace(/-/g, '') : '';
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
