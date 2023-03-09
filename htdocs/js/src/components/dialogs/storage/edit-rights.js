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
import {Checkbox} from '../../../ui/checkbox.js';
import {evQueueComponent} from '../../base/evqueue-component.js';

export class EditUserRights extends evQueueComponent {
	constructor(props) {
		super(props);
		
		this.state.rights = {};
		this.state.launchers = [];
		
		this.dlg = React.createRef();
	}
	
	componentDidMount() {
		this.API({
			group: 'launchers',
			action: 'list'
		}).then( (response) => {
			let launchers = this.xpath('/response/launcher', response.documentElement);
			
			let rights = {};
			for(let i=0;i<launchers.length;i++)
				rights[launchers[i].id] = false;
			
			this.API({
				group: 'user',
				action: 'list_module_rights',
				attributes: {id: this.props.id, module: 'storage', type: 'launcher'}
			}).then( (response) => {
				let r = this.xpath('/response/right', response.documentElement);
				for(let i=0;i<r.length;i++)
					rights[r[i]['object-id']] = r[i].right=='yes';
				
				this.setState({launchers: launchers, rights: rights});
			});
		});
	}
	
	changeRight(e, launcher_id) {
		let value = e.target.value;
		
		let rights = this.state.rights;
		rights[launcher_id] = value;
		
		let msg = value?"Access granted":"Access revoked";
		let action = value?'grant':'revoke';
		
		this.simpleAPI({
			group: 'launcher',
			action: action,
			attributes: {
				user_id: this.props.id,
				launcher_id: launcher_id
			}
		}, msg);
		
		this.setState({rights: rights});
	}
	
	renderLaunchers() {
		return this.state.launchers.map( (launcher) => {
			let right = this.state.rights[launcher.id];
			return (
				<tr key={launcher.id}>
					<td>{launcher.name}</td>
					<td>
						<Checkbox name="read" value={right} onChange={ (e) => this.changeRight(e, launcher.id) } />
					</td>
				</tr>
			);
		});
	}
	
	render() {
		return (
			<Dialog ref={this.dlg} title="Access rights management" width="700">
				<div className="evq-user-edit-rights">
					<h2>
						User access rights
						<Help>
							You can control which users can use launchers.
							<br />
							<br />Users will be able to use launcher if you give access here, even if they do not have exec permission on the underlying workflow. They must have the read permission.
						</Help>
					</h2>
					<table className="hover">
						<thead>
							<tr>
								<th className="left">Launcher</th>
								<th>Can use</th>
							</tr>
						</thead>
						<tbody>
							{this.renderLaunchers()}
						</tbody>
					</table>
				</div>
			</Dialog>
		);
	}
}
