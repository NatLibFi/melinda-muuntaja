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

import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import {editMergedRecord, toggleSourceRecordFieldSelection} from '../ui-actions';
import {saveRecord} from '../action-creators/record-actions';
import {RecordPanel} from 'commons/components/record-panel';
import {Preloader} from 'commons/components/preloader';
import {ErrorMessagePanel} from 'commons/components/error-message-panel';
import {MergeValidationErrorMessagePanel} from 'commons/components/merge-validation-error-message-panel';
import {isControlField} from '../utils';
import _ from 'lodash';
import {withRouter} from 'react-router';
import classNames from 'classnames';
import * as uiActionCreators from '../ui-actions';
import '../../styles/components/record-merge-panel.scss';
import {recordSaveActionAvailable, hostRecordActionsEnabled} from '../selectors/merge-status-selector';

let typeTimerSource;
let typeTimerTarget;
const RECORD_LOADING_DELAY = 1000;
export class RecordMergePanel extends React.Component {

  static propTypes = {
    mergedRecord: PropTypes.object,
    mergedRecordError: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Error)]),
    mergedRecordSaveError: PropTypes.instanceOf(Error),
    mergedRecordState: PropTypes.string.isRequired,
    sourceRecord: PropTypes.object,
    sourceRecordError: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Error)]),
    sourceRecordState: PropTypes.string.isRequired,
    targetRecord: PropTypes.object,
    targetRecordError: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Error)]),
    targetRecordState: PropTypes.string.isRequired,
    toggleSourceRecordFieldSelection: PropTypes.func.isRequired,
    saveRecord: PropTypes.func.isRequired,
    editMergedRecord: PropTypes.func.isRequired,
    controlsEnabled: PropTypes.bool.isRequired,
    targetRecordId: PropTypes.string.isRequired,
    sourceRecordId: PropTypes.string.isRequired,
    setSourceRecordId: PropTypes.func.isRequired,
    setTargetRecordId: PropTypes.func.isRequired,
    swapRecords: PropTypes.func.isRequired,
    fetchRecord: PropTypes.func.isRequired,
    saveButtonVisible: PropTypes.bool.isRequired,
    locationDidChange: PropTypes.func.isRequired,
    resetSourceRecord: PropTypes.func.isRequired,
    resetTargetRecord: PropTypes.func.isRequired,
    history: PropTypes.object.isRequired
  };

  constructor() {
    super();
    this.state = {
      editMode: false
    };
  }

  UNSAFE_componentWillMount() {
    this.unlisten = this.props.history.listen(location => this.props.locationDidChange(location));
    this.props.locationDidChange(this.props.history.location);
  }

  UNSAFE_componentWillReceiveProps(next) {
    if (next.targetRecordId === this.props.targetRecordId && next.sourceRecordId === this.props.sourceRecordId) return;
    if (_.identity(next.targetRecordId) && _.identity(next.sourceRecordId)) {
      this.props.history.push(`/record/${next.sourceRecordId}/to/${next.targetRecordId}`);
    }
    else if (_.identity(next.sourceRecordId)) {
      this.props.history.push(`/record/${next.sourceRecordId}`);
    }
    else {
      this.props.history.push('/');
    }
  }

  toggleSourceRecordField(field) {
    if (!isControlField(field)) {
      this.props.toggleSourceRecordFieldSelection(field);
    }
  }

  toggleMergedRecordField(field) {
    if (field.fromOther && !isControlField(field)) {
      this.props.toggleSourceRecordFieldSelection(field);
    }
  }

  handleEditModeChange(event) {
    event.preventDefault();
    this.setState({
      editMode: !this.state.editMode
    });
  }

  handleChange(event) {
    const {controlsEnabled} = this.props;
    if (!controlsEnabled) {
      return;
    }

    event.persist();

    if (event.target.id === 'source_record') {
      if (event.target.value.length > 0) {
        this.props.setSourceRecordId(event.target.value);
        this.props.fetchRecord(event.target.value, 'SOURCE');
      }
      else {
        this.props.resetSourceRecord();
      }
    }
    if (event.target.id === 'target_record') {
      if (event.target.value.length > 0) {
        this.props.setTargetRecordId(event.target.value);
        this.props.fetchRecord(event.target.value, 'TARGET');
      }
      else {
        this.props.resetTargetRecord();
      }
    }
  }

  handleSwap() {
    const {controlsEnabled} = this.props;

    if (controlsEnabled) {
      this.props.swapRecords();
    }
  }

  onChangeSourceTimer(event) {
    clearTimeout(typeTimerSource);
    typeTimerSource = setTimeout(this.handleChange(event), RECORD_LOADING_DELAY);
  }

  onChangeTargetTimer(event) {
    clearTimeout(typeTimerTarget);
    typeTimerTarget = setTimeout(this.handleChange(event), RECORD_LOADING_DELAY);
  }

  renderSourceRecordPanel(recordState, errorMessage, record) {
    const {controlsEnabled} = this.props;

    const swapButtonClasses = classNames({
      'waves-effect': controlsEnabled,
      'waves-light': controlsEnabled,
      'disabled': !(this.props.targetRecordId && this.props.sourceRecordId)
    });

    const button = (
      <div className="button tooltip" title="Vaihda keskenään">
        <a className={swapButtonClasses} href="#" onClick={(e) => this.handleSwap(e)}>
          <i className="material-icons left">swap_horiz</i>
        </a>
      </div>
    );

    const sourceField = this.recordInput('source_record', this.props.sourceRecordId, this.onChangeSourceTimer.bind(this), !controlsEnabled, 'Lähdetietue', button);

    if (recordState === 'ERROR') {
      return (<ErrorMessagePanel
        typePanel
        recordHeader={sourceField}
        message={errorMessage} />);
    }

    return (
      <RecordPanel
        showHeader
        recordHeader={sourceField}
        record={record}
        onFieldClick={(field) => this.toggleSourceRecordField(field)}
      >
        {recordState === 'LOADING' ? <div className="card-content"><Preloader /></div> : null}
      </RecordPanel>
    );
  }

  recordInput(id, value, onChange, disable, label, button = null) {
    return (
      <div className="row title-row-card">
        <div className="input-field col 11s">
          <input id={id} type="tel" value={value} onChange={onChange} disabled={disable} />
          {value ? <label className="active" htmlFor={id}>{label}</label> : <label htmlFor={id}>{label}</label>}
        </div>
        {button}
      </div>
    );
  }

  renderTargetRecordPanel(recordState, errorMessage, record) {
    const {controlsEnabled} = this.props;
    const targetField = this.recordInput('target_record', this.props.targetRecordId, this.onChangeTargetTimer.bind(this), !controlsEnabled, 'Pohjatietue');

    if (recordState === 'ERROR') {
      return (<ErrorMessagePanel
        typePanel
        recordHeader={targetField}
        message={errorMessage} />);
    }

    return (
      <RecordPanel
        showHeader
        recordHeader={targetField}
        record={record}
      >
        {recordState === 'LOADING' ? <div className="card-content"><Preloader /></div> : null}
      </RecordPanel>
    );
  }

  mergeHeader(record = null) {
    const editButtonClasses = classNames({
      disabled: !record,
      active: this.state.editMode
    });

    return (
      <div className="row title-row-card">
        <div className="title-wrapper col 11s">
          <ul ref={(c) => this._tabs = c}>
            <li className="title">Tulostietue</li>
            <li className="button tooltip" title="Muokkaa"><a className={editButtonClasses} href="#" onClick={(e) => this.handleEditModeChange(e)}><i className="material-icons">edit</i></a></li>
          </ul>
        </div>
      </div>
    );
  }

  renderMergedRecordPanel(recordState, errorMessage, record) {
    if (recordState === 'ERROR') {
      return (<MergeValidationErrorMessagePanel
        recordHeader={this.mergeHeader()}
        typePanel
        error={errorMessage} />);
    }

    return (
      <RecordPanel
        showHeader
        editable={this.state.editMode}
        recordHeader={this.mergeHeader(record)}
        record={record}
        onFieldClick={(field) => this.toggleMergedRecordField(field)}
        onRecordUpdate={(record) => this.props.editMergedRecord(record)}>
        {recordState === 'LOADING' ? <div className="card-content"><Preloader /></div> : null}
      </RecordPanel>
    );
  }

  render() {
    return (
      <div className="row record-merge-panel">
        <div className="col s4">
          <div className="card darken-1 marc-record marc-record-source">
            {this.renderSourceRecordPanel(this.props.sourceRecordState, this.props.sourceRecordError, this.props.sourceRecord)}
          </div>
        </div>
        <div className="col s4">
          <div className="card darken-1 marc-record marc-record-target">
            {this.renderTargetRecordPanel(this.props.targetRecordState, this.props.targetRecordError, this.props.targetRecord)}
          </div>
        </div>
        <div className="col s4">
          <div className="card darken-1 marc-record marc-record-merged">
            {this.renderMergedRecordPanel(this.props.mergedRecordState, this.props.mergedRecordError, this.props.mergedRecord)}
          </div>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    mergedRecord: (state.getIn(['mergedRecord', 'record'])),
    mergedRecordError: state.getIn(['mergedRecord', 'errorMessage']),
    mergedRecordSaveError: state.getIn(['mergedRecord', 'saveError']),
    mergedRecordState: state.getIn(['mergedRecord', 'state']),
    sourceRecord: (state.getIn(['sourceRecord', 'record'])),
    sourceRecordError: state.getIn(['sourceRecord', 'errorMessage']),
    sourceRecordState: state.getIn(['sourceRecord', 'state']),
    targetRecord: state.getIn(['targetRecord', 'state']) === 'EMPTY' ? state.getIn(['config', 'mergeProfiles', state.getIn(['config', 'selectedMergeProfile']), 'record', 'targetRecord']) : state.getIn(['targetRecord', 'record']),
    targetRecordError: state.getIn(['targetRecord', 'state']) === 'EMPTY' ? null : state.getIn(['targetRecord', 'errorMessage']),
    targetRecordState: state.getIn(['targetRecord', 'state']) === 'EMPTY' ? 'LOADED' : state.getIn(['targetRecord', 'state']),
    saveButtonVisible: recordSaveActionAvailable(state),
    controlsEnabled: hostRecordActionsEnabled(state),
    sourceRecordId: state.getIn(['sourceRecord', 'id']) || '',
    targetRecordId: state.getIn(['targetRecord', 'id']) || ''
  };
}

export const RecordMergePanelContainer = withRouter(connect(
  mapStateToProps,
  {editMergedRecord, toggleSourceRecordFieldSelection, saveRecord, ...uiActionCreators}
)(RecordMergePanel));
