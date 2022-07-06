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
import {NodeSelector} from '../../base/node-selector.js';
import {Dialog} from '../../../ui/dialog.js';
import {Help} from '../../../ui/help.js';
import {Permission} from '../../../ui/permission.js';
import {evQueueComponent} from '../../base/evqueue-component.js';
import {CryptoJS} from '../../../evqueue/cryptojs/core.js';

export class EditUserPreferences extends evQueueComponent {
	constructor(props) {
		super(props);
		
		this.state.password = '';
		this.state.password2 = '';
		
		this.state.preferences = JSON.parse(window.localStorage.preferences);
		
		this.dlg = React.createRef();
		
		this.onChange = this.onChange.bind(this);
		this.save = this.save.bind(this);
	}
	
	onChange(e) {
		let name = e.target.name;
		let value = e.target.value;
		
		let preferences = this.state.preferences;
		preferences[name] = value;
		this.setState({preferences: preferences});
	}
	
	savePassword() {
		if(this.state.password=='')
			return Promise.resolve();
		
		return this.simpleAPI({
			group: 'user',
			action: 'change_password',
			attributes: {
				name: window.localStorage.user,
				password: this.state.password
			}
		}, "Password changed").then( () => {
			window.localStorage.password  = CryptoJS.SHA1(this.state.password).toString(CryptoJS.enc.Hex);
			return Promise.resolve();
		});
	}
	
	save() {
		if(this.state.preferences.password!=this.state.preferences.password2)
			return App.warning("Passwords do not match");
		
		this.savePassword().then( () => {
			this.simpleAPI({
				group: 'user',
				action: 'update_preferences',
				attributes: {
					name: window.localStorage.user,
					preferences: JSON.stringify(this.state.preferences)
				}
			}, "Preferences saved").then( () => {
				this.dlg.current.close();
				window.localStorage.preferences = JSON.stringify(this.state.preferences);
			});
		});
	}
	
	renderNotifications() {
		if(App.wrap_context!='extension')
			return;
		
		return (
			<div>
				<label>Notifications</label>
				<Permission name="notifications" />
			</div>
		);
	}
	
	render() {
		let preferences = this.state.preferences;
		
		return (
			<Dialog ref={this.dlg} title="Edit preferences" width="700">
				<h2>
					User preferencies
					<Help>
						You can change you own password and also select you preferred node.
						<br /><br />
						Preferred node is the node that will be pre-selected when you launch a new workflow instance.
					</Help>
				</h2>
				<div className="formdiv">
					<div>
						<label>Password</label>
						<input type="password" name="password" placeholder="Leave empty to keep current password" value={this.state.password} onChange={ (e) => this.setState({password: e.target.value}) } />
					</div>
					<div>
						<label>Confirm password</label>
						<input type="password" name="password2" value={this.state.password2} onChange={ (e) => this.setState({password2: e.target.value}) } />
					</div>
					<div>
						<label>Preferred node</label>
						<NodeSelector name="preferred_node" value={preferences.preferred_node} onChange={this.onChange} />
					</div>
					{this.renderNotifications()}
				</div>
				<button className="submit" onClick={this.save}>Save preferences</button>
			</Dialog>
		);
	}
}
