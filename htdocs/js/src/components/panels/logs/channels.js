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
import {EditChannel} from '../../dialogs/logs/edit-channel.js';
import {CheckConfig} from '../../dialogs/logs/check-config.js';

export class Channels extends evQueueComponent {
	constructor(props) {
		super(props);
		
		this.state.channels = [];
		
		this.editChannel = this.editChannel.bind(this);
	}
	
	componentDidMount() {
		var api = {node:'*', group:'channels',action:'list'};
		this.Subscribe('CHANNEL_CREATED',api);
		this.Subscribe('CHANNEL_MODIFIED',api);
		this.Subscribe('CHANNEL_REMOVED',api,true);
	}
	
	evQueueEvent(response, ref) {
		let data = this.parseResponse(response);
		this.setState({channels: data.response});
	}
	
	editChannel(e, id) {
		Dialogs.open(EditChannel, {id: id});
	}
	
	checkConfig(e, id) {
		Dialogs.open(CheckConfig, {id: id});
	}
	
	removeChannel(e, id) {
		this.simpleAPI({
			group: 'channel',
			action: 'delete',
			attributes: {id: id}
		},"Channel removed", "Are you sure you want to remove this channel ?");
	}
	
	renderChannels() {
		return this.state.channels.map( (channel) => {
			return (
				<tr key={channel.name}>
					<td>{channel.name}</td>
					<td>{channel.group}</td>
					<td className="tdActions">
						<span className="faicon fa-edit" title="Edit channel" onClick={ (e) => this.editChannel(e, channel.id) } />
						<span className="faicon fa-check" title="Test configuration" onClick={ (e) => this.checkConfig(e, channel.id) } />
						<span className="faicon fa-remove" title="Remove channel" onClick={ (e) => this.removeChannel(e, channel.id) } />
					</td>
				</tr>
			);
		});
	}
	
	render() {
		var actions = [
			{icon:'fa-file-o', title: "Create new channel", callback:this.editChannel}
		];
		
		return (
			<div className="evq-channels-list">
				<Panel noborder left="" title="Channels" actions={actions}>
					<table className="border">
						<thead>
							<tr>
								<th>Name</th>
								<th style={{width: '10rem'}}>Group</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{ this.renderChannels() }
						</tbody>
					</table>
				</Panel>
			</div>
		);
	}
}
