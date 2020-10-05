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
import {isEmpty} from 'lodash';
import classNames from 'classnames';
import {CommitMergeStates} from '../constants';
import '../../styles/components/merge-dialog.scss';

export class MergeDialog extends React.Component {
  static propTypes = {
    closable: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    status: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    response: PropTypes.object,
    mergeStatus: PropTypes.string,
    statusInfo: PropTypes.string
  };

  close(event) {
    event.preventDefault();
    if (this.props.closable) {
      this.props.onClose();
    }
  }

  title() {
    switch (this.props.status) {
      case CommitMergeStates.COMMIT_MERGE_ONGOING: return 'Tietueita tallennetaan';
      case CommitMergeStates.COMMIT_MERGE_ERROR: return 'Virhe tietueiden tallentamisessa';
      case CommitMergeStates.COMMIT_MERGE_COMPLETE: return 'Tietueet tallennettu';
    }
    return '';
  }

  renderResponseMessages(response) {

    if (isEmpty(response)) {
      return <div className="response-container"><div className="red lighten-5">Tuntematon virhe</div></div>;
    }

    if (response.name === 'RollbackError') {
      return <div className="response-container"><div className="red lighten-5">{response.message}</div></div>;
    }

    const triggers = response.triggers === undefined ? [] : response.triggers.filter(usefulMessage).map(this.renderSingleMessage);
    const warnings = response.warnings === undefined ? [] : response.warnings.filter(usefulMessage).map(this.renderSingleMessage);
    const errors = response.errors === undefined ? [] : response.errors.map(this.renderSingleMessage);
    const messages = response.messages === undefined ? [] : response.messages.map(this.renderSingleMessage);
    const fi = this.props.mergeStatus === 'COMMIT_MERGE_ERROR' ? 'Tietueiden tallentamisessa tapahtui virhe' : this.props.message;

    return (
      <div className="response-container">
        {fi ? <div className="green lighten-4">{fi}</div> : null}
        {messages.length ? <div className="green lighten-4">{messages}</div> : null}
        {errors.length ? <div className="red lighten-5">{errors}</div> : null}
        {warnings.length ? <div className="lime lighten-4">{warnings}</div> : null}
        {triggers.length ? <div className="light-blue lighten-5">{triggers}</div> : null}
      </div>
    );

    function usefulMessage(message) {
      return message.code !== '0121' && message.code !== '0101';
    }
  }

  renderSingleMessage(item, i) {
    return (
      <div key={`${item.message}-${i}`} className="message-container"><span className="code">{item.code}</span><span className="message">{item.message}</span></div>
    );
  }

  renderContent() {

    if (this.props.response) {
      return this.renderResponseMessages(this.props.response);
    } else if (this.props.status === CommitMergeStates.COMMIT_MERGE_ONGOING) {
      return <div>{this.renderPreloader()}</div>;
    } else {
      return <p>{this.props.message}</p>;
    }
  }

  renderPreloader() {
    return (
      <div className="progress">
        <div className="indeterminate" />
      </div>
    );
  }

  render() {
    const buttonClasses = classNames({
      disabled: !this.props.closable
    }, 'baseline');

    return (
      <div className="row modal-merge-dialog">
        <div className="col offset-s4 s4">
          <div className="card">
            <div className="card-content">
              <p className="card-title center-align">{this.title()}</p>
              {this.renderContent()}
            </div>
            <div className="card-action right-align">
              <a className={buttonClasses} href="#" onClick={(e) => this.close(e)}>
                <i className="material-icons">close</i>
                Sulje
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
