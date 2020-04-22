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
import {Dialog} from '../../../ui/dialog.js';
import {Help} from '../../../ui/help.js';
import {Checkbox} from '../../../ui/checkbox.js';
import {evQueueComponent} from '../../base/evqueue-component.js';

export class EditUserRights extends evQueueComponent {
	constructor(props) {
		super(props);
		
		this.state.rights = {};
		this.state.workflows = [];
		
		this.dlg = React.createRef();
	}
	
	componentDidMount() {
		this.API({
			group: 'workflows',
			action: 'list'
		}).then( (response) => {
			let workflows = this.xpath('/response/workflow', response.documentElement);
			
			let rights = {};
			for(let i=0;i<workflows.length;i++)
				rights[workflows[i].id] = {edit: false, read: false, exec: false, kill: false};
			
			this.API({
				group: 'user',
				action: 'list_rights',
				attributes: {id: this.props.id}	
			}).then( (response) => {
				let r = this.xpath('/response/right', response.documentElement);
				for(let i=0;i<r.length;i++)
				{
					rights[r[i]['workflow-id']] = {
						read: r[i].read=='yes',
						edit: r[i].edit=='yes',
						exec: r[i].exec=='yes',
						kill: r[i].kill=='yes'
					};
				}
				
				this.setState({workflows: workflows, rights: rights});
			});
		});
	}
	
	changeRight(e, workflow_id, rights) {
		let name = e.target.name;
		let value = e.target.value;
		
		rights[name] = value;
		
		let msg = value?"Access granted":"Access revoked";
		
		this.simpleAPI({
			group: 'user',
			action: 'grant',
			attributes: {
				id: this.props.id,
				workflow_id: workflow_id,
				edit: rights.edit?'yes':'no',
				read: rights.read?'yes':'no',
				exec: rights.exec?'yes':'no',
				kill: rights.kill?'yes':'no'
			}
		}, msg);
		
		this.setState({rights: this.state.rights});
	}
	
	renderWorkflows() {
		return this.state.workflows.map( (workflow) => {
			let rights = this.state.rights[workflow.id];
			return (
				<tr key={workflow.id}>
					<td>{workflow.name}</td>
					<td>
						<Checkbox name="read" value={rights.read} onChange={ (e) => this.changeRight(e, workflow.id, rights) } />
					</td>
					<td>
						<Checkbox name="edit" value={rights.edit} onChange={ (e) => this.changeRight(e, workflow.id, rights) } />
					</td>
					<td>
						<Checkbox name="exec" value={rights.exec} onChange={ (e) => this.changeRight(e, workflow.id, rights) } />
					</td>
					<td>
						<Checkbox name="kill" value={rights.kill} onChange={ (e) => this.changeRight(e, workflow.id, rights) } />
					</td>
				</tr>
			);
		});
	}
	
	render() {
		return (
			<Dialog ref={this.dlg} title="Access rights management" width="700">
				<div className="evq-user-edit-rights">
					<h2>
						User access rights
						<Help>
							You can control which workflows users can access. Access rights control 4 aspects of workflows :
							<br />
							<br />Read: the ability to view the workflow or instances of this workflow.
							<br />Execute: allows to launch a new instance of the specified workflow. User must also have read access for interface to work.
							<br />Edit: allows to modify the workflow in the editor.
							<br />Kill: allow the user to kill an instance of this workflow.
							<br />
							<br />Other aspects of the interface require admin privileges.
						</Help>
					</h2>
					<table className="hover">
						<thead>
							<tr>
								<th>Workflow</th>
								<th>Read</th>
								<th>Edit</th>
								<th>Execute</th>
								<th>Kill</th>
							</tr>
						</thead>
						<tbody>
							{this.renderWorkflows()}
						</tbody>
					</table>
				</div>
			</Dialog>
		);
	}
}
