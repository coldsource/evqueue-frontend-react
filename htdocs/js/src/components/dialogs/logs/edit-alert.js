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
import {Dialogs} from '../../../ui/dialogs.js';
import {Prompt} from '../../../ui/prompt.js';
import {Help} from '../../../ui/help.js';
import {Tabs} from '../../../ui/tabs.js';
import {Tab} from '../../../ui/tab.js';
import {Checkbox} from '../../../ui/checkbox.js';
import {InputSpinner} from '../../../ui/input-spinner.js';
import {Select} from '../../../ui/select.js';
import {FieldTypeSelector} from '../../base/field-type-selector.js';
import {evQueueComponent} from '../../base/evqueue-component.js';
import {ELogsFilters} from '../../panels/logs/elogs-filters.js';

export class EditAlert extends evQueueComponent {
	constructor(props) {
		super(props);
		
		this.state.alert = {
			name: '',
			description: '',
			filters: {},
			occurrences: 1,
			period: 1,
			groupby: '',
			notifications: {}
		};
		
		this.state.group_fields = {};
		this.state.channel_fields = {};
		this.state.notifications = [];
		
		this.dlg = React.createRef();
		
		this.onChange = this.onChange.bind(this);
		this.filterChange = this.filterChange.bind(this);
		this.save = this.save.bind(this);
		
	}
	
	componentDidMount() {
		this.API({
			group: 'notifications',
			action: 'list',
			attributes: {scope: 'ELOGS'}
		}).then(data => {
			let notifications = this.parseResponse(data).response;
			
			let alert = this.state.alert;
			for(let i=0;i<notifications.length;i++)
				alert.notifications[notifications[i].id] = false;
			
			this.setState({alert: alert, notifications: notifications});
		});
		
		if(this.props.id)
		{
			this.API({
				group: 'alert',
				action: 'get',
				attributes: {id: this.props.id}
			}).then(data => {
				let alert = this.parseResponse(data, "/response/notification/@id");
				
				let filters = JSON.parse(alert.filters);
				
				let notifications = {};
				for(let i=0;i<alert.response.length;i++)
					notifications[alert.response[i]] =true;
				
				let alertconf = {
					name: alert.name,
					description: alert.description,
					occurrences: alert.occurrences,
					period: alert.period,
					groupby: alert.groupby,
					filters: filters,
					notifications: notifications
				};
				
				this.setState({alert: alertconf});
				
				if(filters.filter_group)
				{
					this.API({
						group: 'channel_group',
						action: 'get',
						attributes: {id: filters.filter_group}
					}).then( (response) => {
							let data = this.parseResponse(response);
							
							let group_fields = {};
							for(let i=0;i<data.response.length;i++)
								group_fields[data.response[i].name] = data.response[i].type;
							
							this.setState({group_fields: group_fields});
					});
				}
				
				if(filters.filter_channel)
				{
					this.API({
							group: 'channel',
							action: 'get',
							attributes: {id: filters.filter_channel}
					}).then( (response) => {
							let data = this.parseResponse(response);
							
							let channel_fields = {};
							for(let i=0;i<data.response.length;i++)
								channel_fields[data.response[i].name] = data.response[i].type;
							
							this.setState({channel_fields: channel_fields});
					});
				}
			});
		}
	}
	
	onChange(e) {
		let name = e.target.name;
		let value = e.target.value;
		
		let alert = this.state.alert;
		
		if(name.substr(0, 13)=='notification_')
		{
			let id = name.substr(13);
			alert.notifications[id] = value;
			
		}
		else
			alert[name] = value;
		
		this.setState({alert: alert});
	}
	
	filterChange(filters, group_fields, channel_fields) {
		let alert = this.state.alert;
		alert.filters = filters;
		this.setState({alert: alert, group_fields: group_fields, channel_fields: channel_fields});
	}
	
	renderGroupBySelect() {
		let values = [
			{name: 'None', value: '', group: "General"},
			{name: 'crit', value: 'crit', group: "General"}
		];
		
		for(const field in this.state.group_fields)
		{
			if(this.state.group_fields[field]!='TEXT')
				values.push({name: field, value: 'group_'+field, group: "Group fields"});
		}
		
		for(const field in this.state.channel_fields)
		{
			if(this.state.channel_fields[field]!='TEXT')
				values.push({name: field, value: 'channel_'+field, group: "Channel fields"});
		}
		
		return (<Select name="groupby" values={values} value={this.state.alert.groupby} filter={false} onChange={this.onChange} />);
	}
	
	save() {
		let action = this.props.id?'edit':'create';
		let action_name = this.props.id?'modified':'created';
		
		let alert = this.state.alert;
		
		let attributes = {
			name: alert.name,
			description: alert.description,
			occurrences: alert.occurrences,
			period: alert.period,
			groupby: alert.groupby,
			filters: JSON.stringify(alert.filters),
			notifications: JSON.stringify(alert.notifications)
		};
		
		if(this.props.id)
			attributes.id = this.props.id;
		
		this.simpleAPI({
			group: 'alert',
			action: action,
			attributes: attributes
		}, "Alert successfully "+action_name).then( () => {
			this.dlg.current.close();
		});
	}
	
	renderNotifications() {
		return this.state.notifications.map(notif => {
			return (
				<div key={notif.id}>
					<label>{notif.name}</label>
					<Checkbox name={"notification_"+notif.id} value={this.state.alert.notifications[notif.id]} onChange={this.onChange} />
				</div>
			);
		});
	}
	
	render() {
		let alert = this.state.alert;
		let title = this.props.id?"Edit alert « "+alert.name+" »":"Create new alert";
		let submit = this.props.id?"Edit alert":"Create alert";
		
		return (
			<Dialog ref={this.dlg} title={title} width="700">
				<Tabs>
					<Tab title="Name">
						<h2>
							Name
							<Help>
								Here you can simply name your alert.
							</Help>
						</h2>
						<div className="formdiv">
							<div>
								<label>Name</label>
								<input type="text" name="name" value={alert.name} onChange={this.onChange} />
							</div>
							<div>
								<label>Description</label>
								<input type="text" name="description" value={alert.description} onChange={this.onChange} />
							</div>
						</div>
					</Tab>
					<Tab title="Filters">
						<h2>
							Filters
							<Help>
								Alerts will allow you to call notification plugins when specific logs are matched. Here you will be able to configure this filters that will be used to check which logs match your criteria.
							</Help>
						</h2>
						<ELogsFilters filters={this.state.alert.filters} panel={false} datefilter={false} onChange={this.filterChange} />
					</Tab>
					<Tab title="Trigger">
						<h2>
							Trigger
							<Help>
								This will determine the amount of matched logs per period time (in minutes) that will trigger the alert.<br/><br/>You can group logs by a specific field (depending of the chosen group or channel) to count logs that have the same specific field, e.g. match logs per IP per minute.
							</Help>
						</h2>
						<div className="formdiv">
							<div>
								<label>Occurrences</label>
								<InputSpinner type="text" name="occurrences" value={alert.occurrences} onChange={this.onChange} min="1" />
							</div>
							<div>
								<label>Time period (minutes)</label>
								<InputSpinner type="text" name="period" value={alert.period} onChange={this.onChange} min="1" />
							</div>
							<div>
								<label>Group by</label>
								{this.renderGroupBySelect()}
							</div>
						</div>
					</Tab>
					<Tab title="Notifications">
						<h2>
							Notifications
							<Help>
								Determine which notification will be sent when the alert is triggered.
							</Help>
						</h2>
						<div className="formdiv">
							{this.renderNotifications()}
						</div>
					</Tab>
				</Tabs>
				<button className="submit" onClick={this.save}>{submit}</button>
			</Dialog>
		);
	}
}
