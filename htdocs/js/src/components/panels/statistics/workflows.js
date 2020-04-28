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

export class WorkflowsStatistics extends evQueueComponent {
	constructor(props) {
		super(props);
		
		this.state.workflows = {};
	}
	
	componentDidMount() {
		var api = {node:'*', group:'workflows',action:'list', attributes: {full: 'yes'}};
		this.Subscribe('WORKFLOW_CREATED',api);
		this.Subscribe('WORKFLOW_MODIFIED',api);
		this.Subscribe('WORKFLOW_REMOVED',api, true);
	}
	
	evQueueEvent(response) {
		let workflows = {};
		
		let workflow_ite = response.evaluate('/response/workflow', response.documentElement);
		let workflow_node;
		while(workflow_node = workflow_ite.iterateNext())
		{
			let group = 'No group';
			if(workflow_node.getAttribute('group')!='')
				group = workflow_node.getAttribute('group');
			
			let workflow = {
				name: workflow_node.getAttribute('name'),
				group: group,
				tasks: {},
				queues: {},
				retry_schedules: {}
			};
			
			let task_ite = response.evaluate('.//task', workflow_node);
			let task_node;
			while(task_node = task_ite.iterateNext())
			{
				let name = task_node.hasAttribute('name')?task_node.getAttribute('name'):task_node.getAttribute('path');
				
				if(workflow.tasks[name]===undefined)
					workflow.tasks[name] = 0;
				workflow.tasks[name]++;
				
				
				let queue = task_node.getAttribute('queue');
				if(workflow.queues[queue]===undefined)
					workflow.queues[queue] = 0;
				workflow.queues[queue]++;
				
				if(task_node.hasAttribute('retry_schedule'))
				{
					let retry_schedule = task_node.getAttribute('retry_schedule');
					if(workflow.retry_schedules[retry_schedule]===undefined)
						workflow.retry_schedules[retry_schedule] = 0;
					workflow.retry_schedules[retry_schedule]++;
				}
			}
			
			if(workflows[workflow.group]===undefined)
				workflows[workflow.group] = [];
			
			workflows[workflow.group].push(workflow);
		}
		
		this.setState({workflows: workflows});
	}
	
	renderTasks(workflow) {
		return Object.keys(workflow.tasks).map( (name) => {
			return (<span key={name}>{name} ({workflow.tasks[name]}) </span>);
		});
	}
	
	renderQueues(workflow) {
		return Object.keys(workflow.queues).map( (name) => {
			return (<span key={name}>{name} ({workflow.queues[name]}) </span>);
		});
	}
	
	renderRetrySchedules(workflow) {
		return Object.keys(workflow.retry_schedules).map( (name) => {
			return (<span key={name}>{name} ({workflow.retry_schedules[name]}) </span>);
		});
	}
	
	renderWorkflows(group) {
		return this.state.workflows[group].map( (workflow) => {
			return (
				<tr key={workflow.name}>
					<td>{workflow.name}</td>
					<td>{this.renderTasks(workflow)}</td>
					<td>{this.renderQueues(workflow)}</td>
					<td>{this.renderRetrySchedules(workflow)}</td>
				</tr>
			);
		});
	}
	
	renderGroups() {
		return Object.keys(this.state.workflows).map( (group) => {
			return (
				<React.Fragment key={"group_"+group}>
					<tr className="group"><td colSpan="4">{group}</td></tr>
					{ this.renderWorkflows(group) }
					{ this.renderSpacer(group) }
				</React.Fragment>
			);
		});
	}
	
	renderSpacer(group) {
		let groups = Object.keys(this.state.workflows);
		if(groups[groups.length-1]==group)
			return;
		return (<tr className="groupspace"><td colSpan="4"></td></tr>);
	}
	
	render() {
		return (
			<Panel noborder left="" title="Workflows statistics">
				<div className="evq-workflows-statistics">
					<table className="border">
						<thead>
							<tr>
								<th>Name</th>
								<th>Tasks</th>
								<th>Queues</th>
								<th>Retry schedules</th>
							</tr>
						</thead>
						<tbody>
							{this.renderGroups()}
						</tbody>
					</table>
				</div>
			</Panel>
		);
	}
}
