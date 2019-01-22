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
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {selectRecordId} from '../record-utils';
import _ from 'lodash';
import classNames from 'classnames';
import * as uiActionCreators from '../ui-actions';
import '../../styles/components/search-dialog.scss';
import { RecordPanel } from 'commons/components/record-panel';
import { Preloader } from 'commons/components/preloader';
import { MarcRecordPanel } from 'commons/components/marc-record-panel';
import { toOnlySubfields } from '../record-utils';

const SEARCH_DELAY = 500;

export class SearchDialog extends React.Component {

  static propTypes = {
    handleSearch: PropTypes.func.isRequired,
    setSearchQuery: PropTypes.func.isRequired,
    setSearchPage: PropTypes.func.isRequired,
    setSearchIndex: PropTypes.func.isRequired,
    clearSearchResults: PropTypes.func.isRequired,
    closeSearchDialog: PropTypes.func.isRequired,
    setSourceRecordId: PropTypes.func.isRequired,
    setTargetRecordId: PropTypes.func.isRequired,
    fetchRecord: PropTypes.func.isRequired,
    results: PropTypes.object.isRequired,
    currentPage: PropTypes.number.isRequired,
    query: PropTypes.string.isRequired,
    loading: PropTypes.bool.isRequired,
    error: PropTypes.bool.isRequired,
    showResults: PropTypes.bool.isRequired,
    targetRecordId: PropTypes.string,
    sourceRecordId: PropTypes.string,
  }

  constructor() {
    super();

    this.handleChangeDebounced = _.debounce(() => {
      this.props.clearSearchResults();
      this.props.handleSearch();
    }, SEARCH_DELAY);

    this.state = {
      selectedRecord: 0,
    };
  }


  componentDidMount() {
    window.$(this.searchIndexSelect).on('change', (event) => this.handleSearchIndexChange(event)).material_select();

    document.getElementsByTagName('html')[0].classList.add('modal-open');
  }

  componentDidUpdate() {
    // update text fields if they are prefilled.
    window.Materialize && window.Materialize.updateTextFields();
  }

  componentWillUnmount() {
    document.getElementsByTagName('html')[0].classList.remove('modal-open');
  }

  close(event) {
    event.preventDefault();

    this.props.closeSearchDialog();
  }

  handleChange(event) {
    const value = event.target.value;

    this.props.setSearchQuery(value);

    if (value.length >= 3) {
      this.handleChangeDebounced(value);
    }
    else {
      this.props.clearSearchResults();
    }
  }

  handleSearchIndexChange(event) {
    this.props.setSearchIndex(event.target.value);
    if (this.props.query.length >= 3) {
      this.props.clearSearchResults();
      this.props.handleSearch();
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

    const record = this.props.results.records[this.state.selectedRecord];

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

  switchNextPage(event) {
    event.preventDefault();

    if (this.props.currentPage === this.props.results.numberOfPages) return;

    const page = this.props.currentPage + 1;

    this.props.setSearchPage(page);
    this.props.handleSearch();
    this.setState(() => ({
      selectedRecord: 0
    }));
  }

  switchPrevPage(event) {
    event.preventDefault();

    if (this.props.currentPage === 1) return;

    const page = this.props.currentPage + 0;

    this.props.setSearchPage(page);
    this.props.handleSearch();
    this.setState(() => ({
      selectedRecord: 0
    }));
  }

  switchPage(event) {
    event.preventDefault();

    const page = parseInt(event.target.dataset.page, 10); 

    this.props.setSearchPage(page);
    this.props.handleSearch();
    this.setState(() => ({
      selectedRecord: 0
    }));
  }

  getPaginationArray (currentPage, totalPages) {
    let result;

    const startPage = _.max([1, currentPage - (3 + _.max([0, currentPage - totalPages + 3]))]);
    const endPage = _.min([totalPages + 1, startPage + 7]);

    result = _.range(startPage, endPage);

    if (startPage > 1) {
      result.unshift('...');
      result.unshift(1);
    }

    if (endPage <= totalPages) {
      result.push('...');
      result.push(totalPages);
    }

    return result;
  }

  renderRecordCollection() {
    const { loading, error, targetRecordId, sourceRecordId, results: { records, numberOfRecords} } = this.props;

    if (loading) {
      return (
        <div className="card darken-1 collection modal-search-dialog-record-selector loading">
          <Preloader />
        </div>
      );
    } else if(error) {
      return (
        <div className="card darken-1 collection modal-search-dialog-record-selector loading">
          Haussa tapahtui virhe.
        </div>
      );
    } else if(numberOfRecords === 0) {
      return (
        <div className="card darken-1 collection modal-search-dialog-record-selector loading">
          Hakutuloksia ei löytynyt.
        </div>
      );
    }

    return (
      <ul className="card darken-1 modal-search-dialog-record-selector">
        {records.map((record, index) => {
          const recordId = selectRecordId(record);
          
          const visibleFields = ['245', '338'];

          const selectedFields = record.fields
            .filter(f => _.includes(visibleFields, f.tag))
            .map(toOnlySubfields('338', ['a']))
            .filter(f => f.subfields.length !== 0);

          const trimmedRecord = {
            fields: selectedFields
          };

          return (
            <li key={recordId} data-index={index} className={classNames({'active': this.state.selectedRecord === index})} onClick={(e) => this.handleRecordChange(e)}>
              <MarcRecordPanel record={trimmedRecord} />

              <div className="selected-record-container">
                {targetRecordId === recordId ? (
                  <div>Pohjatietue</div>
                ): null}

                {sourceRecordId === recordId ? (
                  <div>Lähdetietue</div>
                ): null}
              </div>
            </li>
          );
        })}
      </ul>
    );
  }

  renderRecordSelector() {
    const { currentPage, results: { numberOfPages } } = this.props;
   
    const paginationArray = this.getPaginationArray(currentPage, numberOfPages);

    return (
      <div className="col s6">
        {this.renderRecordCollection()}
        
        {numberOfPages > 1 ? (
          <ul className="pagination">
            <li className={classNames({'waves-effect': currentPage !== 1, disabled: currentPage === 1})}><a href="#!"><i className="material-icons" onClick={(e) => this.switchPrevPage(e)}>chevron_left</i></a></li>

            {paginationArray.map((page,index) => {
              if (page === '...') {
                return (
                  <li key={index} className="disabled valign-bottom"><a href="#!">...</a></li>
                );
              }
              return (
                <li key={index} className={classNames({'waves-effect': page !== currentPage, active: page === currentPage})}><a href="#" data-page={page} onClick={(e) => this.switchPage(e)} >{page}</a></li>
              );
            }
            )}
            <li className={classNames({'waves-effect': currentPage !== numberOfPages, disabled: currentPage === numberOfPages})}><a href="#" onClick={(e) => this.switchNextPage(e)}><i className="material-icons">chevron_right</i></a></li>
          </ul>
        ) : null}
      </div>
    );
  }

  renderRecordPanel() {
    const selectedRecord = this.props.results.records[this.state.selectedRecord];

    if (!selectedRecord) {
      return (
        <div className="col s6">
          <div className="card darken-1"/>
        </div>
      );
    }

    return (
      <div className="col s6">
        <div className="card darken-1">
          <div className="card-action move-to-container">
            <a href="#" className="btn waves-effect waves-light" id="move-to-source" onClick={(e) => this.handleRecordTransfer(e)}>Siirrä lähdetietueeksi</a>
            <a href="#" className="btn waves-effect waves-light" id="move-to-target" onClick={(e) => this.handleRecordTransfer(e)}>Siirrä pohjatietueeksi</a>
          </div> 
          <RecordPanel record={selectedRecord} />
        </div>
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
        <div className="col s2 input-field">
          <select ref={(ref) => this.searchIndexSelect = ref}>
            <option value="default">Kaikki sanat</option>
            <option value="dc.title">Nimeke</option>
            <option value="dc.author">Tekijä</option>
            <option value="bath.isbn">ISBN</option>
          </select>
          <label>Hakutyyppi</label>
        </div>
        <div className="input-field col s2">
          <input id="search_query" type="text" value={query} onChange={(e) => this.handleChange(e)} />
          <label htmlFor="search_query">Hakusana:</label>
        </div>
      </div>
    );
  }

  render() {
    const { showResults } = this.props;

    return (
      <div className="row modal-search-dialog">
        <div className="modal-search-dialog-outer card">
          <div className="modal-search-dialog-title card-content">
            <span className="card-title">Hae<i onClick={(e) => this.close(e)} className="material-icons right">close</i></span>
          </div>

          <div className="modal-search-dialog-content card-content">
            {this.renderQueryInput()}

            <div className="divider" />

            {showResults && this.renderResultsRow()}
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
    targetRecordId: state.getIn(['targetRecord', 'id']),
    sourceRecordId: state.getIn(['sourceRecord', 'id']),
    query: state.getIn(['search', 'query']),
    results: state.getIn(['search', 'results']).toJS(),
    loading: state.getIn(['search', 'loading']),
    showResults: state.getIn(['search', 'showResults']),
    error: state.getIn(['search', 'error']),
    currentPage: state.getIn(['search', 'currentPage'])
  };
}

export const SearchDialogContainer = connect(
  mapStateToProps,
  uiActionCreators
)(SearchDialog);