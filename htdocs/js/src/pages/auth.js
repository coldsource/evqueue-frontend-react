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

import {CryptoJS} from '../evqueue/cryptojs/core.js';
import {App} from '../components/base/app.js';
import {evQueueCluster} from '../evqueue/evqueue-cluster.js';
import {HeaderMenu} from '../components/menus/header.js';
import {EnvSelector} from '../components/base/env-selector.js';

export class PageAuth extends React.Component {
	constructor(props) {
		super(props);
		
		let env = window.localStorage.getItem('env');
		this.state = {
			env: env!==null?env:Object.keys(App.global.clusters_config)[0],
			user: '',
			password: '',
			error: false,
		};
		
		this.connect = this.connect.bind(this);
		
		// Auto login in browser plugin configuration
		if(typeof(browser)!='undefined')
		{
			browser.storage.local.get().then( (data) => {
				if(data.login!==undefined && data.password!==undefined)
					this._connect(env, user, password);
			});
		}
		
		// Auto login if credentials are already stored
		if(env!==null)
		{
			console.log("ok");
			let user = window.localStorage.getItem(env+'.user');
			let password = window.localStorage.getItem(env+'.password');
			if(user!==null && password!==null)
				this._connect(env, user, password);
		}
	}
	
	renderError() {
		if(!this.state.error)
			return;
		
		return (<div className="error">{this.state.error}</div>);
	}
	
	connect() {
		let env = this.state.env;
		let user = this.state.user;
		let password = CryptoJS.SHA1(this.state.password).toString(CryptoJS.enc.Hex);
		
		this._connect(env, user, password);
	}
	
	_connect(env, user, password) {
		// Set cluster config according to selected ENV
		App.global.cluster_config = App.global.clusters_config[env].nodes;
		
		// Store credentials for this env
		window.localStorage.setItem('env',env);
		window.localStorage.setItem(env+".user",user);
		window.localStorage.setItem(env+".password",password);
		window.localStorage.setItem('user',user);
		window.localStorage.setItem('password',password);
		
		// Connect
		var evq = new evQueueCluster(App.global.cluster_config);
		evq.API({group: 'user', action: 'get', attributes: {name: user}}).then(
			(response) => {
				window.localStorage.preferences = response.documentElement.firstChild.getAttribute('preferences');
				try {
					this.state.preferences = JSON.parse(window.localStorage.preferences);
				}
				catch(err) {
					// Empty or unreadable properties, falling back to default
					window.localStorage.preferences = JSON.stringify({
						preferred_node: ''
					});
				}
				
				evq.Close();
				
				window.localStorage.authenticated = 'true';
				App.changeURL('?loc=home');
			},
			(reason) => this.setState({error: reason})
		);
	}
	
	render() {
		return (
			<div id="login" onKeyDown={ (e) => { if(e.keyCode === 13) this.connect(e) } }>
				<fieldset>
					<div className="logo">
						<img src="images/evQueue.svg" />
					</div>
					<div className="form">
						{ this.renderError() }
						<EnvSelector name="env" value={this.state.env} filter={false} onChange={ (e) => this.setState({env: e.target.value}) }/><br/><br/>
						<input autoFocus type="text" placeholder="User" onChange={ (e) => this.setState({user: e.target.value}) }/><br/><br/>
						<input type="password" placeholder="Password" onChange={ (e) => this.setState({password: e.target.value}) } /><br/><br/>
						<button onClick={this.connect}>Log In</button>
					</div>
				</fieldset>
			</div>
		);
	}
}
