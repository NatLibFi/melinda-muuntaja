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

import { Map, List } from 'immutable'; 
import {OPEN_SEARCH_DIALOG, CLOSE_SEARCH_DIALOG, SET_SEARCH_QUERY, EXECUTE_SEARCH, SET_SEARCH_RESULTS} from '../ui-actions';

const INITIAL_STATE = Map({
  query: '',
  visible: false,
  loading: false,
  results: Map({
    numberOfRecords: 0,
    records: List()
  })
});

export default function location(state = INITIAL_STATE, action) {
  switch (action.type) {
    case CLOSE_SEARCH_DIALOG:
      return INITIAL_STATE;
    case OPEN_SEARCH_DIALOG:
      return state.set('visible', true);
    case SET_SEARCH_QUERY:
      return state
        .set('query', action.query)
        .set('results', Map({
          numberOfRecords: 0,
          records: List()
        }));
    case EXECUTE_SEARCH:
      return state.set('loading', true);
    case SET_SEARCH_RESULTS: 
      return state
        .set('results', Map({
          numberOfRecords: action.results.numberOfRecords,
          records: List(action.results.records)
        }))
        .set('loading', false);
  }
  return state;
}

