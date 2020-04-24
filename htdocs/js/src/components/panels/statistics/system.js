 /*
  * This file is part of evQueue
  *
  * evQueue is free software: you can redistribute it and/or modify
  * it under the terms of the GNU General Public License as published by
  * the Free Software Foundation, either version 3 of the License, or
  * (at your option) any later version.
  *
  * evQueue is distributed in the hope that it will be useful,
  * but WITHOUT ANY WARRANTY; without even the implied warranty of
  * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
  * GNU General Public License for more details.
  *
  * You should have received a copy of the GNU General Public License
  * along with evQueue. If not, see <http://www.gnu.org/licenses/>.
  *
  * Author: Thibault Kummer
  */

'use strict';

import {evQueueComponent} from '../../base/evqueue-component.js';
import {Panel} from '../../../ui/panel.js';

export class SystemStatistics extends evQueueComponent {
	constructor(props) {
		super(props);
		
		this.state.stats = {};
		
		this.timerID = false;
		
		this.updateStatistics = this.updateStatistics.bind(this);
	}
	
	componentDidMount() {
		this.updateStatistics();
		this.timerID = setInterval(this.updateStatistics,1000);
	}
	
	componentWillUnmount() {
		super.componentWillUnmount();
		
		clearInterval(this.timerID);
	}
	
	updateStatistics() {
		this.API({
			node:'*',
			group:'statistics',
			action:'query',
			attributes:{type: 'global'}
		}).then( (responses) => {
			let stats = {};
			for(let i=0;i<responses.length;i++)
			{
				let data = this.parseResponse(responses[i]);
				stats[data.node] = data.response[0];
			}
			
			this.setState({stats: stats});
		});
	}
	
	renderNodesHeader() {
		return this.state.cluster.nodes_names.map( (name, idx) => {
			return (<th key={idx}>{name}</th>);
		});
	}
	
	renderStatistics(type) {
		return this.state.cluster.nodes_names.map( (name) => {
			if(this.state.stats[name]===undefined)
				return;
			return (<td key={name+'_'+type}>{this.state.stats[name][type]}</td>);
		});
	}
	
	render() {
		let ncols = this.state.cluster.nodes_names.length+2;
		
		
		return (
			<Panel noborder left="" title="System statistics">
				<div className="evq-system-statistics">
					<table>
						<thead>
							<tr>
								<th></th>
								{this.renderNodesHeader()}
								<th></th>
							</tr>
						</thead>
						<tbody>
							<tr className="category"><td colSpan={ncols}>Network</td></tr>
							<tr>
								<td>Accepted API connections</td>
								{ this.renderStatistics('accepted_api_connections') }
							</tr>
							<tr>
								<td>Active API connections</td>
								{ this.renderStatistics('current_api_connections') }
							</tr>
							<tr>
								<td>Accepted Websockets connections</td>
								{ this.renderStatistics('accepted_ws_connections') }
							</tr>
							<tr>
								<td>Active Websockets connections</td>
								{ this.renderStatistics('current_ws_connections') }
							</tr>
							
							<tr className="spacer"><td colSpan={ncols} /></tr>
							<tr className="category"><td colSpan={ncols}>API</td></tr>
							<tr>
								<td>Queries received (TCP)</td>
								{ this.renderStatistics('api_queries') }
							</tr>
							<tr>
								<td>Queries received (Websockets)</td>
								{ this.renderStatistics('ws_queries') }
							</tr>
							<tr>
								<td>Exceptions</td>
								{ this.renderStatistics('api_exceptions') }
							</tr>
							
							<tr className="spacer"><td colSpan={ncols} /></tr>
							<tr className="category"><td colSpan={ncols}>Events</td></tr>
							<tr>
								<td>Events emitted</td>
								{ this.renderStatistics('ws_events') }
							</tr>
							<tr>
								<td>Events subscribed</td>
								{ this.renderStatistics('ws_subscriptions') }
							</tr>
							
							<tr className="spacer"><td colSpan={ncols} /></tr>
							<tr className="category"><td colSpan={ncols}>Workflow instances</td></tr>
							<tr>
								<td>Instances launched</td>
								{ this.renderStatistics('workflow_instance_launched') }
							</tr>
							<tr>
								<td>Instances executing</td>
								{ this.renderStatistics('workflow_instance_executing') }
							</tr>
							<tr>
								<td>Instances failed</td>
								{ this.renderStatistics('workflow_instance_errors') }
							</tr>
							<tr>
								<td>Waiting threads</td>
								{ this.renderStatistics('waiting_threads') }
							</tr>
						</tbody>
					</table>
				</div>
			</Panel>
		);
	}
}
