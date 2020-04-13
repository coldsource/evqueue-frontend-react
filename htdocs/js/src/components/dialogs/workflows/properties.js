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
import {Help} from '../../../ui/help.js';
import {Checkbox} from '../../../ui/checkbox.js';
import {Dialog} from '../../../ui/dialog.js';
import {Dialogs} from '../../../ui/dialogs.js';
import {Tabs} from '../../../ui/tabs.js';
import {Tab} from '../../../ui/tab.js';
import {Prompt} from '../../../ui/prompt.js';
import {GroupAutocomplete} from '../../base/group-autocomplete.js';

export class WorkflowProperties extends evQueueComponent {
	constructor(props) {
		super(props);
		
		this.state.notifications = [];
		this.state.notification_types = {};
		this.state.wf_notifications = {};
		
		this.addParameter = this.addParameter.bind(this);
		this.removeParameter = this.removeParameter.bind(this);
		
		this.changeSubscription = this.changeSubscription.bind(this);
	}
	
	componentDidMount() {
		var api = {node:'*', group:'notifications',action:'list', ref:'notif'};
		this.Subscribe('NOTIFICATION_CREATED',api);
		this.Subscribe('NOTIFICATION_MODIFIED',api);
		this.Subscribe('NOTIFICATION_REMOVED',api, true);
		
		var api = {node:'*', group:'notification_types',action:'list', ref:'plugin'};
		this.Subscribe('NOTIFICATION_TYPE_CREATED',api);
		this.Subscribe('NOTIFICATION_TYPE_REMOVED',api, true);
		
		if(this.props.id)
		{
			var api = {node:'*', group:'workflow',action:'list_notifications', attributes: {id: this.props.id}, ref:'wf_notif'};
			this.Subscribe('WORKFLOW_SUBSCRIBED',api);
			this.Subscribe('WORKFLOW_UNSUBSCRIBED',api, true);
		}
	}
	
	componentDidUpdate(prevProps) {
		if(!prevProps.id && this.props.id)
		{
			var api = {node:'*', group:'workflow',action:'list_notifications', attributes: {id: this.props.id}, ref:'wf_notif'};
			this.Subscribe('WORKFLOW_SUBSCRIBED',api);
			this.Subscribe('WORKFLOW_UNSUBSCRIBED',api, true);
		}
	}
	
	evQueueEvent(response, ref) {
		if(ref=='notif')
		{
			let data = this.parseResponse(response);
			this.setState({notifications: data.response});
		}
		
		if(ref=='plugin')
		{
			let data = this.parseResponse(response);
			let types = {};
			for(let i=0;i<data.response.length;i++)
				types[data.response[i].id] = data.response[i].name;
			
			this.setState({notification_types: types});
		}
		
		if(ref=='wf_notif')
		{
			let data = this.parseResponse(response);
			let wf_notifications = {};
			for(let i=0;i<data.response.length;i++)
				wf_notifications[data.response[i].id] = true;
			this.setState({wf_notifications: wf_notifications});
		}
	}
	
	changeSubscription(e) {
		let action = e.target.value?'subscribe_notification':'unsubscribe_notification';
		let msg = e.target.value?"Workflow subscribed to notification":"Workflow unsubscribed from notification";
		
		this.simpleAPI({
			group: 'workflow',
			action: action,
			attributes: { id: this.props.id, notification_id: e.target.name }
		}, msg);
	}
	
	triggerParametersChange(value) {
		let event = {
			target: {name: 'parameters', value: value }
		}
		
		this.props.onChange(event);
	}
	
	addParameter(e) {
		Dialogs.open(Prompt,{
			content: "Please enter your parameter's name",
			placeholder: "parameter name",
			width: 500,
			confirm: (name) => {
				let parameters = this.props.properties.parameters.concat();
				parameters.push(name);
				this.triggerParametersChange(parameters);
			}
		});
	}
	
	removeParameter(e, idx) {
		let parameters = this.props.properties.parameters.concat();
		parameters.splice(idx, 1);
		this.triggerParametersChange(parameters);
	}
	
	renderTabProperties() {
		let properties = this.props.properties;
		
		return (
			<div>
				<h2>
					Workflow properties
					<Help>
						Name is mandatory, this will be used from API to launch a new instance.
						<br /><br />
						Comment and group are optional, they are only used to classify workflows in interface.
					</Help>
				</h2>
				<div className="formdiv">
					<div>
						<label>Name</label>
						<input type="text" name="name" value={properties.name} onChange={this.props.onChange} />
					</div>
					<div>
						<label>Group</label>
						<GroupAutocomplete type="text" name="group" value={properties.group} onChange={this.props.onChange} />
					</div>
					<div>
						<label>Comment</label>
						<input type="text" name="comment" value={properties.comment} onChange={this.props.onChange} />
					</div>
				</div>
			</div>
		);
	}
	
	renderTabParameters() {
		return (
			<div>
				<h2>
					Parameters
					<Help>
						Workflow parameters are provided when a new instance is launched. These parameters can be used in XPath expressions and provided as input to tasks.
					</Help>
				</h2>
				<div className="parameters">
					{ this.renderParameters() }
					<span className="faicon fa-plus" title="Add a new parameter" onClick={ (e) => this.addParameter(e) } />
				</div>
			</div>
		);
	}
	
	renderParameters() {
		let parameters = this.props.properties.parameters;
		
		return parameters.map( (parameter, idx) => {
			return (
				<div key={parameter}>
					<span className="faicon fa-remove" title="Remomve this parameters" onClick={ (e) => this.removeParameter(e, idx) } />
					&#160;
					{parameter}
				</div>
			);
		});
	}
	
	renderTabNotifications() {
		if(!this.props.id)
			return (<div className="error center">You must save workflow before subscribing to notifications</div>);
		
		return (
			<div>
				<h2>
					Notifications
					<Help>
						Notifications are used to send reports on workflow end.
						<br /><br />
						You can install plugins that send emails, SMS...
					</Help>
				</h2>
				<table className="hover">
					<thead>
						<tr>
							<th style={{width: '10rem'}}>Type</th>
							<th>Name</th>
							<th style={{width: '20px'}} />
						</tr>
					</thead>
					<tbody>
						{ this.renderNotificationsList() }
					</tbody>
				</table>
			</div>
		);
	}
	
	renderNotificationsList() {
		return this.state.notifications.map((notification) => {
			let type = notification.type_id;
			if(this.state.notification_types[notification.type_id]!==undefined)
				type = this.state.notification_types[notification.type_id];
			
			return (
				<tr key={notification.id}>
					<td>{type}</td>
					<td>{notification.name}</td>
					<td><Checkbox name={notification.id} value={this.state.wf_notifications[notification.id]!==undefined} onChange={this.changeSubscription}/></td>
				</tr>
			);
		});
	}
	
	renderTabCustomFilters() {
	}
	
	render() {
		return (
			<Dialog title="Edit workflow" width="800" onClose={this.props.onClose}>
				<div className="evq-workflow-properties">
					<Tabs>
						<Tab title="Properties">
							{ this.renderTabProperties() }
						</Tab>
						<Tab title="Parameters">
							{ this.renderTabParameters() }
						</Tab>
						<Tab title="Notifications">
							{ this.renderTabNotifications() }
						</Tab>
						<Tab title="Custom filters">
							{ this.renderTabCustomFilters() }
						</Tab>
					</Tabs>
				</div>
			</Dialog>
		);
	}
}
