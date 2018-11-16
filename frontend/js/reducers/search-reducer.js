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
import {OPEN_SEARCH_DIALOG, CLOSE_SEARCH_DIALOG, SET_SEARCH_QUERY, SET_SEARCH_ERROR, EXECUTE_SEARCH, SET_SEARCH_RESULTS,SET_SEARCH_PAGE, CLEAR_SEARCH_RESULTS, SET_SEARCH_INDEX} from '../ui-actions';

const INITIAL_STATE = Map({
  query: '',
  index: null,
  visible: false,
  currentPage: 1,
  loading: false,
  error: false,
  showResults: false,
  results: Map({
    numberOfRecords: 0,
    numberOfPages: 0,
    records: List()
  })
});

export default function location(state = INITIAL_STATE, action) {
  switch (action.type) {
    case CLOSE_SEARCH_DIALOG:
      return INITIAL_STATE;
    case OPEN_SEARCH_DIALOG:
      return state.set('visible', true);
    case SET_SEARCH_ERROR:
      return state
        .set('loading', false) 
        .set('error', true); 
    case SET_SEARCH_INDEX:
      return state
        .set('index', action.index === 'default' ? null : action.index);
    case SET_SEARCH_QUERY:
      return state
        .set('query', action.query);
    case CLEAR_SEARCH_RESULTS: 
      return state
        .set('currentPage', 1)
        .set('results', INITIAL_STATE.get('results'))
        .set('showResults', false)
        .set('error', false);
    case SET_SEARCH_PAGE:
      return state
        .set('currentPage', action.page);
    case EXECUTE_SEARCH:
      return state
        .set('loading', true)
        .set('showResults', true)
        .set('error', false);
    case SET_SEARCH_RESULTS: 
      return state
        .set('results', Map({
          numberOfRecords: parseInt(action.results.numberOfRecords, 10),
          numberOfPages: parseInt(action.results.numberOfPages, 10),
          records: List(action.results.records)
        }))
        .set('loading', false);
  }
  return state;
}

