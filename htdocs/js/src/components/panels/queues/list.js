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
import {EditQueue} from '../../dialogs/queues/edit.js';

export class QueuesList extends evQueueComponent {
	constructor(props) {
		super(props);
		
		this.state.queues = [];
		this.state.queue_workflows = {};
		
		this.editQueue = this.editQueue.bind(this);
	}
	
	componentDidMount() {
		var api = {node:'*', group:'queuepool',action:'list', ref: 'queues'};
		this.Subscribe('QUEUE_CREATED',api);
		this.Subscribe('QUEUE_MODIFIED',api);
		this.Subscribe('QUEUE_REMOVED',api,true);
		
		var api = {node:'*', group:'workflows',action:'list', attributes: {full: 'yes'}, ref: 'workflows'};
		this.Subscribe('WORKFLOW_CREATED',api);
		this.Subscribe('WORKFLOW_MODIFIED',api);
		this.Subscribe('WORKFLOW_REMOVED',api,true);
	}
	
	evQueueEvent(response, ref) {
		if(ref=='queues')
		{
			let data = this.parseResponse(response);
			this.setState({queues: data.response});
		}
		
		if(ref=='workflows')
		{
			let queue_workflows = {};
			
			let workflows = this.parseResponse(response).response;
			
			let workflow_ite = response.evaluate('/response/workflow', response.documentElement);
			let workflow_node;
			while(workflow_node = workflow_ite.iterateNext())
			{
				let workflow_id = workflow_node.getAttribute('id');
				let workflow_name = workflow_node.getAttribute('name');
				
				let queue_ite = response.evaluate('.//task/@queue', workflow_node);
				let queue_node;
				while(queue_node = queue_ite.iterateNext())
				{
					let queue = queue_node.nodeValue;
					if(queue_workflows[queue]===undefined)
						queue_workflows[queue] = {};
					
					if(queue_workflows[queue][workflow_id]===undefined)
						queue_workflows[queue][workflow_id] = {name: workflow_name, id: workflow_id, tasks: 1};
					else
						queue_workflows[queue][workflow_id].tasks++;
				}
			}
			
			this.setState({queue_workflows: queue_workflows});
		}
	}
	
	editQueue(e, id) {
		Dialogs.open(EditQueue, {id: id});
	}
	
	removeQueue(e, id) {
		this.simpleAPI({
			group: 'queue',
			action: 'delete',
			attributes: {id: id}
		},"Queue removed", "Are you sure you want to remove this queue ?");
	}
	
	renderQueueWorkflows(queue) {
		if(this.state.queue_workflows[queue.name]===undefined)
			return;
		
		return Object.keys(this.state.queue_workflows[queue.name]).map( (id) => {
			let workflow = this.state.queue_workflows[queue.name][id];
			let title = workflow.tasks==1?"1 task is using this queue":workflow.tasks+" tasks are using this queue";
			
			return (
				<span key={workflow.name} title={title} onClick={ (e) => App.changeURL('/workflow-editor?id='+workflow.id) }>{workflow.name}</span>
			);
		});
	}
	
	renderQueues() {
		return this.state.queues.map( (queue) => {
			let remove_title = "Remove queue";
			let remove_onclick = (e) => this.removeQueue(e, queue.id);
			let remove_class = "";
			if(this.state.queue_workflows[queue.name]!==undefined)
			{
				remove_title = "Cannot remove used queue";
				remove_onclick = undefined;
				remove_class = "disabled";
			}
			
			return (
				<tr key={queue.name}>
					<td>{queue.name}</td>
					<td>{ this.renderQueueWorkflows(queue) }</td>
					<td>{queue.scheduler}</td>
					<td>{queue.concurrency}</td>
					<td>{queue.dynamic}</td>
					<td className="tdActions">
						<span className="faicon fa-edit" title="Edit queue" onClick={ (e) => this.editQueue(e, queue.id) } />
						<span className={"faicon fa-remove "+remove_class} title={remove_title} onClick={remove_onclick } />
					</td>
				</tr>
			);
		});
	}
	
	render() {
		var actions = [
			{icon:'fa-file-o', title: "Create new queue", callback:this.editQueue}
		];
		
		return (
			<div className="evq-queues-list">
				<Panel noborder left="" title="Queues" actions={actions}>
					<table className="border">
						<thead>
							<tr>
								<th>Name</th>
								<th>Workflows using queue</th>
								<th>Scheduler</th>
								<th>Concurrency</th>
								<th>Dynamic</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{ this.renderQueues() }
						</tbody>
					</table>
				</Panel>
			</div>
		);
	}
}
