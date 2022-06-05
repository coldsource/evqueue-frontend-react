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
import {Panel} from '../../../ui/panel.js';
import {Dialogs} from '../../../ui/dialogs.js';
import {EditChannelGroup} from '../../dialogs/logs/edit-channel-group.js';

export class ChannelGroups extends evQueueComponent {
	constructor(props) {
		super(props);
		
		this.state.channelgroups = [];
		
		this.editChannelGroup = this.editChannelGroup.bind(this);
	}
	
	componentDidMount() {
		var api = {node:'*', group:'channel_groups',action:'list'};
		this.Subscribe('CHANNELGROUP_CREATED',api);
		this.Subscribe('CHANNELGROUP_MODIFIED',api);
		this.Subscribe('CHANNELGROUP_REMOVED',api,true);
	}
	
	evQueueEvent(response, ref) {
		let data = this.parseResponse(response);
		this.setState({channelgroups: data.response});
	}
	
	editChannelGroup(e, id) {
		Dialogs.open(EditChannelGroup, {id: id});
	}
	
	removeChannel(e, id) {
		this.simpleAPI({
			group: 'channel_group',
			action: 'delete',
			attributes: {id: id}
		},"Channel group removed", "Are you sure you want to remove this channel ? All channels in this group will also be removed.");
	}
	
	renderChannelGroups() {
		return this.state.channelgroups.map( (channelgroup) => {
			return (
				<tr key={channelgroup.name}>
					<td>{channelgroup.name}</td>
					<td className="tdActions">
						<span className="faicon fa-edit" title="Edit channel group" onClick={ (e) => this.editChannelGroup(e, channelgroup.id) } />
						<span className="faicon fa-remove" title="Remove channel group" onClick={ (e) => this.removeChannel(e, channelgroup.id) } />
					</td>
				</tr>
			);
		});
	}
	
	render() {
		var actions = [
			{icon:'fa-file-o', title: "Create new channel group", callback:this.editChannelGroup}
		];
		
		return (
			<div className="evq-channels-list">
				<Panel noborder left="" title="Channel groups" actions={actions}>
					<table className="border">
						<thead>
							<tr>
								<th>Name</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{ this.renderChannelGroups() }
						</tbody>
					</table>
				</Panel>
			</div>
		);
	}
}
