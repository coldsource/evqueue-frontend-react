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
import {WorkflowSelector} from '../../base/workflow-selector.js';
import {NodeSelector} from '../../base/node-selector.js';
import {TagSelector} from '../../base/tag-selector.js';
import {Select} from '../../../ui/select.js';
import {DatePicker} from '../../../ui/datepicker.js';
import {Autocomplete} from '../../../ui/autocomplete.js';

export class InstanceFilters extends evQueueComponent {
	constructor(props) {
		super(props,'any');
		
		this.empty_filters = {
			filter_error: 'no',
			filter_node: '',
			filter_name: '',
			filter_tag_id: 0,
			tag_label: '',
			dt_inf: '',
			hr_inf: '',
			filter_launched_from: '',
			dt_sup: '',
			hr_sup: '',
			filter_launched_until: '',
			dt_at: '',
			hr_at: '',
			filter_ended_from: ''
		};
		
		this.state.filters = Object.assign({}, this.empty_filters);
		
		
		this.state.opened = false;
		this.state.parameters = [];
		this.state.custom_attributes = [];
		
		this.hours = [];
		for(var i=0;i<24;i++)
		{
			var h = (''+i).padStart(2,'0');
			this.hours.push(h+':00');
			this.hours.push(h+':30');
		}
		
		this.state.nodes = [{name: 'All', value: '' }];
		var nodes = this.state.cluster.nodes_names;
		for(var i=0;i<nodes.length;i++)
			this.state.nodes.push({name: nodes[i], value: nodes[i]});
		
		this.toggleFilters = this.toggleFilters.bind(this);
		this.filterChange = this.filterChange.bind(this);
		this.cleanFilters = this.cleanFilters.bind(this);
	}
	
	toggleFilters() {
		this.setState({opened:!this.state.opened});
	}
	
	implodeDate(date,hour)
	{
		if(!date)
			return '';
		
		if(date && !hour)
			return date;
		
		return date+' '+hour;
	}
	
	loadWorkflowProperties(id) {
		// Reset old parameters and custom attributes filters
		let filters = Object.assign({}, this.state.filters);
		for(name in filters)
		{
			if(name.substr(0,10)=='parameter_' || name.substr(0,16)=='customattribute_')
				delete filters[name];
		}
		
		// Get parameters and custom attributes of this workflow
		this.API({
			group: 'workflow',
			action: 'get',
			attributes: {id: id}
		}).then( (response) => {
			let parameters = [];
			let custom_attributes = [];
			
			let parameter_ite = response.evaluate('/response/workflow/workflow/parameters/parameter', response.documentElement);
			let parameter_node;
			while(parameter_node = parameter_ite.iterateNext())
			{
				let name = parameter_node.getAttribute('name');
				parameters.push(name);
				filters['parameter_'+name] = '';
			}
			
			let custom_attribute_ite = response.evaluate('/response/workflow/workflow/custom-attributes/custom-attribute', response.documentElement);
			let custom_attribute_node;
			while(custom_attribute_node = custom_attribute_ite.iterateNext())
			{
				let name = custom_attribute_node.getAttribute('name');
				custom_attributes.push(name);
				filters['customattribute_'+name] = '';
			}
			
			this.setState({parameters: parameters, custom_attributes: custom_attributes, filters: filters});
			
			if(this.props.onChange.current)
				this.props.onChange.current.updateFilters(filters);
		});
	}
	
	filterChange(event, opt) {
		this.setFilter(event.target.name,event.target.value, opt);
		
		if(event.target.name=='filter_workflow_id')
		{
			this.setFilter('filter_workflow',event.target.value2, opt); // value is workflow ID and value2 is workflow name
			this.loadWorkflowProperties(event.target.value);
			return;
		}
		
		if(event.target.name=='dt_inf' || event.target.name=='hr_inf')
			this.setFilter('filter_launched_from',this.implodeDate(this.state.filters.dt_inf,this.state.filters.hr_inf));
		if(event.target.name=='dt_sup' || event.target.name=='hr_sup')
			this.setFilter('filter_launched_until',this.implodeDate(this.state.filters.dt_sup,this.state.filters.hr_sup));
		if(event.target.name=='dt_at' || event.target.name=='hr_at')
		{
			var hr = this.state.filters.hr_at;
			if(hr && hr.length<=5)
				hr += ':59';
			
			this.setFilter('filter_launched_until',this.implodeDate(this.state.filters.dt_at,hr));
			this.setFilter('filter_ended_from',this.implodeDate(this.state.filters.dt_at,this.state.filters.hr_at));
		}
		
		if(this.props.onChange.current)
			this.props.onChange.current.updateFilters(this.state.filters);
	}
	
	setFilter(name,value, opt) {
		var filters = this.state.filters;
		filters[name] = value;
		if(name=='filter_tag_id')
			filters.tag_label = opt;
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
			return 'Showing all terminated workflows';
		
		var explain;
		if(this.state.filters.filter_error=='yes')
			explain = 'Showing failed ';
		else
			explain = 'Showing terminated ';

		explain += (this.state.filters.filter_workflow?' '+this.state.filters.filter_workflow+' ':'')+'workflows';
		if(this.state.filters.filter_launched_until && this.state.filters.filter_ended_from)
			explain += ' that were running at '+this.state.filters.filter_launched_until;
		else if(this.state.filters.filter_launched_from && this.state.filters.filter_launched_until)
			explain += ' between '+this.state.filters.filter_launched_from+' and '+this.state.filters.filter_launched_until;
		else if(this.state.filters.filter_launched_from)
			explain += ' since '+this.state.filters.filter_launched_from;
		else if(this.state.filters.filter_launched_until)
			explain += ' before '+this.state.filters.filter_launched_until;
		else if(this.state.filters.filter_tag_id)
			explain += ' tagged « '+this.state.filters.tag_label+' »';

		let explain_parameters = '';
		if(this.state.parameters.length>0)
		{
			for(let i=0;i<this.state.parameters.length;i++)
			{
				let name = this.state.parameters[i];
				let value = this.state.filters['parameter_'+name];
				if(!value)
					continue;
				
				if(explain_parameters!='')
					explain_parameters += ', ';
				explain_parameters+= name+' = '+value+'';
				i++;
			}
		}
		
		let explain_customattributes = '';
		if(this.state.custom_attributes.length>0)
		{
			for(let i=0;i<this.state.custom_attributes.length;i++)
			{
				let name = this.state.custom_attributes[i];
				let value = this.state.filters['customattribute_'+name];
				if(!value)
					continue;
				
				if(explain_customattributes!='')
					explain_customattributes += ', ';
				explain_customattributes+= name+' = '+value+'';
				i++;
			}
		}
		
		if(explain_parameters || explain_customattributes)
				explain += ' having';
		if(explain_parameters)
			explain += ' '+explain_parameters;
		if(explain_customattributes)
		{
			if(explain_parameters)
				explain += ', ';
			explain += ' '+explain_customattributes;
		}

		if(this.state.filters.filter_node)
			explain += ' on node '+this.state.filters.filter_node;
		
		return explain;
	}
	
	renderParameterFilters() {
		return this.state.parameters.map( (parameter) => {
			return (
				<div key={parameter}>
					<label>{parameter}</label>
					<input type="text" name={'parameter_'+parameter} value={this.state.filters['parameter_'+parameter]} onChange={this.filterChange} />
				</div>
			);
		});
	}
	
	renderCustomAttributeFilters() {
		return this.state.custom_attributes.map( (custom_attribute) => {
			return (
				<div key={custom_attribute}>
					<label>{custom_attribute}</label>
					<input type="text" name={'customattribute_'+custom_attribute} value={this.state.filters['customattribute_'+custom_attribute]} onChange={this.filterChange} />
				</div>
			);
		});
	}
	
	renderFilters() {
		if(!this.state.opened)
			return;
		
		return (
			<div className="formdiv instance_filters">
				<div>
					<label>Node</label>
					<NodeSelector all={true} name="filter_node" value={this.state.filters.filter_node} onChange={this.filterChange} />
				</div>
				<div>
					<label>Workflow</label>
					<WorkflowSelector valueType="name" name="filter_workflow_id" value={this.state.filters.filter_workflow_id} onChange={this.filterChange}/>
				</div>
				{ this.renderParameterFilters() }
				{ this.renderCustomAttributeFilters() }
				<div>
					<label>Tag</label>
					<TagSelector name="filter_tag_id" value={this.state.filters.filter_tag_id} onChange={this.filterChange}/>
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
				<div>
					<label>Workflows that were running at</label>
					Date&#160;:&#160;<DatePicker name="dt_at" value={this.state.filters.dt_at} onChange={this.filterChange} />
					&#160;
					Hour&#160;:&#160;<Autocomplete className="hour" name="hr_at" value={this.state.filters.hr_at} autocomplete={this.hours} onChange={this.filterChange} />
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
