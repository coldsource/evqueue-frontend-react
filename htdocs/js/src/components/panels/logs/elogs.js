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
import {ELogsFilters} from '../../panels/logs/elogs-filters.js';

export class ELogs extends evQueueComponent {
	constructor(props) {
		super(props);
		
		this.state.logs = [];
		this.state.filters = {};
		this.state.group_fields = {};
		this.state.channel_fields = {};
		this.state.details = {};
		
		this.filters = React.createRef();
		
		this.updateFilters = this.updateFilters.bind(this);
		this.toggleDetails = this.toggleDetails.bind(this);
		this.evQueueEvent = this.evQueueEvent.bind(this);
	}
	
	componentDidMount() {
		this.updateFilters({}, {}, {});
	}
	
	evQueueEvent(response) {
		let data = this.parseResponse(response,'/response/*');
		this.setState({logs: data.response});
	}
	
	updateFilters(filters = {}, group_fields = {}, channel_fields = {}) {
		this.setState({filters: filters, group_fields: group_fields, channel_fields: channel_fields});
		
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
		this.filters.current.filterChange(e);
	}
	
	toggleDetails(id) {
		let details = this.state.details;
		
		if(details[id]!==undefined)
		{
			delete details[id];
			this.setState({details: details});
			return;
		}
		
		this.API({
			group: 'elog',
			action: 'get',
			attributes: {id: id}
		}).then( (response) => {
			details[id] = {};
			details[id].group = this.parseResponse(response, "/response/group").response[0];
			details[id].channel = this.parseResponse(response, "/response/channel").response[0];
			this.setState({details: details});
		});
	}
	
	renderGroupFieldsHeader() {
		return Object.keys(this.state.group_fields).map(field => {
			return (
				<th key={'group_'+field}>{field}</th>
			);
		});
	}
	
	renderChannelFieldsHeader() {
		return Object.keys(this.state.channel_fields).map(field => {
			return (
				<th key={'channel_'+field}>{field}</th>
			);
		});
	}
	
	renderGroupFields(log) {
		return Object.keys(this.state.group_fields).map(field => {
			if(this.state.group_fields[field]!='TEXT')
				return (<td key={'group_'+field} className="center"><span className="action" onClick={(e) => this.setFilter('filter_group_'+field, log[field])}>{log[field]}</span></td>);
			else
				return (<td key={'group_'+field} className="center"><span>{log[field]}</span></td>);
		});
	}
	
	renderChannelFields(log) {
		return Object.keys(this.state.channel_fields).map(field => {
			if(this.state.channel_fields[field]!='TEXT')
				return (<td key={'channel_'+field} className="center"><span className="action" onClick={(e) => this.setFilter('filter_channel_'+field, log['channel_'+field])}>{log['channel_'+field]}</span></td>);
			else
				return (<td key={'channel_'+field} className="center"><span>{log['channel_'+field]}</span></td>);
		});
	}
	
	renderChannelLogs(log) {
		let ncols = 3 + Object.keys(this.state.group_fields).length + Object.keys(this.state.channel_fields).length;
		
		if(this.state.details[log.id]===undefined)
			return (<tr><td colSpan={ncols}></td></tr>);
		
		return (
			<tr>
				<td colSpan={ncols}>
					<ul>
						{this.renderChannelLogsValues('group', this.state.details[log.id].group)}
						{this.renderChannelLogsValues('channel', this.state.details[log.id].channel)}
					</ul>
				</td>
			</tr>
		);
	}
	
	renderChannelLogsValues(type, values) {
		return Object.keys(values).map(name => {
			if(name=="domnode")
				return;
			return (
				<li key={type+'_'+name}><b>{name} :</b> {values[name]}</li>
			);
		});
	}
	
	renderLogs() {
		return this.state.logs.map( (log, idx) => {
			return (
				<React.Fragment key={idx}>
					<tr>
						<td className="left"><span className={this.state.details[log.id]===undefined?"faicon fa-plus":"faicon fa-minus"} onClick={e => this.toggleDetails(log.id)}></span> {log.channel}</td>
						<td className="center">{log.date}</td>
						<td className="center" className={"center bold "+log.crit}>{log.crit}</td>
						{this.renderGroupFields(log)}
						{this.renderChannelFields(log)}
					</tr>
					{this.renderChannelLogs(log)}
				</React.Fragment>
			);
		});
	}
	
	renderGrouppedLogs() {
		return this.state.logs.map( (log, idx) => {
			return (
				<React.Fragment key={idx}>
					<tr>
						<td className="left">{log[this.state.filters.groupby]}</td>
						<td className="left">{log.n}</td>
					</tr>
				</React.Fragment>
			);
		});
	}
	
	renderLogsPannel() {
		var actions = [
			{icon:'fa-refresh '+(this.state.refresh?' fa-spin':''), callback:this.toggleAutorefresh}
		];
		
		if(!this.state.filters.groupby)
		{
			return (
				<div className="evq-logs-elogs">
					<Panel noborder left="" title="Last external logs" actions={actions}>
						<table className="evenodd4">
							<thead>
								<tr>
									<th style={{width: '10rem'}}>Channel</th>
									<th style={{width: '10rem'}}>Date</th>
									<th style={{width: '10rem'}}>Crit</th>
									{this.renderGroupFieldsHeader()}
									{this.renderChannelFieldsHeader()}
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
		else
		{
			let group_name = this.state.filters.groupby;
			if(group_name.substr(0,6)=='group_')
				group_name = group_name.substr(6);
			else if(group_name.substr(0,8)=='channel_')
				group_name = group_name.substr(8);
			
			return (
				<div className="evq-logs-elogs">
					<Panel noborder left="" title="Last external logs" actions={actions}>
						<table className="evenodd4">
							<thead>
								<tr>
									<th style={{width: '16rem'}}>{group_name}</th>
									<th className="left">Number</th>
								</tr>
							</thead>
							<tbody>
								{ this.renderGrouppedLogs() }
							</tbody>
						</table>
					</Panel>
				</div>
			);
		}
	}
	
	render() {
		return (
			<div>
					<ELogsFilters ref={this.filters} filters={this.state.filters} onChange={this.updateFilters} />
					<br />
					{this.renderLogsPannel()}
			</div>
		);
	}
}
