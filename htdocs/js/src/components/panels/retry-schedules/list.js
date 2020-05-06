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

import {App} from '../../base/app.js';
import {evQueueComponent} from '../../base/evqueue-component.js';
import {Panel} from '../../../ui/panel.js';
import {Dialogs} from '../../../ui/dialogs.js';
import {EditRetrySchedule} from '../../dialogs/retry-schedules/edit.js';

export class RetrySchedulesList extends evQueueComponent {
	constructor(props) {
		super(props);
		
		this.state.retry_schedules = [];
		this.state.retry_schedule_workflows = {};
		
		this.editRetrySchedule = this.editRetrySchedule.bind(this);
	}
	
	componentDidMount() {
		var api = {node:'*', group:'retry_schedules',action:'list', ref: 'retry-schedule'};
		this.Subscribe('RETRYSCHEDULE_CREATED',api);
		this.Subscribe('RETRYSCHEDULE_MODIFIED',api);
		this.Subscribe('RETRYSCHEDULE_REMOVED',api,true);
		
		var api = {node:'*', group:'workflows',action:'list', attributes: {full: 'yes'}, ref: 'workflows'};
		this.Subscribe('WORKFLOW_CREATED',api);
		this.Subscribe('WORKFLOW_MODIFIED',api);
		this.Subscribe('WORKFLOW_REMOVED',api,true);
	}
	
	evQueueEvent(response, ref) {
		if(ref=='retry-schedule')
		{
			let data = this.parseResponse(response);
			this.setState({retry_schedules: data.response});
		}
		
		if(ref=='workflows')
		{
			let retry_schedule_workflows = {};
			
			let workflows = this.parseResponse(response).response;
			
			let workflow_ite = response.evaluate('/response/workflow', response.documentElement);
			let workflow_node;
			while(workflow_node = workflow_ite.iterateNext())
			{
				let workflow_id = workflow_node.getAttribute('id');
				let workflow_name = workflow_node.getAttribute('name');
				
				let retry_schedule_ite = response.evaluate('.//task/@retry_schedule', workflow_node);
				let retry_schedule_node;
				while(retry_schedule_node = retry_schedule_ite.iterateNext())
				{
					let retry_schedule = retry_schedule_node.nodeValue;
					if(retry_schedule_workflows[retry_schedule]===undefined)
						retry_schedule_workflows[retry_schedule] = {};
					
					if(retry_schedule_workflows[retry_schedule][workflow_id]===undefined)
						retry_schedule_workflows[retry_schedule][workflow_id] = {name: workflow_name, id: workflow_id, tasks: 1};
					else
						retry_schedule_workflows[retry_schedule][workflow_id].tasks++;
				}
			}
			
			this.setState({retry_schedule_workflows: retry_schedule_workflows});
		}
	}
	
	editRetrySchedule(e, id) {
		Dialogs.open(EditRetrySchedule, {id: id});
	}
	
	removeRetrySchedule(e, id) {
		this.simpleAPI({
			group: 'retry_schedule',
			action: 'delete',
			attributes: {id: id}
		},"Retry schedule removed", "Are you sure you want to remove this retry schedule ?");
	}
	
	renderRetryScheduleWorkflows(retry_schedule) {
		if(this.state.retry_schedule_workflows[retry_schedule.name]===undefined)
			return;
		
		return Object.keys(this.state.retry_schedule_workflows[retry_schedule.name]).map( (id) => {
			let workflow = this.state.retry_schedule_workflows[retry_schedule.name][id];
			let title = workflow.tasks==1?"1 task is using this retry schedule":workflow.tasks+" tasks are using this retry schedule";
			
			return (
				<span key={workflow.name} title={title} onClick={ (e) => App.changeURL('?loc=workflow-editor&id='+workflow.id) }>{workflow.name}</span>
			);
		});
	}
	
	renderRetrySchedules() {
		return this.state.retry_schedules.map( (retry_schedule) => {
			let remove_title = "Remove retry schedule";
			let remove_onclick = (e) => this.removeRetrySchedule(e, retry_schedule.id);
			let remove_class = "";
			if(this.state.retry_schedule_workflows[retry_schedule.name]!==undefined)
			{
				remove_title = "Cannot remove used retry schedule";
				remove_onclick = undefined;
				remove_class = "disabled";
			}
			
			return (
				<tr key={retry_schedule.name}>
					<td>{retry_schedule.name}</td>
					<td>{ this.renderRetryScheduleWorkflows(retry_schedule) }</td>
					<td className="tdActions">
						<span className="faicon fa-edit" title="Edit retry schedule" onClick={ (e) => this.editRetrySchedule(e, retry_schedule.id) } />
						<span className={"faicon fa-remove "+remove_class} title={remove_title} onClick={remove_onclick } />
					</td>
				</tr>
			);
		});
	}
	
	render() {
		var actions = [
			{icon:'fa-file-o', title: "Create new retry schedule", callback:this.editRetrySchedule}
		];
		
		return (
			<div className="evq-retry-schedules-list">
				<Panel noborder left="" title="Retry schedules" actions={actions}>
					<table className="border">
						<thead>
							<tr>
								<th>Name</th>
								<th>Workflows using retry schedule</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{ this.renderRetrySchedules() }
						</tbody>
					</table>
				</Panel>
			</div>
		);
	}
}
