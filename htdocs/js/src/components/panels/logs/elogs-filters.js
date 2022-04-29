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
import {ChannelSelector} from '../../base/channel-selector.js';
import {ChannelGroupSelector} from '../../base/channel-group-selector.js';
import {Select} from '../../../ui/select.js';
import {InputSpinner} from '../../../ui/input-spinner.js';
import {DatePicker} from '../../../ui/datepicker.js';
import {Autocomplete} from '../../../ui/autocomplete.js';
import {DialogContext} from '../../../ui/dialog.js';

export class ELogsFilters extends evQueueComponent {
	constructor(props) {
		super(props,'any');
		
		this.empty_filters = {
			filter_crit: '',
			dt_inf: '',
			hr_inf: '',
			filter_emitted_from: '',
			dt_sup: '',
			hr_sup: '',
			filter_emitted_until: '',
			filter_channel: 0,
		};
		
		this.state.filters = Object.assign({}, this.empty_filters);
		this.state.group_fields = {};
		this.state.channel_fields = {};
		this.state.group_id = this.props.group?this.props.group:0;
		
		
		this.state.opened = false;
		
		this.hours = [];
		for(var i=0;i<24;i++)
		{
			var h = (''+i).padStart(2,'0');
			this.hours.push(h+':00');
			this.hours.push(h+':30');
		}
		
		this.groupChange = this.groupChange.bind(this);
		this.channelChange = this.channelChange.bind(this);
		this.toggleFilters = this.toggleFilters.bind(this);
		this.filterChange = this.filterChange.bind(this);
		this.cleanFilters = this.cleanFilters.bind(this);
	}
	
	componentDidMount() {
		if(this.state.group_id)
			this.groupChange(this.state.group_id);
	}
	
	componentDidUpdate() {
		if(this.context.onComponentUpdate)
			this.context.onComponentUpdate();
	}
	
	groupChange(id) {
		this.API({
				group: 'channel_group',
				action: 'get',
				attributes: {id: id}
		}).then( (response) => {
				let data = this.parseResponse(response);
				
				let group_fields = {};
				let filters = this.state.filters;
				for(let i=0;i<data.response.length;i++)
				{
					group_fields[data.response[i].name] = data.response[i].type;
					filters["filter_group_"+data.response[i].name] = '';
				}
				
				this.setState({group_id: id, group_fields: group_fields, filters: filters});
		});
	}
	
	channelChange(id) {
		if(id==0)
		{
			let filters = this.state.filters;
			for(const field in this.state.channel_fields)
				delete filters["filter_channel_"+field];
			this.setState({channel_fields: {}, filters: filters});
		}
		else
		{
			this.API({
					group: 'channel',
					action: 'get',
					attributes: {id: id}
			}).then( (response) => {
					let data = this.parseResponse(response);
					
					let channel_fields = {};
					let filters = this.state.filters;
					for(let i=0;i<data.response.length;i++)
					{
						channel_fields[data.response[i].name] = data.response[i].type;
						filters["filter_channel_"+data.response[i].name] = '';
					}
					
					this.setState({channel_fields: channel_fields, filters: filters});
			});
		}
	}
	
	toggleFilters() {
		this.setState({opened:!this.state.opened});
	}
	
	implodeDate(date,hour)
	{
		if(!date)
		{
			let d = new Date();
			date = d.getFullYear()+'-'+(''+(d.getMonth()+1)).padStart(2, '0')+'-'+(''+d.getDate()).padStart(2, '0');
		}
		
		if(date && !hour)
			return date;
		
		return date+' '+hour;
	}
	
	filterChange(event) {
		this.setFilter(event.target.name,event.target.value);
		
		if(event.target.name=='dt_inf' || event.target.name=='hr_inf')
			this.setFilter('filter_emitted_from',this.implodeDate(this.state.filters.dt_inf,this.state.filters.hr_inf));
		if(event.target.name=='dt_sup' || event.target.name=='hr_sup')
			this.setFilter('filter_emitted_until',this.implodeDate(this.state.filters.dt_sup,this.state.filters.hr_sup));
		
		if(this.props.onChange)
			this.props.onChange(this.state.filters);
		
		
		if(event.target.name=='filter_channel')
			this.channelChange(event.target.value);
	}
	
	setFilter(name,value) {
		let filters = this.state.filters;
		filters[name] = value;
		this.setState({filters:filters});
	}
	
	cleanFilters() {
		this.setState({filters:Object.assign({}, this.empty_filters), opened:false, channel_fields: {}});
		
		if(this.props.onChange)
			this.props.onChange(this.empty_filters);
	}
	
	hasFilter() {
		var filters = this.state.filters;
		for(name in filters)
		{
			if(filters[name]!='')
				return true;
		}
		return false;
	}
	
	renderGroupSelector() {
		if(this.props.group)
			return;
		
		return (
			<div>
				<label>Group</label>
				<ChannelGroupSelector name="group" value={this.state.group_id} onChange={e => this.groupChange(e.target.value)} />
			</div>
			
		);
	}
	
	renderGroupFilters() {
		return Object.keys(this.state.group_fields).map(name => {
			let type = this.state.group_fields[name];
			
			if(type=="TEXT")
				return; // Text fields are not indexed
			
			return (
				<div key={name}>
					<label>{name}</label>
					<input type="text" name={"filter_group_"+name} value={this.state.filters["filter_group_"+name]} onChange={this.filterChange} />
				</div>
			);
		});
	}
	
	renderChannelFilters() {
		return Object.keys(this.state.channel_fields).map(name => {
			let type = this.state.channel_fields[name];
			
			if(type=="TEXT")
				return; // Text fields are not indexed
			
			return (
				<div key={name}>
					<label>{name}</label>
					<input type="text" name={"filter_channel_"+name} value={this.state.filters["filter_channel_"+name]} onChange={this.filterChange} />
				</div>
			);
		});
	}
	
	renderDateFilter() {
		if(this.props.datefilter===false)
			return;
		
		return (
			<div>
				<label>Emitted between</label>
				Date&#160;:&#160;<DatePicker name="dt_inf" value={this.state.filters.dt_inf} onChange={this.filterChange} />
				&#160;
				Hour&#160;:&#160;<Autocomplete className="hour" name="hr_inf" value={this.state.filters.hr_inf} autocomplete={this.hours} onChange={this.filterChange} />
				&#160;&#160;<b>and</b>&#160;&#160;
				Date&#160;:&#160;<DatePicker name="dt_sup" value={this.state.filters.dt_sup} onChange={this.filterChange} />
				&#160;
				Hour&#160;:&#160;<Autocomplete className="hour" name="hr_sup" value={this.state.filters.hr_sup} autocomplete={this.hours} onChange={this.filterChange} />
			</div>
		);
	}
	
	renderFilters(force = false) {
		if(!force && !this.state.opened)
			return;
		
		let crit_values = [
			{name: 'All', value: ''},
			{name: 'Emergency', value: 'LOG_EMERG'},
			{name: 'Alert', value: 'LOG_ALERT'},
			{name: 'Critical', value: 'LOG_CRIT'},
			{name: 'Error', value: 'LOG_ERR'},
			{name: 'Warning', value: 'LOG_WARNING'},
			{name: 'Notice', value: 'LOG_NOTICE'},
			{name: 'Info', value: 'LOG_INFO'},
			{name: 'Debug', value: 'LOG_DEBUG'},
		];
		
		return (
			<div className="formdiv log_filters">
				{this.renderGroupSelector()}
				<div>
					<label>Channel</label>
					<ChannelSelector name="filter_channel" value={this.state.filters.filter_channel} onChange={this.filterChange} />
				</div>
				<div>
					<label>Criticality</label>
					<Select name="filter_crit" value={this.state.filters.filter_crit} values={crit_values} filter={false} onChange={this.filterChange} />
				</div>
				{this.renderGroupFilters()}
				{this.renderChannelFilters()}
				{this.renderDateFilter()}
			</div>
		);
	}
	
	render() {
		if(this.props.panel===false)
			return (<React.Fragment>{this.renderFilters(true)}</React.Fragment>);
		
		return (
			<div id="searchformcontainer">
				<a className="action" onClick={this.toggleFilters}>Filters</a>
				{
					this.hasFilter()?
					(<span className="faicon fa-remove" title="Clear filters" onClick={this.cleanFilters}></span>):
					''
				}
				{this.renderFilters()}
			</div>
		);
	}
}

ELogsFilters.contextType = DialogContext;