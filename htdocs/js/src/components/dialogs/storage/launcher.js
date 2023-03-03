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
import {Select} from '../../../ui/select.js';

import {evQueueComponent} from '../../base/evqueue-component.js';

export class Launcher extends evQueueComponent {
	constructor(props) {
		super(props);
		
		this.state.launcher_name = '';
		this.state.launcher_description = '';
		this.state.workflow_name = '';
		this.state.user = '';
		this.state.host = '';
		this.state.parameters = {};
		this.state.variables = {};
		this.state.parameters_values = {};
		this.state.user_value = '';
		this.state.host_value = '';
		
		this.dlg = React.createRef();
		
		this.change_remote = this.change_remote.bind(this);
		this.change_param = this.change_param.bind(this);
		this.launch = this.launch.bind(this);
	}
	
	get_variable(path, variables) {
		if(path=='')
			return Promise.resolve();
		
		return this.API({
			group: 'storage',
			action: 'get',
			attributes: {path: path}
		}).then(response => {
			variables[path] = this.parseResponse(response);
			variables[path].value = JSON.parse(variables[path].value);
		});
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
				let workflow_id = launcher.workflow_id;
				this.API({
					group: 'workflow',
					action: 'get',
					attributes: {id: workflow_id}
				}).then( response => {
					let workflow = this.parseResponse(response).response[0];
					let parameters = JSON.parse(launcher.parameters);
					let user = launcher.user;
					let host = launcher.host;
					
					let variables = {};
					let promises = [];
					for(const [param, path] of Object.entries(parameters))
					{
						let promise = this.get_variable(path, variables);
						promises.push(promise);
					}
					
					promises.push(this.get_variable(launcher.user, variables));
					promises.push(this.get_variable(launcher.host, variables));
					
					Promise.all(promises).then(() => {
						// Set parameters that are bound to unique value variables
						let parameters_values = {};
						let var_set = 0;
						for(const [param, path] of Object.entries(parameters))
						{
							if(variables[path]===undefined)
								continue;
							
							let variable = variables[path];
							if(variable.structure=='NONE')
							{
								parameters_values[param] = variable.value;
								var_set++;
							}
						}
						
						let user_value = '';
						if(variables[user]!==undefined && variables[user].structure=='NONE')
						{
							user_value = variables[user].value;
							var_set++;
						}
							
						let host_value = '';
						if(variables[host]!==undefined && variables[host].structure=='NONE')
						{
							host_value = variables[host].value;
							var_set++;
						}
						
						this.setState({
							launcher_name: launcher.name,
							launcher_description: launcher.description,
							workflow_name: workflow.name,
							variables: variables,
							user: user,
							host: host,
							user_value: user_value,
							host_value: host_value,
							parameters: parameters,
							parameters_values: parameters_values
						}, () => {
							// If we managed to set all variables, we can lanch NOW !
							if(var_set==Object.keys(parameters).length + 2)
							{
								this.launch();
								return;
							}
						});
					}).catch(ret => {
						App.warning("Some variables could not be found, please correct launcher");
						this.dlg.current.close();
					});
				});
			});
		}
	}
	
	change_remote(e) {
		let state = this.state;
		state[e.target.name + '_value'] = e.target.value;
		this.setState(state);
	}
	
	change_param(e) {
		let params = this.state.parameters_values;
		params[e.target.name] = e.target.value;
		this.setState({parameters_values: params});
	}
	
	launch() {
		this.simpleAPI({
			group: 'instance',
			action: 'launch',
			attributes: {name: this.state.workflow_name, user: this.state.user_value, host: this.state.host_value},
			parameters: this.state.parameters_values
		}, "Instance launched").then( () => {
			this.dlg.current.close();
		});
	}
	
	renderVariable(name, value, path, onchange) {
		if(path=='')
		{
			return (
				<div key={name}>
					<label>{name}</label>
					<input type="text" name={name} value={value} onChange={onchange} />
				</div>
			);
		}
		
		let variable = this.state.variables[path];
		
		if(variable.structure=='NONE')
		{
			return (
				<div key={name}>
					<label>{name}</label>
					<span><b>{variable.value!=''?variable.value:(<i>empty</i>)}</b></span>
				</div>
			);
		}
		
		let values = [];
		if(variable.structure=='ARRAY')
		{
			for(let i=0;i<variable.value.length;i++)
				values.push({name: variable.value[i], value: variable.value[i]});
		}
		else if(variable.structure=='MAP')
		{
			for(const [key, value] of Object.entries(variable.value))
				values.push({name: key, value: value});
		}
		
		return (
			<div key={name}>
				<label>{name}</label>
				<Select name={name} value={value} values={values} onChange={onchange} />
			</div>
		);
	}
	
	renderParameters() {
		return Object.keys(this.state.parameters).map(param => {
			let path = this.state.parameters[param];
			return this.renderVariable(param, this.state.parameters_values[param], path, this.change_param);
		});
	}
	
	render() {
		return (
			<Dialog ref={this.dlg} title={"Quick launcher " + this.state.launcher_name} width="700">
				<h2>
					{this.state.workflow_name}
					<Help>
						{this.state.launcher_description}
					</Help>
				</h2>
				<div className="formdiv">
					{this.renderVariable('user', this.state.user_value,  this.state.user, this.change_remote)}
					{this.renderVariable('host', this.state.host_value,  this.state.host, this.change_remote)}
					{this.renderParameters()}
				</div>
				<button className="submit" onClick={this.launch}>Launch new workflow instance</button>
			</Dialog>
		);
	}
}
