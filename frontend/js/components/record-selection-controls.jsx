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
import '../../styles/components/record-selection-controls';
import * as uiActionCreators from '../ui-actions';
import {connect} from 'react-redux';
import _ from 'lodash';
import {hashHistory} from 'react-router';
import { hostRecordActionsEnabled } from '../selectors/merge-status-selector';
import classNames from 'classnames';

const RECORD_LOADING_DELAY = 500;

export class RecordSelectionControls extends React.Component {

  static propTypes = {
    selectedMergeProfile: React.PropTypes.object.isRequired,
    sourceRecordId: React.PropTypes.string.isRequired,
    targetRecordId: React.PropTypes.string.isRequired,
    switchMergeConfig: React.PropTypes.func.isRequired,
    resetSourceRecord: React.PropTypes.func.isRequired,
    resetTargetRecord: React.PropTypes.func.isRequired,
    fetchRecord: React.PropTypes.func.isRequired,
    swapRecords: React.PropTypes.func.isRequired,
    setSourceRecordId: React.PropTypes.func.isRequired,
    setTargetRecordId: React.PropTypes.func.isRequired,
    locationDidChange: React.PropTypes.func.isRequired,
    controlsEnabled: React.PropTypes.bool.isRequired,
    mergeProfiles: React.PropTypes.array
  }

  constructor() {
    super();
    this.handleSourceChangeDebounced = _.debounce((event) => {
      if (event.target.value.length > 0) this.props.fetchRecord(event.target.value, 'SOURCE');
    }, RECORD_LOADING_DELAY);

    this.handleTargetChangeDebounced = _.debounce((event) => {
      if (event.target.value.length > 0) this.props.fetchRecord(event.target.value, 'TARGET');
    }, RECORD_LOADING_DELAY);

    this.state = {
      displayProfileInfo: false
    };
  }

  componentWillMount() {
    const unlisten = hashHistory.listen(location => this.props.locationDidChange(location));
    this.setState({ unlisten });
  }

  componentWillReceiveProps(next) {
    if (next.targetRecordId === this.props.targetRecordId && next.sourceRecordId === this.props.sourceRecordId) return;

    if (_.identity(next.targetRecordId) && _.identity(next.sourceRecordId)) {
      hashHistory.push(`/record/${next.sourceRecordId}/to/${next.targetRecordId}`);
    }
    else if (_.identity(next.sourceRecordId)) {
      hashHistory.push(`/record/${next.sourceRecordId}`);
    }
    else {
      hashHistory.push('/');
    }
  }

  componentDidUpdate() {
    // update text fields if they are prefilled.
    window.Materialize && window.Materialize.updateTextFields();

    window.$(this.mergeProfileSelect).on('change', (event) => this.handleMergeProfileChange(event.target.value)).material_select();
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.closeProfileInfo, false);

    if (typeof this.state.unlisten == 'function') {
      this.state.unlisten();
    }
  }

  handleMergeProfileChange(value) {
    if (this.props.selectedMergeProfile !== value) this.props.switchMergeConfig(value);
  }

  handleChange(event) {
    const { controlsEnabled } = this.props;
    if (!controlsEnabled) {
      return;
    }

    event.persist();
    
    if (event.target.id === 'source_record') {
      if (event.target.value.length > 0) {
        this.props.setSourceRecordId(event.target.value);
        this.handleSourceChangeDebounced(event);
      }
      else {
        this.props.resetSourceRecord();
      }
    
    }
    if (event.target.id === 'target_record') {
      if (event.target.value.length > 0) {
        this.props.setTargetRecordId(event.target.value);
        this.handleTargetChangeDebounced(event);
      }
      else {
        this.props.resetTargetRecord();
      }
    }
  }

  handleSwap() {
    const { controlsEnabled } = this.props;

    if (controlsEnabled) {
      this.props.swapRecords();
    }

  }

  closeProfileInfo = (e) => {
    if (e.target !== this.profileInfoDialog && !this.profileInfoDialog.contains(e.target)) {
      this.setState({
        displayProfileInfo: false
      });

      document.removeEventListener('click', this.closeProfileInfo, false);
    }
  }

  displayProfileInfo(e) {
    e.preventDefault();

    this.setState({
      displayProfileInfo: true
    });

    document.addEventListener('click', this.closeProfileInfo);
  }

  render() {

    const { controlsEnabled, mergeProfiles, selectedMergeProfile } = this.props;

    const swapButtonClasses = classNames('btn-floating', 'blue', {
      'waves-effect': controlsEnabled,
      'waves-light': controlsEnabled,
      'disabled': !controlsEnabled
    });

    return (
      <div className="row row-margin-swap record-selection-controls">
      
        <div className="col s2 offset-s1 input-field">
          <input id="source_record" type="tel" value={this.props.sourceRecordId} onChange={this.handleChange.bind(this)} disabled={!controlsEnabled} />
          <label htmlFor="source_record">Lähdetietue</label>
        </div>

        <div className="col s2 control-swap-horizontal input-field">
          <div>
            <a className={swapButtonClasses} onClick={(e) => this.handleSwap(e)}>
              <i className="material-icons tooltip small" title="Vaihda keskenään">swap_horiz</i>
            </a>
          </div>
        </div>

        <div className="col s2 input-field">
          <input id="target_record" type="tel" value={this.props.targetRecordId} onChange={this.handleChange.bind(this)} disabled={!controlsEnabled}/>
          <label htmlFor="target_record">Pohjatietue</label>
        </div>
        
        <div className="col s2 offset-s2 profile-selector">
          {mergeProfiles.length > 1 && (
            <div className="input-field">
              <select ref={(ref) => this.mergeProfileSelect = ref}>
                {mergeProfiles.map(({key, name}) => (
                  <option key={key} value={key}>{name}</option>
                ))}
              </select>
              <label>Muunnosprofiili</label>
            </div>
          )}
          {selectedMergeProfile.description && (
            <a href="#" data-activates="profile-selector-info" onClick={(e) => this.displayProfileInfo(e)}>
              <i className="material-icons" title="Kuvaus">info</i>
            </a>
          )}
        
          {selectedMergeProfile.description && this.state.displayProfileInfo && (
            <div id="profile-selector-info" className="card" ref={(ref) => this.profileInfoDialog = ref}>
              <div className="card-content">{selectedMergeProfile.description}</div>
            </div>
          )}
    
        </div>
      </div>
    );
  }

}

function mapStateToProps(state) {
  return {
    sourceRecordId: state.getIn(['sourceRecord', 'id']) || '',
    targetRecordId: state.getIn(['targetRecord', 'id']) || '',
    selectedMergeProfile: state.getIn(['config', 'mergeProfiles', state.getIn(['config', 'selectedMergeProfile'])]).toJS(),
    mergeProfiles: state.getIn(['config', 'mergeProfiles']).map((value, key) => ({ key, name: value.get('name') })).toList().toJS(),
    controlsEnabled: hostRecordActionsEnabled(state)
  };
}

export const RecordSelectionControlsContainer = connect(
  mapStateToProps,
  uiActionCreators
)(RecordSelectionControls);
