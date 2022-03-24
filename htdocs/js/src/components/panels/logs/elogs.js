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
import {EventsUtils} from '../../../utils/events.js';

export class ELogs extends evQueueComponent {
	constructor(props) {
		super(props);
		
		this.state.logs = [];
		this.state.filter = {};
		
		this.updateFilters = this.updateFilters.bind(this);
	}
	
	componentDidMount() {
		let api = {node:'*', group:'elogs',action:'list'};
		this.Subscribe('LOG_ELOG',api,true);
	}
	
	updateFilters(filters) {
		this.setState({filters: filters});
		
		this.Unsubscribe('LOG_ELOG');
		
		let api = {
			node: '*',
			group: 'elogs',
			action: 'list',
			attributes: filters
		};
		
		this.Subscribe('LOG_ELOG',api, true);
	}
	
	setFilter(name, value) {
		let e = EventsUtils.createEvent(name,value);
		this.props.filters.current.filterChange(e);
	}
	
	evQueueEvent(response) {
		var data = this.parseResponse(response,'/response/*');
		this.setState({logs: data.response});
	}
	
	renderCustomFields(custom_fields) {
		return Object.keys(custom_fields).map(name => {
			return (<li key={name}><span className="label">{name}</span> {custom_fields[name]}</li>);
		});
	}
	
	renderCustomFieldsRow(custom_fields_str) {
		if(!custom_fields_str)
			return;
		
		let custom_fields = JSON.parse(custom_fields_str);
		
		return (
			<tr>
				<td colSpan="8">
					<ul>
						{this.renderCustomFields(custom_fields)}
					</ul>
				</td>
			</tr>
		);
	}
	
	renderLogs() {
		return this.state.logs.map( (log, idx) => {
			return (
				<React.Fragment key={idx}>
					<tr>
						<td className="left">{log.channel}</td>
						<td className="center">{log.date}</td>
						<td className="center" className={"center bold "+log.crit}>{log.crit}</td>
						<td className="center"><span className="action" onClick={(e) => this.setFilter('filter_machine', log.machine)}>{log.machine}</span></td>
						<td className="center"><span className="action" onClick={(e) => this.setFilter('filter_domain', log.domain)}>{log.domain}</span></td>
						<td className="center"><span className="action" onClick={(e) => this.setFilter('filter_ip', log.ip)}>{log.ip}</span></td>
						<td className="center"><span className="action" onClick={(e) => this.setFilter('filter_uid', log.uid)}>{log.uid}</span></td>
						<td className="center">{log.status}</td>
					</tr>
					{this.renderCustomFieldsRow(log.custom_fields)}
				</React.Fragment>
			);
		});
	}
	
	render() {
		var actions = [
			{icon:'fa-refresh '+(this.state.refresh?' fa-spin':''), callback:this.toggleAutorefresh}
		];
		
		return (
			<div className="evq-logs-elogs">
				<Panel noborder left="" title="Last external logs" actions={actions}>
					<table className="evenodd4">
						<thead>
							<tr>
								<th style={{width: '10rem'}}>Channel</th>
								<th style={{width: '10rem'}}>Date</th>
								<th style={{width: '10rem'}}>Crit</th>
								<th>Machine</th>
								<th>Domain</th>
								<th>IP</th>
								<th>UID</th>
								<th style={{width: '3rem'}}>Status</th>
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
