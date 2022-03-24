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
import {Select} from '../../../ui/select.js';
import {InputSpinner} from '../../../ui/input-spinner.js';
import {DatePicker} from '../../../ui/datepicker.js';
import {Autocomplete} from '../../../ui/autocomplete.js';

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
			filter_ip: '',
			filter_channel: '',
			filter_uid: '',
			filter_status: '',
			filter_domain: '',
			filter_machine: ''
		};
		
		this.state.filters = Object.assign({}, this.empty_filters);
		this.state.channels = [];
		
		
		this.state.opened = false;
		
		this.hours = [];
		for(var i=0;i<24;i++)
		{
			var h = (''+i).padStart(2,'0');
			this.hours.push(h+':00');
			this.hours.push(h+':30');
		}
		
		this.toggleFilters = this.toggleFilters.bind(this);
		this.filterChange = this.filterChange.bind(this);
		this.cleanFilters = this.cleanFilters.bind(this);
	}
	
	componentDidMount() {
		this.API({
				group: 'channels',
				action: 'list',
		}).then( (response) => {
				let data = this.parseResponse(response);
				
				let channels = [{name: 'All channels', value: ''}];
				for(let i=0;i<data.response.length;i++)
					channels.push({name: data.response[i].name, value: data.response[i].name});
				this.setState({channels: channels});
		});
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
		
		if(this.props.onChange.current)
			this.props.onChange.current.updateFilters(this.state.filters);
	}
	
	setFilter(name,value) {
		let filters = this.state.filters;
		filters[name] = value;
		this.setState({filters:filters});
	}
	
	cleanFilters() {
		this.setState({filters:Object.assign({}, this.empty_filters), opened:false});
		
		if(this.props.onChange.current)
			this.props.onChange.current.updateFilters(this.empty_filters);
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
	
	renderExplain() {
		if(Object.keys(this.state.filters).length==0)
			return 'Showing all logs';
		
		let explain_date = '';

		if(this.state.filters.filter_emitted_from && this.state.filters.filter_emitted_until)
			explain_date += ' emitted between '+this.state.filters.filter_emitted_from+' and '+this.state.filters.filter_emitted_until;
		else if(this.state.filters.filter_emitted_from)
			explain_date += ' emitted since '+this.state.filters.filter_emitted_from;
		else if(this.state.filters.filter_emitted_until)
			explain_date += ' emitted before '+this.state.filters.filter_emitted_until;
		
		let explain_channel = '';
		if(this.state.filters.filter_channel)
			explain_channel = ' on channel '+this.state.filters.filter_channel+' ';
		
		let explain_parts = [];
		if(this.state.filters.filter_crit)
			explain_parts.push(' criticality '+this.state.filters.filter_crit);
		if(this.state.filters.filter_ip)
			explain_parts.push(' ip address '+this.state.filters.filter_ip);
		if(this.state.filters.filter_status)
			explain_parts.push(' status equals to '+this.state.filters.filter_status);
		if(this.state.filters.filter_uid)
			explain_parts.push(' unique ID «'+this.state.filters.filter_uid+'» ');
		if(this.state.filters.filter_domain)
			explain_parts.push(' domain «'+this.state.filters.filter_domain+'» ');
		if(this.state.filters.filter_machine)
			explain_parts.push(' machine «'+this.state.filters.filter_machine+'» ');
		
		if(explain_date=='' && explain_channel=='' && explain_parts.length==0)
			return 'Showing all logs';
		
		let explain = 'Showing logs';
		if(explain_date)
			explain += explain_date;
		if(explain_channel)
			explain += explain_channel;
		if(explain_parts.length>0)
			explain += ' with '+explain_parts.join(' and ');
		return explain;
	}
	
	renderFilters() {
		if(!this.state.opened)
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
				<div>
					<label>Channel</label>
					<Select name="filter_channel" value={this.state.filters.filter_channel} values={this.state.channels} onChange={this.filterChange} />
				</div>
				<div>
					<label>Criticality</label>
					<Select name="filter_crit" value={this.state.filters.filter_crit} values={crit_values} filter={false} onChange={this.filterChange} />
				</div>
				<div>
					<label>IP</label>
					<input type="text" name="filter_ip" value={this.state.filters.filter_ip} onChange={this.filterChange} />
				</div>
				<div>
					<label>UID</label>
					<input type="text" name="filter_uid" value={this.state.filters.filter_uid} onChange={this.filterChange} />
				</div>
				<div>
					<label>Domain</label>
					<input type="text" name="filter_domain" value={this.state.filters.filter_domain} onChange={this.filterChange} />
				</div>
				<div>
					<label>Machine</label>
					<input type="text" name="filter_machine" value={this.state.filters.filter_machine} onChange={this.filterChange} />
				</div>
				<div>
					<label>Status</label>
					<InputSpinner name="filter_status" value={this.state.filters.filter_status} onChange={this.filterChange} />
				</div>
				<div>
					<label>Launched between</label>
					Date&#160;:&#160;<DatePicker name="dt_inf" value={this.state.filters.dt_inf} onChange={this.filterChange} />
					&#160;
					Hour&#160;:&#160;<Autocomplete className="hour" name="hr_inf" value={this.state.filters.hr_inf} autocomplete={this.hours} onChange={this.filterChange} />
					&#160;&#160;<b>and</b>&#160;&#160;
					Date&#160;:&#160;<DatePicker name="dt_sup" value={this.state.filters.dt_sup} onChange={this.filterChange} />
					&#160;
					Hour&#160;:&#160;<Autocomplete className="hour" name="hr_sup" value={this.state.filters.hr_sup} autocomplete={this.hours} onChange={this.filterChange} />
				</div>
			</div>
		);
	}
	
	render() {
		return (
			<div id="searchformcontainer">
				<a className="action" onClick={this.toggleFilters}>Filters</a> : <span>{this.renderExplain()}</span>
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
