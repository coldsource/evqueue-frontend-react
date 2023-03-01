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
import {EditNotificationPlugin} from '../../dialogs/notifications/edit-plugin.js';

export class ListNotificationPlugins extends evQueueComponent {
	constructor(props) {
		super(props);
		
		this.state.notification_types = [];
		
		this.syncBinaries = this.syncBinaries.bind(this);
	}
	
	componentDidMount() {
		var api = {node:'*', group:'notification_types',action:'list'};
		this.Subscribe('NOTIFICATION_TYPE_CREATED',api);
		this.Subscribe('NOTIFICATION_TYPE_REMOVED',api, true);
	}
	
	evQueueEvent(response) {
		let data = this.parseResponse(response,'/response/*');
		this.setState({notification_types: data.response});
	}
	
	unregister(id) {
		this.simpleAPI({
			group: 'notification_type',
			action: 'unregister',
			attributes: {id: id}
		}, "Plugin uninstalled", "Are you sure you want to remove this plugin ? All associated notifications will also be removed.");
	}
	
	editPlugin(id) {
		Dialogs.open(EditNotificationPlugin, {id: id, onSubmit: (values) => this.changeConfig(id, values) });
	}
	
	changeConfig(id, values) {
		this.simpleAPI({
			group: 'notification_type',
			action: 'set_conf',
			attributes: {id: id, content: btoa(JSON.stringify(values))}
		}, "Configuration saved");
	}
	
	syncBinaries() {
		this.simpleAPI({
			group: 'control',
			action: 'syncnotifications'
		}, "All notification plugins binaries synchronized");
	}
	
	renderList() {
		return this.state.notification_types.map((type) => {
			return (
				<tr key={type.id}>
					<td>{type.name}</td>
					<td className="center">{type.scope}</td>
					<td>{type.description}</td>
					<td className="tdActions">
						<span className="faicon fa-cogs" title="Edit configuration" onClick={ (e) => this.editPlugin(type.id) }/>
						<span className="faicon fa-remove" title="Remove this plugin" onClick={ (e) => this.unregister(type.id) }/>
					</td>
				</tr>
			);
		});
	}
	
	render() {
		let actions = [
			{icon:'fa-download', title: "Sync plugins binaries to disk", callback:this.syncBinaries}
		];
		
		return (
			<div className="evq-notification-types-list">
				<Panel noborder left="" title="Notification plugins" actions={actions}>
					<table className="border">
						<thead>
							<tr>
								<th>Name</th>
								<th>Scope</th>
								<th>Description</th>
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
