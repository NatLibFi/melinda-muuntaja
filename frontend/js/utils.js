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

import {orderBy} from 'lodash';
import {MarcRecord} from '@natlibfi/marc-record';

export function replaceFieldsFromSource(regex, sourcerecord, mergedRecordParam) {
  const fieldsFromSourceRecord = sourcerecord.fields.filter(field => regex.test(field.tag));

  const filteredMergedRecordParam = {
    ...mergedRecordParam,
    fields: mergedRecordParam.fields.filter(field => !regex.test(field.tag))
      .concat(fieldsFromSourceRecord)
  };

  return {
    mergedRecord: new MarcRecord({
      ...filteredMergedRecordParam,
      fields: orderBy([...filteredMergedRecordParam.fields], 'tag')
    }, {subfieldValues: false})
  };
}

export function addIntoArray(array, value) {
  return array.concat(value);
}

export function updatedMergedRecordParams(mergedRecordParam, updatedSubfields, fieldIndex) {
  return fieldIndex > -1 ? updateParamsfield(mergedRecordParam, updatedSubfields.subfields, fieldIndex) : addTag(mergedRecordParam, updatedSubfields);
}

export function addTag(mergedRecordParam, tag) {
  return {
    ...mergedRecordParam,
    fields: orderBy([...mergedRecordParam.fields, tag], 'tag')
  };
}

export function updateParamsfield(mergedRecordParam, subfields, fieldIndex) {
  return {
    ...mergedRecordParam,
    fields: mergedRecordParam.fields.map((field, index) => updateField(field, subfields, fieldIndex, index))
  };
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

export function filterTag(record, fieldTag) {
  return record.fields.find(obj => obj.tag === fieldTag);
}

export function findTag(fields, value) {
  return fields.find(obj => obj.tag === value);
}

export function findIndex(record, fieldTag) {
  return record.fields.findIndex(obj => obj.tag === fieldTag);
}

export function exceptCoreErrors(fn) {

  return (error) => {
    if ([TypeError, SyntaxError, ReferenceError].find(errorType => error instanceof errorType)) {
      throw error;
    } else {
      return fn(error);
    }
  };
}

export function isControlField(field) {
  return field.subfields === undefined;
}

export function isCoreError(error) {
  return ([EvalError, RangeError, URIError, TypeError, SyntaxError, ReferenceError].some(errorType => error instanceof errorType));
}
