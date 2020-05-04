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

import {evQueueComponent} from '../components/base/evqueue-component.js';
import {HeaderMenu} from '../components/menus/header.js';
import {Checkbox} from '../ui/checkbox.js';
import {Radios} from '../ui/radios.js';
import {Radio} from '../ui/radio.js';
import {InputSpinner} from '../ui/input-spinner.js';

export class PageInstancesStatistics extends evQueueComponent {
	constructor(props) {
		super(props);
		
		this.state.nval = 10;
		this.state.groupby = 'day';
		this.state.data = [];
		
		this.state.workflows = {};
		this.state.workflows_checked = {};
		this.state.groups = {};
		
		this.state.graphs = {};
		
		this.changePeriod = this.changePeriod.bind(this);
		this.changeNval = this.changeNval.bind(this);
		this.checkWorkflow = this.checkWorkflow.bind(this);
	}
	
	componentDidMount() {
		this.API({
			group: 'workflows',
			action: 'list',
		}).then( (response) => {
			let workflows = {};
			let workflows_checked = {};
			let groups = {};
			let graphs = {'': {ref: React.createRef(), chart: null, should_update: true}};
			let data = this.parseResponse(response).response;
			for(let i=0;i<data.length;i++)
			{
				let group = data[i].group!=""?data[i].group:"No group";
				
				if(workflows[group]===undefined)
					workflows[group] = [];
				
				workflows_checked[data[i].name] = false;
				workflows[group].push(data[i].name);
				groups[data[i].name] = group;
				graphs[group] = {
					ref: React.createRef(),
					chart: null,
					should_update: true
				};
			}
			
			this.setState({workflows: workflows, workflows_checked:workflows_checked, groups: groups, graphs: graphs});
			
			this.updateData(this.state.groupby);
		});
	}
	
	changePeriod(e) {
		this.setState({groupby: e.target.value});
		
		this.updateData(e.target.value);
	}
	
	changeNval(e) {
		let graphs = this.state.graphs;
		for(let group in graphs)
			graphs[group].should_update = true;
		
		this.setState({nval: e.target.value, graphs: graphs});
	}
	
	checkWorkflow(e) {
		let workflows_checked = this.state.workflows_checked;
		workflows_checked[e.target.name] = e.target.value;
		
		let group = this.state.groups[e.target.name];
		this.state.graphs[group].should_update = true;
		
		this.setState({workflows_checked: workflows_checked});
	}
	
	updateData(groupby) {
		this.API({
			group: 'instances',
			action: 'list',
			attributes: {'groupby': groupby, 'limit':10000}
		}).then( (response) => {
			let data = this.parseResponse(response).response;
			
			let graphs = this.state.graphs;
			for(let group in graphs)
				graphs[group].should_update = true;
			
			this.setState({data: data, graphs: graphs});
		});
	}
	
	pad2(str) {
		str = ''+str;
		return str.padStart(2, '0');
	}
	
	buildXAxis() {
		let groupby = this.state.groupby;
		let nit = this.state.nval;
		
		// Build X axis
		let x_axis = [];
		let current_date = new Date();
		for(let i=0;i<nit;i++)
		{
			let x = "" + current_date.getFullYear();
			if(groupby=='month' || groupby=='day' || groupby=='hour')
				x += "-"+this.pad2((current_date.getMonth()+1));
			if(groupby=='day' || groupby=='hour')
				x += "-"+this.pad2(current_date.getDate());
			if(groupby=='hour')
				x += " "+this.pad2(current_date.getHours())+":00";
			
			x_axis.unshift(x);
			
			if(groupby=='hour')
				current_date.setHours(current_date.getHours()-1);
			else if(groupby=='day')
				current_date.setHours(current_date.getHours()-24);
			else if(groupby=='month')
				current_date.setMonth(current_date.getMonth()-1);
			else if(groupby=='year')
				current_date.setMonth(current_date.getMonth()-12);
		}
		
		return x_axis;
	}
	
	buildYAxis(x_axis, filter_wf = []) {
		let data = this.state.data;
		
		// Compute all possible points
		let all_points = [];
		for(let i=0;i<data.length;i++)
		{
			let p = data[i];
			
			if(filter_wf.length>0 && filter_wf.indexOf(p.name)==-1)
				continue;
			
			let key = '';
			if(p.year!==undefined)
				key += p.year;
			if(p.month!==undefined)
				key += '-'+this.pad2(p.month);
			if(p.day!==undefined)
				key += '-'+this.pad2(p.day);
			if(p.hour!==undefined)
				key += ' '+this.pad2(p.hour)+':00';
			
			if(all_points[key]===undefined)
				all_points[key] = { total: 0 };
			all_points[key].total += parseInt(p.count);
		}
		
		// Build Y axis
		let points = [];
		for(let i=0;i<x_axis.length;i++)
		{
			if(all_points[x_axis[i]]!==undefined)
				points.push({x: x_axis[i], y: all_points[x_axis[i]].total});
			else
				points.push({x: x_axis[i], y: 0});
		}
		
		return points;
	}
	
	buildDataset(name, color_idx, x_axis, filters) {
		let colors = [
			'#3b79db',
			'#29632b',
			'#cc7c04',
			'#b52812',
			'#28c7c2',
			'#7c20a1',
			'#d6d60f',
			'#9dbbeb',
			'#83f787',
			'#edc282',
			'#eb8f81',
			'#91e6e3',
			'#c491d9',
			'#f5f59f',
			
		];
		
		return {
			label: name,
			fill: false,
			borderColor: colors[color_idx%colors.length],
			data: this.buildYAxis(x_axis, filters)
		};
	}
	
	drawChart(ref, group) {
		let x_axis = this.buildXAxis();
		let datasets = [];
		
		// Global graph
		datasets.push(this.buildDataset("All workflows", 0, x_axis, group==''?[]:this.state.workflows[group]));
		
		if(group!='')
		{
			let workflows = this.state.workflows[group];
			for(let i=0;i<workflows.length;i++)
			{
				if(this.state.workflows_checked[workflows[i]])
					datasets.push(this.buildDataset(workflows[i], i+1, x_axis, [workflows[i]]));
			}
		}
		
		return new Chart(ref.current, {
			type: 'line',
			data: {
				labels: x_axis,
				datasets: datasets
			},
			options: {
				maintainAspectRatio: false
			}
		});
	}
	
	renderGraph(group) {
		if(this.state.graphs[group]===undefined)
			return;
		
		let graph = this.state.graphs[group];
		
		if(graph.ref.current!==null && graph.should_update)
		{
			if(graph.chart!==null)
				graph.chart.destroy();
			
			graph.chart = this.drawChart(graph.ref, group);
			graph.should_update = false;
		}
		
		return (
			<div style={{height: '200px', width: '100%'}}>
				<canvas ref={graph.ref} />
			</div>
		);
	}
	
	renderWorkflows(group) {
		return this.state.workflows[group].map( (workflow) => {
			return (
				<span key={workflow}>
					<Checkbox name={workflow} value={this.state.workflows_checked[workflow]} onChange={this.checkWorkflow} />
					&#160;{workflow}
				</span>
			);
		});
	}
	
	renderGroups() {
		if(Object.keys(this.state.workflows).length==0)
			return;
		
		return Object.keys(this.state.workflows).map( (group) => {
			return (
				<React.Fragment key={group}>
					<h2>{group}</h2>
					{this.renderGraph(group)}
					<div className="filter-workflows">
						{this.renderWorkflows(group)}
					</div>
				</React.Fragment>
			);
		});
	}
	
	render() {
		return (
			<div className="evq-instances-statistics">
				<HeaderMenu current="Statistics" />
				
				<h2>Instances statistics properties</h2>
				<div className="formdiv">
					<div>
						<label>Number of points</label>
						<InputSpinner name="nval" value={this.state.nval} step="1" min="1" max="50" onChange={this.changeNval} />
					</div>
					<div>
						<label>Period</label>
						<Radios name="groupby" value={this.state.groupby} onChange={this.changePeriod}>
							<Radio value="month" />&#160;Month
							<Radio value="day" />&#160;Day
							<Radio value="hour" />&#160;Hour
						</Radios>
					</div>
				</div>
				
				<br />
				
				<h2>Overall</h2>
				{this.renderGraph('')}
				
				{this.renderGraph(this.overall_ref,'')}
				{this.renderGroups()}
			</div>
		);
	}
}
