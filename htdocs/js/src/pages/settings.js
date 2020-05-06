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

import {Tabs} from '../ui/tabs.js';
import {Tab} from '../ui/tab.js';

export class PageSettings extends React.Component {
	constructor(props) {
		super(props);
		
		this.state = {
			new_name: '',
			new_color: '',
			clusters: {}
		};
		
		this.save = this.save.bind(this);
		this.onChange = this.onChange.bind(this);
		
		browser.storage.local.get().then( (data) => {
			let state = {};
			if(data.clusters!==undefined)
				state.clusters = data.clusters;
			
			this.setState(state);
		});
		
		this.addEnv = this.addEnv.bind(this);
	}
	
	addEnv() {
		let name = this.state.new_name;
		if(name=='')
			return;
		
		if(this.state.clusters[name]!==undefined)
			return;
		
		let clusters = this.state.clusters;
		clusters[name] = {
			desc: '',
			user: '',
			password: '',
			color: this.state.new_color
		};
		
		this.setState({clusters: clusters, new_name: ''});
	}
	
	removeEnv(name) {
		let clusters = this.state.clusters;
		delete clusters[name];
		this.setState({clusters: clusters});
	}
	
	save() {
		browser.storage.local.set({clusters: this.state.clusters});
	}
	
	onChange(e, name) {
		let clusters = this.state.clusters;
		clusters[name][e.target.name] = e.target.value;
		this.setState({clusters: clusters});
	}
	
	renderEnvs() {
		return Object.keys(this.state.clusters).map( (name) => {
			let cluster = this.state.clusters[name];
			return (
				<Tab key={name} title={name}>
					<div>
						<div className="formdiv">
							<div>
								<label>Cluster configuration</label>
								<textarea name="desc" value={cluster.desc} placeholder="Enter a coma separated list of engines, eg ws://localhost:5001, ws://localhost:5003" onChange={ (e) => this.onChange(e, name) }></textarea>
							</div>
							<div>
								<label>User</label>
								<input type="text" name="user" value={cluster.user} onChange={ (e) => this.onChange(e, name) } />
							</div>
							<div>
								<label>Password</label>
								<input type="password" name="password" value={cluster.password} onChange={ (e) => this.onChange(e, name) } />
							</div>
							<div>
								<label>Color</label>
								<input type="text" name="color" value={cluster.color} onChange={ (e) => this.onChange(e, name) } />
							</div>
						</div>
						<div className="center">
							<button onClick={ (e) => this.removeEnv(name) }>Remove environement</button>
							&#160;&#160;&#160;
							<button onClick={this.save}>Save settings</button>
						</div>
					</div>
				</Tab>
			);
		});
	}
	
	render() {
		return (
			<div>
				<h1>evQueue settings</h1>
				
				<Tabs>
					{this.renderEnvs()}
				</Tabs>
				<br />
				<div>
					<h2>New environement</h2>
					<div className="formdiv">
						<div>
							<label>Name</label>
							<input type="text" name="new_name" value={this.state.new_name} onChange={ (e) => this.setState({new_name: e.target.value}) } />
						</div>
						<div>
							<label>Name</label>
							<input type="text" placeholder="ebebeb" name="new_color" value={this.state.new_color} onChange={ (e) => this.setState({new_color: e.target.value}) } />
						</div>
					</div>
					<div className="center">
						<button onClick={this.save} onClick={this.addEnv}>Add</button>
					</div>
				</div>
			</div>
		);
	}
}

ReactDOM.render(<PageSettings />, document.querySelector('#content-settings'));
