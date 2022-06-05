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
import {EventsUtils} from '../../../utils/events.js';
import {ELogsFilters} from '../../panels/logs/elogs-filters.js';

export class ELogs extends evQueueComponent {
	constructor(props) {
		super(props);
		
		this.state.logs = [];
		
		// Init filters
		let filters = {};
		let preferences = JSON.parse(window.localStorage.preferences);
		
		if(Object.keys(App.getData()).length>0)
			filters = Object.assign(filters, App.getData());
		else if(preferences.elogs!==undefined && preferences.elogs.bookmark_filters!==undefined)
			filters = Object.assign(filters, preferences.elogs.bookmark_filters);
		
		this.state.filters = filters;
		this.state.group_fields = {};
		this.state.channel_fields = {};
		
		this.state.details = {};
		
		this.state.current_page = 1;
		this.items_per_page = 100;
		
		this.filters = React.createRef();
		
		this.updateFilters = this.updateFilters.bind(this);
		this.toggleDetails = this.toggleDetails.bind(this);
		this.evQueueEvent = this.evQueueEvent.bind(this);
		this.nextPage = this.nextPage.bind(this);
		this.previousPage = this.previousPage.bind(this);
		this.bookmark = this.bookmark.bind(this);
	}
	
	componentDidMount() {
		this.updateFilters(this.state.filters, {}, {}); // Subscribe events
	}
	
	evQueueEvent(response) {
		let data = this.parseResponse(response,'/response/logs/*');
		
		let group_fields_resp = this.parseResponse(response,'/response/group/*');
		let group_fields = {};
		for(let i=0;i<group_fields_resp.response.length;i++)
			group_fields['group_'+group_fields_resp.response[i].name] = group_fields_resp.response[i].type;
		
		let channel_fields_resp = this.parseResponse(response,'/response/channel/*');
		let channel_fields = {};
		for(let i=0;i<channel_fields_resp.response.length;i++)
			channel_fields['channel_'+channel_fields_resp.response[i].name] = channel_fields_resp.response[i].type;
		
		this.setState({logs: data.response, group_fields: group_fields, channel_fields: channel_fields});
	}
	
	bookmark() {
		let preferences = JSON.parse(window.localStorage.preferences);
		
		if(preferences.elogs===undefined)
			preferences.elogs = {};
		
		preferences.elogs.bookmark_filters = this.state.filters;
		
		this.simpleAPI({
			group: 'user',
			action: 'update_preferences',
			attributes: {
				name: window.localStorage.user,
				preferences: JSON.stringify(preferences)
			}
		}, "Search filters bookmarked").then( () => {
			window.localStorage.preferences = JSON.stringify(preferences);
		});
	}
	
	nextPage() {
		this.setState({current_page: ++this.state.current_page});
		this.updateFilters(this.state.filters);
	}
	
	previousPage() {
		this.setState({current_page: --this.state.current_page});
		this.updateFilters(this.state.filters);
	}
	
	updateFilters(filters = {}) {
		filters.limit = this.items_per_page;
		filters.offset = (this.state.current_page-1)*this.items_per_page;
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
				<th key={'group_'+field}>{field.substr(6)}</th>
			);
		});
	}
	
	renderChannelFieldsHeader() {
		return Object.keys(this.state.channel_fields).map(field => {
			return (
				<th key={'channel_'+field}>{field.substr(8)}</th>
			);
		});
	}
	
	renderGroupFields(log) {
		return Object.keys(this.state.group_fields).map(field => {
			if(this.state.group_fields[field]!='TEXT')
				return (<td key={field} className="center"><span className="action" onClick={(e) => this.setFilter('filter_'+field, log[field])}>{log[field]}</span></td>);
			else
				return (<td key={field} className="center"><span>{log[field]}</span></td>);
		});
	}
	
	renderChannelFields(log) {
		return Object.keys(this.state.channel_fields).map(field => {
			if(this.state.channel_fields[field]!='TEXT')
				return (<td key={field} className="center"><span className="action" onClick={(e) => this.setFilter('filter_'+field, log[field])}>{log[field]}</span></td>);
			else
				return (<td key={field} className="center"><span>{log[field]}</span></td>);
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
		let actions = [
		{icon:'fa-star', callback:this.bookmark},
		{icon:'fa-refresh '+(this.state.refresh?' fa-spin':''), callback:this.toggleAutorefresh}
		];
		
		let current_page = this.state.current_page;
		let title = (
			<span>
				Last external logs
				&#160;
				{ current_page>1?(<span className="faicon fa-backward" onClick={this.previousPage}></span>):'' }
				&#160;
				{ (current_page-1)*this.items_per_page + 1 } - { current_page*this.items_per_page - (this.items_per_page - this.state.logs.length)}
				{ this.state.logs.length==this.items_per_page?(<span className="faicon fa-forward" onClick={this.nextPage}></span>):''}
			</span>
			
		);
		
		if(!this.state.filters.groupby)
		{
			return (
				<div className="evq-logs-elogs">
					<Panel noborder left="" title={title} actions={actions}>
						<table className="evenodd4">
							<thead>
								<tr>
									<th style={{width: '10rem'}}>Channel</th>
									<th style={{width: '10rem'}}>Date</th>
									<th style={{width: '8rem'}}>Crit</th>
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
