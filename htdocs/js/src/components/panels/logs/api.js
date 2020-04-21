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

export class APILogs extends evQueueComponent {
	constructor(props) {
		super(props);
		
		this.state.logs = [];
	}
	
	componentDidMount() {
		var api = {node:'*', group:'logsapi',action:'list'};
		this.Subscribe('LOG_API',api,true);
	}
	
	evQueueEvent(response) {
		var data = this.parseResponse(response,'/response/*');
		this.setState({logs: data.response});
	}
	
	renderLogs() {
		return this.state.logs.map( (log, idx) => {
			return (
				<tr key={idx}>
					<td className="center">{log.timestamp}</td>
					<td className="center">{log.user}</td>
					<td className="center">{log.object_id}</td>
					<td className="center">{log.object_name}</td>
					<td className="center">{log.object_type}</td>
					<td className="center">{log.group}</td>
					<td className="center">{log.action}</td>
					<td className="center">{log.node}</td>
				</tr>
			);
		});
	}
	
	render() {
		var actions = [
			{icon:'fa-refresh '+(this.state.refresh?' fa-spin':''), callback:this.toggleAutorefresh}
		];
		
		return (
			<div className="evq-api-logs">
				<Panel noborder left="" title="Last API logs" actions={actions}>
					<table className="border">
						<thead>
							<tr>
								<th>Timestamp</th>
								<th>User</th>
								<th>Object ID</th>
								<th>Object Name</th>
								<th>Object Type</th>
								<th>API Group</th>
								<th>API Action</th>
								<th>Node</th>
							</tr>
						</thead>
						<tbody>
							{ this.renderLogs() }
						</tbody>
					</table>
				</Panel>
			</div>
		);
	}
}
