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
import {Dialogs} from '../../../ui/dialogs.js';
import {EditAlert} from '../../dialogs/logs/edit-alert.js';

export class Alerts extends evQueueComponent {
	constructor(props) {
		super(props);
		
		this.state.alerts = [];
		
		this.editAlert = this.editAlert.bind(this);
	}
	
	componentDidMount() {
		/*this.API({
			group: 'channel_group',
			action: 'get',
			attributes: {id: this.props.group}
		}).then( (response) => {
			let data = this.parseResponse(response);
			this.setState({group_fields: data.response});
		});
		
		let api = {node:'*', group:'elogs',action:'list',attributes: {group_id: this.props.group}};
		this.Subscribe('LOG_ELOG',api,true);*/
	}
	
	editAlert(e, id) {
		Dialogs.open(EditAlert, {id: id});
	}
	
	renderAlerts() {
		return this.state.alerts.map(alert => {
			return (
				<tr key={alert.id}>
					<td></td>
					<td></td>
				</tr>
			);
		});
	}
	
	render() {
		var actions = [
			{icon:'fa-file-o', title: "Create new channel", callback:this.editAlert}
		];
		
		return (
			<div className="evq-logs-alerts">
				<Panel noborder left="" title="External logs alerts" actions={actions}>
					<table className="evenodd">
						<thead>
							<tr>
								<th style={{width: '10rem'}}>Name</th>
								<th style={{width: '10rem'}}>Actions</th>
							</tr>
						</thead>
						<tbody>
							{ this.renderAlerts() }
						</tbody>
					</table>
				</Panel>
			</div>
		);
	}
}
