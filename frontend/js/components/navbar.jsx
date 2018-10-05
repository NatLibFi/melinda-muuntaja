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
import { commitMerge} from '../ui-actions';
import {connect} from 'react-redux';
import { mergeButtonEnabled } from '../selectors/merge-status-selector';
import '../../styles/components/navbar.scss';
import { removeSession } from 'commons/action-creators/session-actions';
import melindaLogo from '../../images/melinda-logo.png';

export class NavBar extends React.Component {
  
  static propTypes = {
    commitMerge: PropTypes.func.isRequired,
    mergeStatus: PropTypes.string,
    statusInfo: PropTypes.string,
    mergeButtonEnabled: PropTypes.bool.isRequired,
    removeSession: PropTypes.func.isRequired,
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
      gutter: 0,
      belowOrigin: true,
      alignment: 'right'
    });

  }

  disableIfMergeNotPossible() {
    return this.props.mergeButtonEnabled ? '' : 'disabled';
  }

  statusInfo() {
    return this.props.mergeStatus === 'COMMIT_MERGE_ERROR' ? 'Tietueiden tallentamisessa tapahtui virhe' : this.props.statusInfo;
  }

  endSession() {
    this.props.removeSession();
  }
  
  clearLocalStorage() {
    window.localStorage.clear();
  }

  render() {
    return (
      <div className="navbar-fixed">
        <nav> 
          <div className="nav-wrapper">
            <div className="row">
              <div className="col s1">
                <ul>
                  <li>
                    <a className="brand-logo">
                      <img 
                        className="mt-logo" 
                        src={melindaLogo}
                      />
                    </a>
                  </li>
                </ul>
              </div>
              <div className="col s2">
                <ul className="left">
                  <li className="heading">Muuntaja</li>
                </ul>
              </div>
              <div className="col s9">
                <ul id="nav" className="right">
                  <li>
                    <div className="status-info">{this.props.statusInfo}</div>
                  </li>
                  <li>
                    <button
                      className="waves-effect waves-light btn"
                      disabled={this.disableIfMergeNotPossible()}
                      onClick={this.props.commitMerge}
                      name="commit_merge">Tallenna muunnos</button>
                  </li>
                  <li>
                    <a
                      className="dropdown-navbar dropdown-button-menu"
                      href="#" data-activates="mainmenu">
                      <i className="material-icons">more_vert</i>
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </nav>
        <ul
          id='mainmenu'
          className='dropdown-content'>
          <li className="divider" />
          <li>
            <a
              href="#"
              onClick={() => {this.endSession(); this.clearLocalStorage();}}>Kirjaudu ulos
            </a>
          </li>
        </ul>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    mergeButtonEnabled: mergeButtonEnabled(state),
    mergeStatus: state.getIn(['mergeStatus', 'status']),
    statusInfo: state.getIn(['mergeStatus', 'message'])
  };
}

export const NavBarContainer = connect(
  mapStateToProps,
  { removeSession, commitMerge }
)(NavBar);
