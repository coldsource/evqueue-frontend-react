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
import {Select} from '../../../ui/select.js';
import {evQueueComponent} from '../../base/evqueue-component.js';

export class EditUser extends evQueueComponent {
	constructor(props) {
		super(props);
		
		this.state.user = {
			name: '',
			password: '',
			password2: '',
			profile: 'USER',
		}
		
		this.dlg = React.createRef();
		
		this.onChange = this.onChange.bind(this);
		this.save = this.save.bind(this);
	}
	
	componentDidMount() {
		if(this.props.id)
		{
			this.API({
				group: 'user',
				action: 'get',
				attributes: {id: this.props.id}	
			}).then( (response) => {
				let user = this.parseResponse(response).response[0];
				user.password = '';
				user.password2 = '';
				this.setState({user: user});
			});
		}
	}
	
	onChange(e) {
		let name = e.target.name;
		let value = e.target.value;
		
		let user = this.state.user;
		user[name] = value;
		this.setState({user: user});
	}
	
	save() {
		if(this.state.user.password!=this.state.user.password2)
			return App.warning("Passwords do not match");
		
		let action = this.props.id?'edit':'create';
		let action_name = this.props.id?'modified':'created';
		
		let attributes = this.state.user;
		if(this.props.id)
			attributes.id = this.props.id;
		
		this.simpleAPI({
			group: 'user',
			action: action,
			attributes: attributes
		}, "User successfully "+action_name).then( () => {
			this.dlg.current.close();
		});
	}
	
	render() {
		let user = this.state.user;
		let title = this.props.id?"Edit user « "+user.name+" »":"Create new user";
		let submit = this.props.id?"Edit user":"Create user";
		
		return (
			<Dialog ref={this.dlg} title={title} width="700">
				<h2>
					User properties
					<Help>
						Users have access to evqueue interface and API commands. Admin profiles can access everything, including the settings. Users profiles can only access a specified set of workflows.
						<br /><br />
						User access rights are managed after user creation, from the dedicated interface.
					</Help>
				</h2>
				<div className="formdiv">
					<div>
						<label>Name</label>
						<input type="text" name="name" value={user.name} onChange={this.onChange} />
					</div>
					<div>
						<label>Profile</label>
						<Select name="profile" value={user.profile} values={[{name: 'User', value: 'USER'},{name: 'Admin', value: 'ADMIN'}]} filter={false} onChange={this.onChange} />
					</div>
					<div>
						<label>Passowrd</label>
						<input type="password" name="password" value={user.password} onChange={this.onChange} />
					</div>
					<div>
						<label>Confirm passowrd</label>
						<input type="password" name="password2" value={user.password2} onChange={this.onChange} />
					</div>
				</div>
				<button className="submit" onClick={this.save}>{submit}</button>
			</Dialog>
		);
	}
}
