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

export class ToolBar extends React.Component {

  static propTypes = {
    resetWorkspace: PropTypes.func.isRequired,
    openSearchDialog: PropTypes.func.isRequired,
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
          <li><a href="#" onClick={(e) => this.startNewPair(e)}><i className="material-icons tooltip" title="Aloita uusi">add</i></a></li>
        </ul>
        <span className="group-label">Uusi</span>
      </div>
    );
  }

  renderSearchRecordButton() {
    return (
      <div className="group">
        <ul id="nav">
          <li><a href="#" onClick={(e) => this.openSearchDialog(e)}><i className="material-icons tooltip" title="Hae tietuetta">search</i></a></li>
        </ul>
        <span className="group-label">Hae</span>
      </div>
    );
  }

  renderHelpButton() {
    return (
      <div className="group">
        <ul id="nav">
          <li><a href="https://www.kiwi.fi/x/iBcvBQ" target="_blank" rel="noopener noreferrer"><i className="material-icons tooltip" title="Käyttöohje">help</i></a></li>
        </ul>
        <span className="group-label">Ohje</span>
      </div>
    );
  }

  render() {
    return (
      <nav className="toolbar">
        <div className="nav-wrapper">
          {this.renderNewPairButton()}

          <ul><li className="separator"><span /></li></ul>

          {this.renderSearchRecordButton()}

          <ul><li className="separator"><span /></li></ul>

          {this.renderHelpButton()}

        </div>
      </nav>
    );
  }
}

export const ToolBarContainer = connect(
  () => ({}),
  uiActionCreators
)(ToolBar);
