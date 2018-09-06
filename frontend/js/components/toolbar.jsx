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
import {hostRecordActionsEnabled} from '../selectors/merge-status-selector';

export class ToolBar extends React.Component {

  static propTypes = {
    resetWorkspace: PropTypes.func.isRequired,
    openSearchDialog: PropTypes.func.isRequired,
  };

  componentDidMount() {
    window.$(this.mergeType).on('change', (event) => this.handleSearchIndexChange(event)).material_select();
  }

  startNewPair(event) {
    event.preventDefault();
    this.props.resetWorkspace();
  }

  openSearchDialog(event) {
    event.preventDefault();
    this.props.openSearchDialog();
  }

  renderNewPairButton() {
    return (
      <div className="group">
        <ul id="nav">
          <li>
            <a
              href="#"
              onClick={(e) => this.startNewPair(e)}>
              <i
                className="material-icons tooltip"
                title="Aloita uusi">add
              </i>
            </a>
          </li>
        </ul>
        <span className="group-label">Uusi</span>
      </div>
    );
  }

  renderSearchRecordButton() {
    return (
      <div className="group">
        <ul id="nav">
          <li>
            <a
              href="#"
              onClick={(e) => this.openSearchDialog(e)}>
              <i
                className="material-icons tooltip"
                title="Hae tietuetta">search
              </i>
            </a>
          </li>
        </ul>
        <span className="group-label">Hae</span>
      </div>
    );
  }

  renderHelpButton() {
    return (
      <div className="group">
        <ul id="nav">
          <li>
            <a
              href="https://www.kiwi.fi/x/iBcvBQ"
              target="_blank"
              rel="noopener noreferrer">
              <i
                className="material-icons tooltip"
                title="Käyttöohje">help
              </i>
            </a>
          </li>
        </ul>
        <span className="group-label">Ohje</span>
      </div>
    );
  }

  renderMergeProfile(){
    return (
      <div className="col s3 input-field">
        <select ref={(ref) => this.mergeType = ref}>
          <option value="default">Painetusta digitaaliseen</option>
          <option value="type.digital">Digitaalisesta painettuun</option>
        </select>
        <label>Muunnostyyppi</label>
      </div>
    );
  }

  renderMergeType(){
    const selectedMergeProfile = mergeProfiles.find(({key}) => key === this.props.selectedMergeProfile);
    return (
      <div className="col s4 offset-l profile-selector input-field">
        {mergeProfiles.length > 1 && (
          <div className="input-field">
            <select
              defaultValue={selectedMergeProfile.key}
              ref={(ref) => this.mergeProfileSelect = ref}>
              {mergeProfiles.map(({key, name}) => (
                <option key={key} value={key}>{name}</option>
              ))}
            </select>
            <label>Muunnosprofiili</label>
          </div>
        )}
        {selectedMergeProfile.description && (
          <a
            href="#"
            data-activates="profile-selector-info"
            onClick={(e) => this.displayProfileInfo(e)}>
            <i
              className="material-icons"
              title="Kuvaus">info
            </i>
          </a>
        )}
        {selectedMergeProfile.description && this.state.displayProfileInfo && (
          <div
            id="profile-selector-info"
            className="card"
            ref={(ref) => this.profileInfoDialog = ref}>
            <div className="card-content">{selectedMergeProfile.description}</div>
          </div>
        )}
      </div>
    );
  }

  render() {
    return (
      <nav className="toolbar">
        <div className="nav-wrapper row">
          {this.renderNewPairButton()}
          {this.renderSearchRecordButton()}
          {this.renderHelpButton()}
          {this.renderMergeProfile()}
          {this.renderMergeType()};
        </div>
      </nav>
    );
  }
}

function mapStateToProps(state) {
  return {
    selectedMergeProfile: state.getIn(['config', 'selectedMergeProfile'])
  };
}
export const ToolBarContainer = connect(() => ({}),
  uiActionCreators,
  mapStateToProps
)(ToolBar);
