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
import {commitMerge} from '../ui-actions';
import {connect} from 'react-redux';
import {mergeButtonEnabled} from '../selectors/merge-status-selector';
import '../../styles/components/navbar.scss';
import {removeSession} from 'commons/action-creators/session-actions';
import melindaLogo from '../../images/Melinda-logo-white.png';
import * as uiActionCreators from '../ui-actions';
import classNames from 'classnames';

export class NavBar extends React.Component {

  static propTypes = {
    commitMerge: PropTypes.func.isRequired,
    mergeStatus: PropTypes.string,
    mergeButtonEnabled: PropTypes.bool.isRequired,
    removeSession: PropTypes.func.isRequired,
    resetWorkspace: PropTypes.func.isRequired,
    config: PropTypes.object,
    appTitle: PropTypes.string.isRequired,
    openSearchDialog: PropTypes.func.isRequired,
    username: PropTypes.string,
    mergeProfiles: PropTypes.array,
    selectedMergeType: PropTypes.string.isRequired,
    selectedMergeProfile: PropTypes.string.isRequired,
    switchMergeType: PropTypes.func.isRequired,
    switchMergeConfig: PropTypes.func.isRequired
  };

  constructor() {
    super();
    this.endSession = this.endSession.bind(this);
  }

  componentDidMount() {
    window.$('.dropdown-navbar').dropdown({
      inDuration: 300,
      outDuration: 225,
      constrain_width: false,
      hover: false,
      gutter: 10,
      belowOrigin: true,
      alignment: 'right'
    });
    window.$('.dropdown-settings').dropdown({
      inDuration: 300,
      outDuration: 225,
      constrain_width: false,
      hover: false,
      gutter: 0,
      belowOrigin: true,
      alignment: 'right'
    });
  }

  disableIfMergeNotPossible() {
    return this.props.mergeButtonEnabled ? '' : 'disabled';
  }

  endSession() {
    this.props.removeSession();
  }

  clearLocalStorage() {
    window.localStorage.clear();
  }

  startNewPair(event) {
    event.preventDefault();
    this.props.resetWorkspace();
  }

  openSearchDialog(event) {
    event.preventDefault();
    this.props.openSearchDialog();
  }

  changeMergeType = (event, value) => {
    event.preventDefault();
    if (this.props.selectedMergeType !== value) this.props.switchMergeType(value);
  }

  selectProfile(event, value) {
    event.preventDefault();
    if (this.props.selectedMergeProfile !== value) this.props.switchMergeConfig(value);
  }

  render() {
    const {username, appTitle} = this.props;
    const {mergeProfiles, selectedMergeType} = this.props;
    const profile = mergeProfiles.find(({key}) => key === this.props.selectedMergeProfile);
    const selectedMergeProfile = profile === undefined ? mergeProfiles[0] : profile;
    const filteredProfiles = mergeProfiles.filter(profile => profile.mergeType === selectedMergeType);

    const saveButtonClasses = classNames({'disabled': !this.props.mergeButtonEnabled}, 'tooltip');

    return (
      <div className="navbar-fixed">
        <nav>
          <div className="nav-wrapper">
            <img
              className="mt-logo left"
              src={melindaLogo}
            />
            <ul id="nav" className="heading-wrapper left">
              <li className="heading">{appTitle}</li>
            </ul>
            <ul id="nav" className="right">
              <li className="tooltip" title="Käyttöohje">
                <a href="https://www.kiwi.fi/x/iBcvBQ" target="_blank" rel="noopener noreferrer">
                  <i className="material-icons">help_outline</i>
                </a>
              </li>
              <li className="tooltip" title="Uusi">
                <a href="#" onClick={(e) => this.startNewPair(e)}>
                  <i className="material-icons">add</i>
                </a>
              </li>
              <li className="tooltip" title="Etsi">
                <a href="#" onClick={(e) => this.openSearchDialog(e)}>
                  <i className="material-icons">search</i>
                </a>
              </li>
              <li className={saveButtonClasses} title="Tallenna">
                <a href="#" onClick={this.props.commitMerge}>
                  <i className="material-icons">save</i>
                </a>
              </li>
              <li>
                <a className='dropdown-settings dropdown-button-menu'
                  href="#" data-activates="settings">
                  <i className="material-icons">settings</i>
                </a>
              </li>
              <li className="tooltip" title="Käyttäjä">
                <a
                  className="dropdown-navbar dropdown-button-menu"
                  href="#" data-activates="mainmenu">
                  <i className="material-icons">account_circle</i>
                </a>
              </li>
            </ul>
          </div>
        </nav>
        <ul
          id='mainmenu'
          className='dropdown-content'>
          <li className="user-name-menu-item">{username ? username : ''}</li>
          <li className="divider" />
          <li>
            <a
              href="#"
              onClick={() => {this.endSession(); this.clearLocalStorage();}}>Kirjaudu ulos
            </a>
          </li>
        </ul>
        <ul
          id='settings'
          className='dropdown-content settings'>
          <li className="menu-title-item">
            <span>Muunnostyyppi</span>
          </li>
          <li>
            <a href="#!" onClick={(e) => this.changeMergeType(e, 'printToE')}>
              {this.props.selectedMergeType === 'printToE' ? <i className="material-icons">check_box</i> : <i className="material-icons">check_box_outline_blank</i>}
              Painetusta &gt; E-aineistoksi
            </a>
          </li>
          <li>
            <a href="#!" onClick={(e) => this.changeMergeType(e, 'eToPrint')}>
              {this.props.selectedMergeType === 'eToPrint' ? <i className="material-icons">check_box</i> : <i className="material-icons">check_box_outline_blank</i>}
              E-aineistosta &gt; Painetuksi
            </a>
          </li>
          <li className="divider" />
          <li className="menu-title-item">
            <span>Muunnosprofiili</span>
          </li>
          {filteredProfiles.map(({key, name}, index) => (
            <li key={index}>
              {selectedMergeProfile.key === key ?
                <a href="#" disabled>
                  <i className="material-icons">check_box</i>
                  {name}
                </a>
                :
                <a href="#" onClick={(e) => this.selectProfile(e, key)}>
                  <i className="material-icons">check_box_outline_blank</i>
                  {name}
                </a>
              }
            </li>
          ))}
        </ul>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    mergeButtonEnabled: mergeButtonEnabled(state),
    mergeStatus: state.getIn(['mergeStatus', 'status']),
    config: state.getIn(['config']).toJS(),
    selectedMergeProfile: state.getIn(['config', 'selectedMergeProfile']),
    mergeProfiles: state.getIn(['config', 'mergeProfiles']).map((value, key) => ({
      key, name: value.get('name'),
      description: value.get('description'),
      mergeType: value.get('mergeType')
    })
    ).toList().toJS(),
    selectedMergeType: state.getIn(['config', 'mergeType'])
  };
}

export const NavBarContainer = connect(
  mapStateToProps,
  {removeSession, commitMerge, ...uiActionCreators}
)(NavBar);
