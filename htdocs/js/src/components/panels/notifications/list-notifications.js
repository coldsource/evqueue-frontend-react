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
import {EditNotification} from '../../dialogs/notifications/edit-notification.js';

export class ListNotifications extends evQueueComponent {
	constructor(props) {
		super(props);
		
		this.state.types = {};
		this.state.notifications = [];
	}
	
	componentDidMount() {
		var api = {node:'*', group:'notifications',action:'list', ref:'notif'};
		this.Subscribe('NOTIFICATION_CREATED',api);
		this.Subscribe('NOTIFICATION_MODIFIED',api);
		this.Subscribe('NOTIFICATION_REMOVED',api, true);
		
		var api = {node:'*', group:'notification_types',action:'list', ref:'plugin'};
		this.Subscribe('NOTIFICATION_TYPE_CREATED',api);
		this.Subscribe('NOTIFICATION_TYPE_REMOVED',api, true);
	}
	
	evQueueEvent(response, ref) {
		if(ref=='notif')
		{
			let data = this.parseResponse(response,'/response/*');
			this.setState({notifications: data.response});
		}
		
		if(ref=='plugin')
		{
			let data = this.parseResponse(response,'/response/*');
			let types = {};
			for(let i=0;i<data.response.length;i++)
				types[data.response[i].id] = data.response[i].name;
			
			this.setState({types: types});
		}
	}
	
	editNotification(e, type_id, id) {
		Dialogs.open(EditNotification, {type_id: type_id, id: id});
	}
	
	remove(id) {
		this.simpleAPI({
			group: 'notification',
			action: 'delete',
			attributes: {id: id}
		}, "Notification removed", "Are you sure you want to remove this notification ? All associated workflows will be unsubscribed.");
	}
	
	renderList() {
		return this.state.notifications.map((notification) => {
			let type = notification.type_id;
			if(this.state.types[notification.type_id]!==undefined)
				type = this.state.types[notification.type_id];
			
			return (
				<tr key={notification.id}>
					<td className="center">{type}</td>
					<td className="center">{notification.scope}</td>
					<td>{notification.name}</td>
					<td className="tdActions">
						<span className="faicon fa-cogs" title="Edit configuration" onClick={ (e) => this.editNotification(e, notification.type_id, notification.id) }/>
						<span className="faicon fa-remove" title="Remove this plugin" onClick={ (e) => this.remove(notification.id) }/>
					</td>
				</tr>
			);
		});
	}
	
	render() {
		let actions = [
			{icon:'fa-file-o', title: "Create new notification", callback:this.editNotification}
		];
		
		return (
			<div className="evq-notification-list">
				<Panel noborder left="" title="Notifications" actions={actions}>
					<table className="border">
						<thead>
							<tr>
								<th style={{width: '16rem'}}>Type</th>
								<th style={{width: '10rem'}}>Scope</th>
								<th>Name</th>
								<th className="tdActions">Actions</th>
							</tr>
						</thead>
						<tbody>
							{ this.renderList() }
						</tbody>
					</table>
				</Panel>
			</div>
		);
	}
}
