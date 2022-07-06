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

import {App} from './app.js';
import {evQueueComponent} from './evqueue-component.js';

export class NotificationsHandler extends evQueueComponent {
	constructor(props) {
		super(props);
		
		this.evQueueEventELogs = this.evQueueEventELogs.bind(this);
		this.evQueueEventInstance = this.evQueueEventInstance.bind(this);
	}
	
	 componentDidMount() {
		 if(App.wrap_context!='extension')
			 return;
		 
		let api = {node:'*', group:'alert_triggers',action:'list', attributes: {limit: 1}, required_modules: ['elogs']};
		this.Subscribe('ALERT_TRIGGER', api, false, 0, this.evQueueEventELogs);
		
		api = {node: '*', group: 'instances', action: 'list', attributes: {limit: 1}};
		this.Subscribe('INSTANCE_TERMINATED', api, false, 0, this.evQueueEventInstance);
	}
	
	evQueueEventELogs(data) {
		let env = window.localStorage.getItem('env');
		if(App.global.clusters_config[env].disable_notifications===true)
			return;
		
		let trigger = this.parseResponse(data).response[0];
		
		let filters = JSON.parse(trigger.filters);
		
		filters.dt_inf = trigger.start.substr(0, 10);
		filters.hr_inf = trigger.start.substr(10);
		filters.filter_emitted_from = trigger.start;
		filters.dt_sup = trigger.date.substr(0, 10);
		filters.hr_sup = trigger.date.substr(10);
		filters.filter_emitted_until = trigger.date;
		
		App.wrapper.permissions.contains({permissions: ['notifications']}, granted => {
			if(!granted)
				return;
			
			App.wrapper.notifications.onClicked.addListener(e => { 
				if(e=='elogs-alert')
				{
					App.changeURL('?loc=elogs-search', filters);
					
					App.wrapper.tabs.getCurrent(t => App.wrapper.tabs.update(t.id, {active: true}));
				}
			});
			
			App.wrapper.notifications.create("elogs-alert", {
				"type": "basic",
				"iconUrl": App.wrapper.runtime.getURL("htdocs/images/favicon-48x48.png"),
				"title": "ELogs alert",
				"message": trigger.alert_name
			});
		});
	}
	
	evQueueEventInstance(data) {
		let env = window.localStorage.getItem('env');
		if(App.global.clusters_config[env].disable_notifications===true)
			return;
		
		let instance = this.parseResponse(data).response[0];
		if(instance.errors==0)
			return;
		
		App.wrapper.permissions.contains({permissions: ['notifications']}, granted => {
			if(!granted)
				return;
			
			App.wrapper.notifications.onClicked.addListener(e => { 
				if(e=='instance')
					App.changeURL('?loc=home', {filter_id: instance.id});
				
					App.wrapper.tabs.getCurrent(t => App.wrapper.tabs.update(t.id, {active: true}));
			});
			
			App.wrapper.notifications.create("instance", {
				"type": "basic",
				"iconUrl": App.wrapper.runtime.getURL("htdocs/images/favicon-48x48.png"),
				"title": "Workflow instance error",
				"message": instance.name
			});
		});
	}
	
	render() {
		return null;
	}
}
