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

import React from 'react';
import {connect} from 'react-redux';
import {selectRecordId} from '../record-utils';
import _ from 'lodash';
import classNames from 'classnames';
import * as uiActionCreators from '../ui-actions';
import '../../styles/components/search-dialog.scss';
import { RecordPanel } from 'commons/components/record-panel';
import { Preloader } from 'commons/components/preloader';

const SEARCH_DELAY = 500;

export class SearchDialog extends React.Component {

  constructor() {
    super();

    this.handleChangeDebounced = _.debounce((value) => {
      this.props.handleSearch(value);
    }, SEARCH_DELAY);

    this.state = {
      selectedRecord: 0
    };
  }

  close(event) {
    event.preventDefault();

    this.props.closeSearchDialog();
  }

  componentDidUpdate() {
    // update text fields if they are prefilled.
    window.Materialize && window.Materialize.updateTextFields();
  }

  handleChange(event) {
    const value = event.target.value;

    this.props.setSearchQuery(value);

    if (value.length >= 3) {
      this.handleChangeDebounced(value);
    }
  }

  handleRecordChange(event) {
    event.preventDefault();
    const { index } = event.target.dataset;

    this.setState(() => ({
      selectedRecord: parseInt(index, 10)
    }));
  }

  handleRecordTransfer(event) {
    event.preventDefault();

    const record = this.props.results.getIn(['records', this.state.selectedRecord]);

    const recordId = selectRecordId(record);

    if (event.target.id == 'move-to-source') {
      this.props.setSourceRecordId(recordId);
      this.props.fetchRecord(recordId, 'SOURCE');
    }
    else {
      this.props.setTargetRecordId(recordId);
      this.props.fetchRecord(recordId, 'TARGET');
    }
  }

  renderRecordSelector() {
    const { loading } = this.props;

    const records = this.props.results.get('records');

    return (
      <div className="col s6">
        <div className="collection">               
          {records.map((record, index) => {
            const recordId = selectRecordId(record);

            return (
              <a href="#" key={recordId} data-index={index} className={classNames("collection-item", {'active': this.state.selectedRecord === index})} onClick={(e) => this.handleRecordChange(e)}>{recordId}</a>
            )
          })}
        </div>
      </div>
    )
  }

  renderRecordPanel() {
    const selectedRecord = this.props.results.getIn(['records', this.state.selectedRecord]);

    return (
      <div className="col s6">
        <RecordPanel record={selectedRecord}>
          {selectedRecord ? (
            <div className="card-action">
              <a href="#" className="valign" id="move-to-source" onClick={(e) => this.handleRecordTransfer(e)}>Siirrä lähde tietueeksi</a>
              <a href="#" className="valign" id="move-to-target" onClick={(e) => this.handleRecordTransfer(e)}>Siirrä kohde tietueeksi</a>
            </div> 
          ) : null}
        </RecordPanel>
      </div>
    );
  }

  renderResultsRow() {
    return (
      <div className="section row">
        {this.renderRecordSelector()}

        {this.renderRecordPanel()}
      </div>
    );
  }

  renderQueryInput() {
    const { query } = this.props;

    return (
      <div className="row">
        <div className="input-field col s2">
          <input id="search_query" type="text" value={query} onChange={(e) => this.handleChange(e)} />
          <label htmlFor="search_query">Hakusana:</label>
        </div>
      </div>
    );
  }

  render() {

    return (
      <div className="row modal-search-dialog">
        <div className="modal-search-dialog-outer card">
          <div className="modal-search-dialog-title card-content">
            <span className="card-title">Hae<i onClick={(e) => this.close(e)} className="material-icons right">close</i></span>
          </div>

          <div className="modal-search-dialog-content card-content">
            {this.renderQueryInput()}

            <div className="divider"></div>

            {this.props.loading ? <Preloader /> : this.props.results.get('numberOfRecords') > 0 ? this.renderResultsRow(): null}
          </div>
          <div className="card-action right-align">
            <a href="#" onClick={(e) => this.close(e)}>Valmis</a>
          </div>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    query: state.getIn(['search', 'query']),
    results: state.getIn(['search', 'results']),
    loading: state.getIn(['search', 'loading'])
  };
}

export const SearchDialogContainer = connect(
  mapStateToProps,
  uiActionCreators
)(SearchDialog);