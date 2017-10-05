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
import '../../styles/components/toolbar.scss';
import {connect} from 'react-redux';
import * as uiActionCreators from '../ui-actions';
import * as duplicateDatabaseActionCreators from '../action-creators/duplicate-database-actions';
import _ from 'lodash';

export class ToolBar extends React.Component {

  static propTypes = {
    resetWorkspace: React.PropTypes.func.isRequired,
  }

  startNewPair(event) {
    event.preventDefault();
    this.props.resetWorkspace();
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

  render() {
    return (
      <nav className="toolbar">
        <div className="nav-wrapper">
          {this.renderNewPairButton()}
        </div>
      </nav>
    );
  }
}

export const ToolBarContainer = connect(
  () => ({}),
  _.assign({}, duplicateDatabaseActionCreators, uiActionCreators)
)(ToolBar);
