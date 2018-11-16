/**
*
* @licstart  The following is the entire license notice for the JavaScript code in this file.
*
* UI for transforming MARC records
*
* Copyright (C) 2015-2017 University Of Helsinki (The National Library Of Finland)
*
* This file is part of melinda-eresource-tool
*
* melinda-eresource-tool program is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as
* published by the Free Software Foundation, either version 3 of the
* License, or (at your option) any later version.
*
* melinda-eresource-tool is distributed in the hope that it will be useful,
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
import '../../styles/components/toolbar.scss';
import {connect} from 'react-redux';
import * as uiActionCreators from '../ui-actions';
import { withRouter } from 'react-router';
export class ToolBar extends React.Component {

  static propTypes = {
    resetWorkspace: PropTypes.func.isRequired,
    openSearchDialog: PropTypes.func.isRequired,
    selectedMergeProfile: PropTypes.string.isRequired,
    switchMergeConfig: PropTypes.func.isRequired,
    mergeProfiles: PropTypes.array,
    selectedMergeType: PropTypes.string.isRequired,
    switchMergeType: PropTypes.func.isRequired
  };

  constructor() {
    super();
    this.state = {
      displayProfileInfo: false
    };
  }

  componentDidUpdate() {
    // update text fields if they are prefilled.
    window.Materialize && window.Materialize.updateTextFields();
    window.$(this.mergeProfileSelect).on('change', (event) => this.handleMergeProfileChange(event.target.value)).material_select();
    window.$(this.mergeType).on('change', (event) => this.changeMergeTypeHandler(event)).material_select();
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.closeProfileInfo, false);
    if (typeof this.unlisten === 'function') {
      this.unlisten();
    }
  }

  displayProfileInfo(e) {
    e.preventDefault();
    this.setState({
      displayProfileInfo: true
    });
    document.addEventListener('click', this.closeProfileInfo);
  }

  closeProfileInfo = (e) => {
    if (e.target !== this.profileInfoDialog && !this.profileInfoDialog.contains(e.target)) {
      this.setState({
        displayProfileInfo: false
      });
      document.removeEventListener('click', this.closeProfileInfo, false);
    }
  };

  changeMergeTypeHandler = (event) => {
    if (this.props.selectedMergeType !== event.target.value) this.props.switchMergeType(event.target.value);
  }


  handleMergeProfileChange(value) {
    if (this.props.selectedMergeProfile !== value) this.props.switchMergeConfig(value);
  }

  startNewPair(event) {
    event.preventDefault();
    this.props.resetWorkspace();
  }

  openSearchDialog(event) {
    event.preventDefault();
    this.props.openSearchDialog();
  }

  setDefaultProfile() {
    this.props.switchMergeConfig('default');
    return null;
  }

  renderNewPairButton() {
    return (
      <div className="mt-inline">
        <a
          href="#"
          onClick={(e) => this.startNewPair(e)}>
          <i
            className="material-icons tooltip"
            title="Aloita uusi">add
          </i>
        </a>
        <span className="group-label">Uusi</span>
      </div>
    );
  }

  renderSearchRecordButton() {
    return (
      <div className="mt-inline">
        <a
          href="#"
          onClick={(e) => this.openSearchDialog(e)}>
          <i
            className="material-icons tooltip"
            title="Hae tietuetta">search
          </i>
        </a>
        <span className="group-label">Hae</span>
      </div>
    );
  }

  renderHelpButton() {
    return (
      <div className="mt-inline">
        <a
          href="https://www.kiwi.fi/x/iBcvBQ"
          target="_blank"
          rel="noopener noreferrer">
          <i
            className="material-icons tooltip"
            title="Käyttöohje">help
          </i>
        </a>
        <span className="group-label">Ohje</span>
      </div>
    );
  }

  renderMergeType(){
    return (
      <div className="col s3 offset-s1 input-field">
        <select ref={(ref) => this.mergeType = ref}>
          <option value="printToE">Painetusta e-aineistoksi</option>
          <option value="eToPrint">E-aineistosta painetuksi</option>
        </select>
        <label>Muunnostyyppi</label>
      </div>
    );
  }

  renderMergeProfile() {
    const { mergeProfiles, selectedMergeType } = this.props;
    const profile = mergeProfiles.find(({key}) => key === this.props.selectedMergeProfile);
    const selectedMergeProfile = profile === undefined ?  mergeProfiles[0] : profile;
    const filteredProfiles = mergeProfiles.filter(profile => profile.mergeType === selectedMergeType);

    return (
      <div>
        {mergeProfiles.length > 0 && (
          <div className="col s3 input-field">
            <select
              defaultValue={selectedMergeProfile.key}
              ref={(ref) => this.mergeProfileSelect = ref}>
              {filteredProfiles.map(({key, name}) => (
                <option key={key} value={key}>{name}</option>
              ))}
            </select>
            <label>Muunnosprofiili</label>
          </div>
        )}
        <div className="col s2">
          {selectedMergeProfile.description && (
            <a
              href="#"
              data-activates="profile-selector-info"
              onClick={(e) => this.displayProfileInfo(e)}>
              <i
                className="material-icons mt-info-badge"
                title="Kuvaus">info
              </i>
            </a>
          )}
          {selectedMergeProfile.description && this.state.displayProfileInfo && (
            <div
              id="profile-selector-info"
              className="card mt-info-toast"
              ref={(ref) => this.profileInfoDialog = ref}>
              <div className="card-content">{selectedMergeProfile.description}</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  render() {
    return (
      <div id="control-box" className="toolbar row">
        <div className="col s3 mt-controls">
          {this.renderNewPairButton()}
          {this.renderSearchRecordButton()}
          {this.renderHelpButton()}
        </div>
        {this.renderMergeType()}
        {this.renderMergeProfile()}
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    selectedMergeProfile: state.getIn(['config', 'selectedMergeProfile']),
    mergeProfiles: state.getIn(['config', 'mergeProfiles']).map((value, key) => ({ 
      key, name: value.get('name'), 
      description: value.get('description'), 
      mergeType: value.get('mergeType')})
    ).toList().toJS(),
    selectedMergeType: state.getIn(['config', 'mergeType'])
  };
}

export const ToolBarContainer = withRouter(connect(
  mapStateToProps,
  uiActionCreators
)(ToolBar));