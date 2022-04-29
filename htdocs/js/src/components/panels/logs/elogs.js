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
import {Tabs} from '../../../ui/tabs.js';
import {Tab} from '../../../ui/tab.js';

export class ELogs extends evQueueComponent {
	constructor(props) {
		super(props);
		
		this.state.logs = [];
		this.state.filter = {};
		this.state.group_fields = [];
		this.state.channel_fields = [];
		this.state.details = {};
		this.state.group = 0;
		this.state.channelgroups = [];
		
		this.filters = React.createRef();
		
		this.updateFilters = this.updateFilters.bind(this);
		this.toggleDetails = this.toggleDetails.bind(this);
		this.evQueueEventLogs = this.evQueueEventLogs.bind(this);
		this.evQueueEventChannelGroups = this.evQueueEventChannelGroups.bind(this);
	}
	
	componentDidMount() {
		let api = {node:'*', group:'channel_groups',action:'list'};
		this.Subscribe('CHANNELGROUP_CREATED',api, false, 0, this.evQueueEventChannelGroups);
		this.Subscribe('CHANNELGROUP_MODIFIED',api, false, 0, this.evQueueEventChannelGroups);
		this.Subscribe('CHANNELGROUP_REMOVED',api,true, 0, this.evQueueEventChannelGroups);
	}
	
	evQueueEventLogs(response) {
		let data = this.parseResponse(response,'/response/*');
		this.setState({logs: data.response});
	}
	
	evQueueEventChannelGroups(response) {
		let data = this.parseResponse(response);
		this.setState({channelgroups: data.response}, () => this.changeTab(0));
	}
	
	changeTab(idx) {
		if(idx>=this.state.channelgroups.length)
			return;
		
		let group_id = this.state.channelgroups[idx].id;
		
		this.API({
			group: 'channel_group',
			action: 'get',
			attributes: {id: group_id}
		}).then( (response) => {
			let data = this.parseResponse(response);
			this.setState({group: group_id, group_fields: data.response}, () => this.updateFilters() );
		});
	}
	
	updateFilters(filters = {}) {
		this.setState({filters: filters});
		
		this.Unsubscribe('LOG_ELOG');
		
		let attributes = Object.assign({group_id: this.state.group}, filters);
		
		let api = {
			node: '*',
			group: 'elogs',
			action: 'list',
			attributes: attributes
		};
		
		this.Subscribe('LOG_ELOG',api, true, 0, this.evQueueEventLogs);
		
		if(filters.filter_channel!==undefined && filters.filter_channel!=0)
		{
			this.API({
				group: 'channel',
				action: 'get',
				attributes: {id: this.state.group}
			}).then( (response) => {
				let data = this.parseResponse(response);
				this.setState({channel_fields: data.response});
			});
		}
		else
			this.setState({channel_fields: []});
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
			details[id] = this.parseResponse(response, "/response/channel").response[0];
			this.setState({details: details});
		});
	}
	
	renderGroupFieldsHeader() {
		return this.state.group_fields.map(field => {
			return (
				<th key={field.name}>{field.name}</th>
			);
		});
	}
	
	renderChannelFieldsHeader() {
		return this.state.channel_fields.map(field => {
			return (
				<th key={field.name}>{field.name}</th>
			);
		});
	}
	
	renderGroupFields(log) {
		return this.state.group_fields.map(field => {
			if(field.type!='TEXT')
				return (<td key={field.name} className="center"><span className="action" onClick={(e) => this.setFilter('filter_group_'+field.name, log[field.name])}>{log[field.name]}</span></td>);
			else
				return (<td key={field.name} className="center"><span>{log[field.name]}</span></td>);
		});
	}
	
	renderChannelFields(log) {
		return this.state.channel_fields.map(field => {
			if(field.type!='TEXT')
				return (<td key={field.name} className="center"><span className="action" onClick={(e) => this.setFilter('filter_channel_'+field.name, log['channel_'+field.name])}>{log['channel_'+field.name]}</span></td>);
			else
				return (<td key={field.name} className="center"><span>{log['channel_'+field.name]}</span></td>);
		});
	}
	
	renderChannelLogs(log) {
		if(this.state.details[log.id]===undefined)
			return (<tr><td colSpan={3 + this.state.group_fields.length}></td></tr>);
		
		return (<tr><td colSpan={3 + this.state.group_fields.length}><ul>{this.renderChannelLogsValues(this.state.details[log.id])}</ul></td></tr>);
	}
	
	renderChannelLogsValues(values) {
		return Object.keys(values).map(name => {
			if(name=="domnode")
				return;
			return (
				<li key={name}><b>{name} :</b> {values[name]}</li>
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
	
	renderTab() {
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
	
	renderTabs() {
		return this.state.channelgroups.map(group => {
			return (
				<Tab key={group.name} title={group.name}>
					<ELogsFilters group={group.id} ref={this.filters} onChange={this.updateFilters} />
					<br />
					{this.renderTab()}
				</Tab>
			);
		});
	}
	
	render() {
		return (
			<div>
				<Tabs onChange={this.changeTab}>
					{this.renderTabs()}
				</Tabs>
			</div>
		);
	}
}
