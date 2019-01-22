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
import '../../styles/components/record-selection-controls';
import * as uiActionCreators from '../ui-actions';
import {connect} from 'react-redux';
import _ from 'lodash';
import { withRouter } from 'react-router';
import { hostRecordActionsEnabled } from '../selectors/merge-status-selector';
import classNames from 'classnames';

const RECORD_LOADING_DELAY = 500;
export class RecordSelectionControls extends React.Component {

  static propTypes = {
    selectedMergeProfile: PropTypes.string.isRequired,
    sourceRecordId: PropTypes.string.isRequired,
    targetRecordId: PropTypes.string.isRequired,
    switchMergeConfig: PropTypes.func.isRequired,
    resetSourceRecord: PropTypes.func.isRequired,
    resetTargetRecord: PropTypes.func.isRequired,
    fetchRecord: PropTypes.func.isRequired,
    swapRecords: PropTypes.func.isRequired,
    setSourceRecordId: PropTypes.func.isRequired,
    setTargetRecordId: PropTypes.func.isRequired,
    locationDidChange: PropTypes.func.isRequired,
    controlsEnabled: PropTypes.bool.isRequired,
    mergeProfiles: PropTypes.array,
    history: PropTypes.object.isRequired
  };

  constructor() {
    super();

    this.handleTargetChangeDebounced = _.debounce((event) => {
      if (event.target.value.length > 0) this.props.fetchRecord(event.target.value, 'TARGET');
    }, RECORD_LOADING_DELAY);

    this.handleSourceChangeDebounced = _.debounce((event) => {
      if (event.target.value.length > 0) this.props.fetchRecord(event.target.value, 'SOURCE');
    }, RECORD_LOADING_DELAY);

    this.handleChange = this.handleChange.bind(this);
    this.fetchData = this.fetchData.bind(this);
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

  fetchData(event, target) {
    event.persist();
    const {sourceRecordId} = this.props;
    if (sourceRecordId) {
      this.props.fetchRecord(sourceRecordId, target);
    }
  }

  render() {
    const { controlsEnabled, sourceRecordId } = this.props;
    const swapButtonClasses = classNames('btn-floating', 'mt-btn', {
      'waves-effect': controlsEnabled,
      'waves-light': controlsEnabled,
      'disabled': !controlsEnabled
    });
    return (
      <div>
        <div className="row mt-card-1">
          <div className="col s12">
            <div className="card mt-card-padding">
              <div className="row row-margin-swap record-selection-controls">
                <div
                  className="col s5">
                  <div className="input-field col s12">
                    <i className="material-icons prefix">arrow_forward</i>
                    <input
                      id="source_record"
                      type="tel"
                      value={sourceRecordId}
                      onChange={this.handleChange}
                    />
                    <label htmlFor="source_record">Lähdetietue</label>
                  </div>
                  {/* <div className="input-field col s2 mt-submit-btn-1">
                    <button
                      type="submit"
                      onClick={(event) => this.fetchData(event, 'SOURCE')}
                      className="btn"
                    >Hae</button>
                  </div> */}
                </div>
                <div className="col s2 control-swap-horizontal input-field">
                  <div>
                    <a
                      className={swapButtonClasses}
                      onClick={(e) => this.handleSwap(e)}>
                      <i
                        className="material-icons tooltip small"
                        title="Vaihda keskenään">swap_horiz
                      </i>
                    </a>
                  </div>
                </div>
                <div
                  className="col s5 input-field">
                  <div className="col s12">
                    <i className="material-icons prefix">storage</i>
                    <input
                      id="target_record"
                      type="tel"
                      value={this.props.targetRecordId}
                      onChange={this.handleChange}
                      disabled={!controlsEnabled}/>
                    <label htmlFor="target_record">Pohjatietue</label>
                  </div>
                  {/* <div className="input-field col s2 mt-submit-btn-2">
                    <button 
                      className="btn"
                      onClick={(event) => this.fetchData(event, 'TARGET')}
                    >Hae</button>
                  </div> */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    sourceRecordId: state.getIn(['sourceRecord', 'id']) || '',
    targetRecordId: state.getIn(['targetRecord', 'id']) || '',
    selectedMergeProfile: state.getIn(['config', 'selectedMergeProfile']),
    controlsEnabled: hostRecordActionsEnabled(state)
  };
}

export const RecordSelectionControlsContainer = withRouter(connect(
  mapStateToProps,
  uiActionCreators
)(RecordSelectionControls));
