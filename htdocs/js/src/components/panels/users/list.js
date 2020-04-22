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
import {EditUser} from '../../dialogs/users/edit.js';
import {EditUserRights} from '../../dialogs/users/edit-rights.js';

export class UsersList extends evQueueComponent {
	constructor(props) {
		super(props);
		
		this.state.users = [];
		
		this.editUser = this.editUser.bind(this);
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
	
	editUser(e, id) {
		Dialogs.open(EditUser, {id: id});
	}
	
	editUserRights(e, id) {
		Dialogs.open(EditUserRights, {id: id});
	}
	
	removeUser(e, id) {
		this.simpleAPI({
			group: 'user',
			action: 'delete',
			attributes: {id: id}
		},"User removed", "Are you sure you want to remove this user ?");
	}
	
	renderUsers() {
		return this.state.users.map( (user) => {
			return (
				<tr key={user.name}>
					<td>{user.name}</td>
					<td>{user.profile}</td>
					<td className="tdActions">
						{ user.profile=='USER' ? (<span className="faicon fa-id-card-o" title="Edit user access rights" onClick={ (e) => this.editUserRights(e, user.id) } />) : '' }
						<span className="faicon fa-edit" title="Edit user" onClick={ (e) => this.editUser(e, user.id) } />
						<span className="faicon fa-remove" title="Remove user" onClick={ (e) => this.removeUser(e, user.id) } />
					</td>
				</tr>
			);
		});
	}
	
	render() {
		var actions = [
			{icon:'fa-file-o', title: "Create new user", callback:this.editUser}
		];
		
		return (
			<div className="evq-users-list">
				<Panel noborder left="" title="Users" actions={actions}>
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
