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

/*

Configuration for the merge function


This configuration manages what and how fields are copied from other record to the preferred record while merging a record. 

Each field has a selector. A dot (.) is a wildcard character, so "08." means 080,081,082,...,089. Only the first selector 
matching the field is used.

Only fields that have been configured are considered to be moved from other record to the preferred record.

Possible actions are:

copy
 Copies field from other, if it's missing from the preferred. Normally the field-wise comparison is made using normalized subfield sets. If other set is a proper subset, then 
 the fields are considered identical. 


selectBetter
 Chooses better field from 2 records. Will throw error if record has multiple of the configured field, so it's (often) not 
 usable for repeatable fields. Field in other record is considered better only if it's proper superset of the field in preferred.
 Otherwise the field in preferred is used.

selectBetter has an extra option: comparator. Use comparator to use different equality function for subfield contents. 
 Only possible value currently is "substring", which makes the subfield comparisons with substring equality instead of normal equality
 (that is, if subfieldA is substring of subfieldB OR subfieldB is substring of subfieldA, then they are considered equal)
 The comparator functions must be reflexive, symmetrical but need not to be transitive.
 If substring comparator is used, then the field that has more longer fields is selected. Field from preferred record is selected, 
 if both fields have equal amounts of longer subfields.

 onlyIfMissing: boolean
 if onlyIfMissing is set, then field is copied from other record only if it's missing from the preferred record. So it defaults to field
 in preferred record, but if it's missing, then the field in other record will be used.


copy action may also have some options, which are:

compareWithout (array of subfield codes)
 When comparing fields in other and preferred, the similarity comparison of fields is done without using the listed subfields.
 If the fields are merged, then the combined unique list of compareWithout -subfields from both fields will be added to the merged field.
 
combine (array of subfield codes)
 combine multiple different subfields with same code into a single subfield wrapped by []. 
 So for example c20mk and c25mk becomes c[20mk, 25mk] 

compareWithoutIndicators (true|false)
 Field similarity comparison is made without considering indicators. The merged field will contain the indicators 
 from either source field, preferring items that have indicators set.

mustBeIdentical (true|false)
 Normally the field-wise comparison is made using normalized subfield sets. If other set is 
 a proper subset, then the fields are considered identical. 

 This behaviour can be changed with mustBeIdentical option, which skips the subset comparison and 
 requires the fields have identical sets of subfields (subfield values are still normalized)

*/
/*eslint-disable quotes*/

import { preset as MergeValidationPreset } from '../../marc-record-merge-validate-service';
import { preset as PostMergePreset } from '../../marc-record-merge-postmerge-service';
import TargetRecord from '../target-record';
import TargetSubrecord from '../target-subrecord';
import * as subrecordMergeTypes from '../subrecord-merge-types';

module.exports = {
  "name": "Fenni",
  "record": {
    "targetRecord": TargetRecord,
    "validationRules": MergeValidationPreset.melinda_host,
    "postMergeFixes": PostMergePreset.defaults,
    "mergeConfiguration": {
      "fields": {
        "020": { "action": "createFrom", "options": { "convertTag": "776", "ind1": "0", "ind2": "8", "subfields": { "i": { "replaceValue": "Painettu:" }, "a": { convertCode: "z", modifications: [ { type: "replace", args: [/-/g, ""] } ] } } } },
        "041": { "action": "copy", "options": { "dropOriginal": true } },
        "080": { "action": "copy", "options": { "copyIf": { "9": { "value": "FENNI<KEEP>" } } } },
        "084": { "action": "copy", "options": { "copyIf": { "9": { "value": "FENNI<KEEP>" } } } },
        "245": { "action": "copy", "options": { "dropOriginal": true } },
        "246": { "action": "copy" },
        "260": { "action": "copy" },
        "263": { "action": "copy" },
        "1..": { "action": "copy", "options": { "dropOriginal": true } },
        // "222": { "action": 'createFrom', "options": { "subfields": { "a": {}, "b": { "replaceValue": "(Verkkoaineisto)" } }} },
        "300": { "action": "createFrom", "options": { "subfields": { "a": { modifications: [ { type: "replace", args: [/ [;:]$/, ""] }, { type: "replace", args: [/ s\./, " sivua"] }, { type: "wrap", args: ["1 verkkoaineisto (", ")"] } ] } } } },
        "6..": { "action": "copy", "options": { "copyIf": { "9": { "value": "FENNI<KEEP>" } } } },
        "500": { "action": "copy", "options": { "copyIf": { "9": { "value": "FENNI<KEEP>" } } } },
        "502": { "action": "copy", "options": { "copyIf": { "9": { "value": "FENNI<KEEP>" } } } },
        "520": { "action": "copy", "options": { "copyIf": { "9": { "value": "FENNI<KEEP>" } } } },
        "567": { "action": "copy", "options": { "copyIf": { "9": { "value": "FENNI<KEEP>" } } } },
        "700": { "action": "copy", "options": { "copyUnless": { "9": { "value": "FENNI<DROP>" } } } },
        "710": { "action": "copy", "options": { "copyUnless": { "9": { "value": "FENNI<DROP>" } } } },
        "711": { "action": "copy", "options": { "copyUnless": { "9": { "value": "FENNI<DROP>" } } } },
        "490": { "action": "copy", "options": { "dropOriginal": true } },
        "776": { "action": "createFrom", "options": { "convertTag": "020", "ind1": " ", "ind2": " ", "subfields": { "z": {} } } },
        // "830": { "action": "copy", "options": { "dropOriginal": true } }
      }
    },
    "newFields": [
      { tag: '337', ind1: ' ', ind2: ' ', subfields: [ { code: 'a', value: 'tietokonekäyttöinen' }, { code: 'b', value: 'c' }, { code: '2', value: 'rdamedia' } ] },
      { tag: '338', ind1: ' ', ind2: ' ', subfields: [ { code: 'a', value: 'verkkoaineisto' }, { code: 'b', value: 'cr' }, { code: '2', value: 'rdacarrier' } ] }, 
      { tag: '538', ind1: ' ', ind2: ' ', subfields: [ { code: 'a', value: 'Internet-yhteys.' }, { code: '9', value: 'FENNI<KEEP>' } ] } 
    ]
  },
  "subrecords": {
    "mergeType": subrecordMergeTypes.MERGE,
    "targetRecord": TargetSubrecord,
    "validationRules": MergeValidationPreset.melinda_component,
    "postMergeFixes": PostMergePreset.defaults,
    "mergeConfiguration": {
      "fields": {
        "1..": { "action": "copy", "options": { "dropOriginal": true } },
        "245": { "action": "copy", "options": { "dropOriginal": true } },
        "336": { "action": "copy", "options": { "dropOriginal": true } },
        "337": { "action": "copy", "options": { "dropOriginal": true } },
        "77.": { "action": "copy", "options": { "compareWithout": ["9"] } }
      }
    }
  }
};

/*eslint-enable quotes*/
