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
import {App} from '../../base/app.js';
import {Panel} from '../../../ui/panel.js';

export class AlertTriggers extends evQueueComponent {
	constructor(props) {
		super(props);
		
		this.state.triggers = [];
}
	
	componentDidMount() {
		let api = {node:'*', group:'alert_triggers',action:'list'};
		
		this.Subscribe('ALERT_TRIGGER',api,true);
	}
	
	evQueueEvent(data) {
		this.setState({triggers: this.parseResponse(data).response});
	}
	
	removeTrigger(e, id) {
		this.simpleAPI({
			group: 'alert_triggers',
			action: 'delete',
			attributes: {id: id}
		},"Alert trigger removed", "Are you sure you want to remove this trigger notification ?");
	}
	
	renderTriggers() {
		return this.state.triggers.map(trigger => {
			let filters = JSON.parse(trigger.filters);
			
			filters.dt_inf = trigger.start.substr(0, 10);
			filters.hr_inf = trigger.start.substr(10);
			filters.filter_emitted_from = trigger.start;
			filters.dt_sup = trigger.date.substr(0, 10);
			filters.hr_sup = trigger.date.substr(10);
			filters.filter_emitted_until = trigger.date;
			
			return (
				<tr key={trigger.id}>
					<td>{trigger.alert_name}</td>
					<td>{trigger.date}</td>
					<td className="tdActions">
						<span className="faicon fa-eye" title="View logs" onClick={ (e) => App.changeURL('?loc=elogs-search', filters) } />
					</td>
					<td className="tdActions">
						<span className="faicon fa-remove" title="Remove trigger" onClick={ (e) => this.removeTrigger(e, trigger.id) } />
					</td>
				</tr>
			);
		});
	}
	
	render() {
		return (
			<div className="evq-logs-alerts">
				<Panel noborder left="" title="Alerts triggered">
					<table className="evenodd" className="border">
						<thead>
							<tr>
								<th style={{width: '10rem'}}>Name</th>
								<th className="left">Date</th>
								<th>Status</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{ this.renderTriggers() }
						</tbody>
					</table>
				</Panel>
			</div>
		);
	}
}
