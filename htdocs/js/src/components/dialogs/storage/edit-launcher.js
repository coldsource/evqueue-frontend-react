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

import {Dialog} from '../../../ui/dialog.js';
import {Help} from '../../../ui/help.js';
import {Autocomplete} from '../../../ui/autocomplete.js';
import {WorkflowSelector} from '../../base/workflow-selector.js';
import {VariableAutocomplete} from '../../base/variable-autocomplete.js';

import {evQueueComponent} from '../../base/evqueue-component.js';

export class EditLauncher extends evQueueComponent {
	constructor(props) {
		super(props);
		
		this.state.launcher = {
			name: '',
			group: '',
			description: '',
			workflow_id: '',
			user: '',
			host: '',
			parameters: '',
		}
		
		this.dlg = React.createRef();
		
		this.onChange = this.onChange.bind(this);
		this.save = this.save.bind(this);
	}
	
	componentDidMount() {
		if(this.props.id)
		{
			this.API({
				group: 'launcher',
				action: 'get',
				attributes: {id: this.props.id}
			}).then( (response) => {
				let launcher = this.parseResponse(response);
				this.setState({launcher: {
					name: launcher.name,
					group: launcher.group,
					description: launcher.description,
					workflow_id: launcher.workflow_id,
					user: launcher.user,
					host: launcher.host,
					parameters: JSON.parse(launcher.parameters)
				}});
			});
		}
	}
	
	onChange(e) {
		let name = e.target.name;
		let value = e.target.value;
		
		let launcher = this.state.launcher;
		if(name=='workflow_id')
		{
			this.API({
				group: 'workflow',
				action: 'get',
				attributes: {id: value}
			}).then( response => {
				 let parameters = this.xpath('/response/workflow/workflow/parameters/parameter/@name', response.documentElement);
				 
				 let launcher = this.state.launcher;
				 launcher.parameters = {};
				 for(let i = 0;i<parameters.length;i++)
					 launcher.parameters[parameters[i]] = '';
				 this.setState({launcher: launcher});
			});
		}
		
		if(name.substr(0, 10)=='parameter_')
			launcher.parameters[name.substr(10)] = value;
		else
			launcher[name] = value;
		
		this.setState({launcher: launcher});
	}
	
	save() {
		let action_name = this.props.id?'changed':'created';
		let action = this.props.id?'edit':'create';
		
		let attributes = Object.assign({}, this.state.launcher);
		attributes.parameters = JSON.stringify(attributes.parameters);
		
		if(this.props.id)
			attributes.id = this.props.id
		
		this.simpleAPI({
			group: 'launcher',
			action: action,
			attributes: attributes
		}, "Launcher successfully "+action_name).then( () => {
			this.dlg.current.close();
		});
	}
	
	renderParameters() {
		let launcher = this.state.launcher;
		return Object.keys(launcher.parameters).map(param => {
			return (
				<div key={param}>
					<label>{param}</label>
					<VariableAutocomplete name={'parameter_' + param} value={launcher.parameters[param]} onChange={this.onChange} />
				</div>
			);
		});
	}
	
	render() {
		let launcher = this.state.launcher;
		let title = this.props.id?"Edit launcher « "+launcher.name+" »":"Create new launcher";
		let submit = this.props.id?"Edit launcher":"Create launcher";
		
		return (
			<Dialog ref={this.dlg} title={title} width="700">
				<h2>
					Launcher properties
					<Help>
						Launcher will allow you to simplify workflow launching. Choose a workflow you want to launch and assign variables to its parameters.
					</Help>
				</h2>
				<div className="formdiv">
					<div>
						<label>Name</label>
						<input type="text" name="name" value={launcher.name} onChange={this.onChange} />
					</div>
					<div>
						<label>Group</label>
						<Autocomplete name="group" value={launcher.group} autocomplete={this.props.groups} onChange={this.onChange} />
					</div>
					<div>
						<label>Description</label>
						<input type="text" name="description" value={launcher.description} onChange={this.onChange} />
					</div>
					<div>
						<label>Workflow</label>
						<WorkflowSelector name="workflow_id" value={launcher.workflow_id} onChange={this.onChange} />
					</div>
					<div>
						<label>User</label>
						<VariableAutocomplete name="user" value={launcher.user} onChange={this.onChange} />
					</div>
					<div>
						<label>Host</label>
						<VariableAutocomplete name="host" value={launcher.host} onChange={this.onChange} />
					</div>
					{this.renderParameters()}
				</div>
				<button className="submit" onClick={this.save}>{submit}</button>
			</Dialog>
		);
	}
}
