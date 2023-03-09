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
import {EditUserRights} from '../../dialogs/storage/edit-rights.js';

export class AccessList extends evQueueComponent {
	constructor(props) {
		super(props);
		
		this.state.users = [];
	}
	
	componentDidMount() {
		var api = {node:'*', group:'users',action:'list'};
		this.Subscribe('USER_CREATED',api);
		this.Subscribe('USER_MODIFIED',api);
		this.Subscribe('USER_REMOVED',api,true);
	}
	
	evQueueEvent(response, ref) {
		let data = this.parseResponse(response);
		this.setState({users: data.response});
	}
	
	editUserRights(e, id) {
		Dialogs.open(EditUserRights, {id: id});
	}
	
	renderUsers() {
		return this.state.users.map( (user) => {
			return (
				<tr key={user.name}>
					<td>{user.name}</td>
					<td>{user.profile}</td>
					<td className="tdActions">
						{ user.profile=='USER' ? (<span className="faicon fa-id-card-o" title="Edit user access rights" onClick={ (e) => this.editUserRights(e, user.id) } />) : '' }
					</td>
				</tr>
			);
		});
	}
	
	render() {
		return (
			<div className="evq-users-list">
				<Panel noborder left="" title="Users">
					<table className="border">
						<thead>
							<tr>
								<th>Login</th>
								<th>Profile</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{ this.renderUsers() }
						</tbody>
					</table>
				</Panel>
			</div>
		);
	}
}
