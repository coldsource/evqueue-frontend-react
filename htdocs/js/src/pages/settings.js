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

export class PageSettings extends React.Component {
	constructor(props) {
		super(props);
		
		this.state = {
			cluster: '',
			login: '',
			password: ''
		};
		
		this.save = this.save.bind(this);
		this.onChange = this.onChange.bind(this);
		
		browser.storage.local.get().then( (data) => {
			console.log(data);
			let state = {};
			if(data.cluster!==undefined)
				state.cluster = data.cluster;
			if(data.login!==undefined)
				state.login = data.login;
			if(data.password!==undefined)
				state.password = data.password;
			
			this.setState(state);
		});
	}
	
	save() {
		browser.storage.local.set(this.state);
	}
	
	onChange(e) {
		let state = this.state;
		state[e.target.name] = e.target.value;
		this.setState(state);
	}
	
	render() {
		return (
			<div>
				<h1>evQueue settings</h1>
				
				<div className="formdiv">
					<div>
						<label>Cluster configuration</label>
						<textarea name="cluster" value={this.state.cluster} placeholder="Enter a coma separated list of engines, eg ws://localhost:5001, ws://localhost:5003" onChange={this.onChange}></textarea>
					</div>
					<div>
						<label>Login</label>
						<input type="text" name="login" value={this.state.login} onChange={this.onChange} />
					</div>
					<div>
						<label>Password</label>
						<input type="password" name="password" value={this.state.password} onChange={this.onChange} />
					</div>
				</div>
				<button className="submit" onClick={this.save}>Save settings</button>
			</div>
		);
	}
}

ReactDOM.render(<PageSettings />, document.querySelector('#content-settings'));
