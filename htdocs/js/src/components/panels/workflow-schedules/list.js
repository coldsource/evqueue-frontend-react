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
import {EditWorkflowSchedule} from '../../dialogs/workflow-schedules/edit.js';

export class WorkflowSchedulesList extends evQueueComponent {
	constructor(props) {
		super(props);
		
		this.nodes_status = {};
		
		this.state.workflow_schedules = {};
		this.state.status = {};
		this.state.last_execution = {};
		
		this.init = false;
		
		this.editWorkflowSchedule = this.editWorkflowSchedule.bind(this);
	}
	
	componentDidMount() {
		let api_list_schedules = {node: '*', group: 'workflow_schedules',action: 'list', attributes: {display_parameters: 'yes'}, ref: 'schedule'};
		let api_status = {node: '*', group: 'status', action: 'query', attributes: {type: 'scheduler'}, ref: 'status'};
		
		this.Subscribe('WORKFLOWSCHEDULE_MODIFIED',api_list_schedules);
		this.Subscribe('WORKFLOWSCHEDULE_MODIFIED',api_status);
		
		this.Subscribe('WORKFLOWSCHEDULE_REMOVED',api_list_schedules);
		
		this.Subscribe('WORKFLOWSCHEDULE_CREATED',api_list_schedules,true);
		this.Subscribe('WORKFLOWSCHEDULE_CREATED',api_status);
		
		this.Subscribe('WORKFLOWSCHEDULE_STARTED',api_status);
		this.Subscribe('WORKFLOWSCHEDULE_STOPPED',api_status);
	}
	
	evQueueEvent(response, ref) {
		let data = this.parseResponse(response);
		
		if(ref=='schedule')
		{
			// Init last executions if needed
			if(!this.init)
			{
				for(let i=0;i<data.response.length;i++)
					this.updateLastExecution(data.response[i].id);
				
				this.init = true;
			}
			
			// Update schedules list
			let schedules = {};
			for(let i=0;i<data.response.length;i++)
			{
				let group = data.response[i].workflow_group?data.response[i].workflow_group:'No group';
				if(schedules[group]===undefined)
					schedules[group] = [];
				
				let schedule = data.response[i];
				schedule.parameters = this.xpath('./parameter',data.response[i].domnode);
				schedules[group].push(schedule);
			}
			
			this.setState({workflow_schedules: schedules});
		}
		
		if(ref=='status')
		{
			if(data['object-id']!==undefined)
				this.updateLastExecution(data['object-id']);
			
			// Each engine only returns it's own status, se we have to merge this status with the global status to have a full view of the cluster's status
			let schedules = this.xpath('/response/status/workflow', response.documentElement);
			let node_status = {};
			for(let i=0;i<schedules.length;i++)
				node_status[schedules[i].workflow_schedule_id] = schedules[i];
			
			this.nodes_status[data.node] = node_status;
			
			// Merge all nodes' status
			let status = {};
			for(const node in this.nodes_status)
				Object.assign(status, this.nodes_status[node]);
			
			// Store global (consolidated) status
			this.setState({status: status});
		}
	}
	
	updateLastExecution(schedule_id) {
		this.API({
			group: 'instances',
			action: 'list',
			attributes: { limit: 1, filter_schedule_id: schedule_id }
		}).then( (response) => {
			let data = this.parseResponse(response);
			if(data.response.length>0)
			{
				let last_execution = this.state.last_execution;
				last_execution[schedule_id] = data.response[0].end_time;
				this.setState({last_execution: last_execution});
			}
		});
	}
	
	toggleLock(id, active) {
		let action = active==1?'lock':'unlock';
		
		this.API({
			group: 'workflow_schedule',
			action: action,
			attributes: {id: id}
		});
	}
	
	editWorkflowSchedule(e, id) {
		Dialogs.open(EditWorkflowSchedule, {id: id});
	}
	
	removeWorkflowSchedule(e, id) {
		this.simpleAPI({
			group: 'workflow_schedule',
			action: 'delete',
			attributes: {id: id}
		},"Workflow schedule removed", "Are you sure you want to remove this schedule ?");
	}
	
	renderWorkflowScheduleParameters(parameters) {
		return parameters.map( (parameter) => {
			return (
				<div key={parameter.name}>
					<span>{parameter.name}: {parameter.value}</span>
				</div>
			);
		});
	}
	
	renderWorkflowSchedules(workflow_schedules) {
		return workflow_schedules.map( (workflow_schedule) => {
			let next_execution = '';
			if(this.state.status[workflow_schedule.id]!==undefined)
				next_execution = this.state.status[workflow_schedule.id].scheduled_at;
			
			let last_execution = '';
			if(this.state.last_execution[workflow_schedule.id]!==undefined)
				last_execution = this.state.last_execution[workflow_schedule.id];
			
			let lock_icon = 'faicon fa-lock';
			let lock_title = "Activate this schedule";
			if(workflow_schedule.active==1)
			{
				lock_icon = 'faicon fa-check';
				lock_title = "Disable this schedule";
			}
			
			return (
				<tr key={workflow_schedule.id}>
					<td>
						{workflow_schedule.workflow_name}
						{workflow_schedule.comment?(<span>{workflow_schedule.comment}</span>):''}
						{this.renderWorkflowScheduleParameters(workflow_schedule.parameters)}
					</td>
					<td>{workflow_schedule.onfailure}</td>
					<td>{workflow_schedule.node}</td>
					<td>{workflow_schedule.host?workflow_schedule.host:'localhost'}</td>
					<td>{last_execution}</td>
					<td>{next_execution}</td>
					<td className="tdActions">
						<span className="faicon fa-eye" title="View launched instances" onClick={ (e) => App.changeURL('/?filter_schedule_id='+workflow_schedule.id) } />
						<span className={lock_icon} title={lock_title} onClick={ (e) => this.toggleLock(workflow_schedule.id, workflow_schedule.active==1) } />
					</td>
					<td className="tdActions">
						<span className="faicon fa-edit" title="Edit schedule" onClick={ (e) => this.editWorkflowSchedule(e, workflow_schedule.id) } />
						<span className="faicon fa-remove" title="Remove this schedule" onClick={ (e) => this.removeWorkflowSchedule(e, workflow_schedule.id) } />
					</td>
				</tr>
			);
		});
	}
	
	renderGroups() {
		return Object.keys(this.state.workflow_schedules).map( (group) => {
			return (
				<React.Fragment key={"group_"+group}>
					<tr className="group"><td colSpan="8">{group}</td></tr>
					{ this.renderWorkflowSchedules(this.state.workflow_schedules[group]) }
					{ this.renderSpacer(group) }
				</React.Fragment>
			);
		});
	}
	
	renderSpacer(group) {
		if(Object.keys(this.state.workflow_schedules)[Object.keys(this.state.workflow_schedules).length-1]==group)
			return;
		return (<tr className="groupspace"><td colSpan="8"></td></tr>);
	}
	
	render() {
		var actions = [
			{icon:'fa-file-o', title: "Create new workflow schedule", callback:this.editWorkflowSchedule}
		];
		
		return (
			<div className="evq-workflow-schedules-list">
				<Panel noborder left="" title="Workflow schedules" actions={actions}>
					<table className="border">
						<thead>
							<tr>
								<th>Workflow</th>
								<th>On failure</th>
								<th>Node</th>
								<th>Host</th>
								<th>Last execution</th>
								<th>Next execution</th>
								<th>Status</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{ this.renderGroups() }
						</tbody>
					</table>
				</Panel>
			</div>
		);
	}
}
