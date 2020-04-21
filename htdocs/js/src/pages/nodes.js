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

import {App} from '../components/base/app.js';
import {HeaderMenu} from '../components/menus/header.js';
import {evQueueComponent} from '../components/base/evqueue-component.js';

export class PageNodes extends evQueueComponent {
	constructor(props) {
		super(props);
		
		this.state.nodes_status = [];
		
		for(let i=0;i<this.state.cluster.nodes_names.length;i++)
			this.state.nodes_status.push({});
	}
	
	componentDidMount() {
		for(let i=0;i<this.state.cluster.nodes_names.length;i++)
		{
			if(this.state.cluster.nodes_states[i]=='READY')
				this.getNodesStatus(this.state.cluster.nodes_names[i], i);
		}
	}
	
	componentDidUpdate(prevProps, prevState) {
		for(let i=0;i<this.state.cluster.nodes_states.length;i++)
		{
			if(prevState.cluster.nodes_states[i]!='READY' && this.state.cluster.nodes_states[i]=='READY')
				this.getNodesStatus(this.state.cluster.nodes_names[i], i);
		}
	}
	
	getNodesStatus(node_name, idx) {
			this.API({node: node_name, group: 'ping'}).then( (responses) => {
			let nodes_status = this.state.nodes_status;
			nodes_status[idx] = this.parseResponse(responses);
			this.setState({nodes_status: nodes_status});
		});
	}
	
	humanTime(seconds) {
		return (seconds/86400 >= 1 ? Math.floor(seconds/86400)+'days, ' : '') +
		(seconds/3600 >= 1 ? (Math.floor(seconds/3600)%24)+'h ' : '') +
		(seconds/60 >= 1 ? (Math.floor(seconds/60)%60)+'m ' : '') +
		(seconds%60)+'s';
	}
	
	renderStatus() {
		return this.state.cluster.nodes_states.map( (node_state, idx) => {
			let node = this.state.nodes_status[idx];
			
			return (
				<div key={idx} className="tabbed">
					<div>
						<div>Connection descriptor</div>
						<div>{App.global.cluster_config[idx]}</div>
					</div>
					<div>
						<div>Name</div>
						<div>{this.state.cluster.nodes_names[idx]}</div>
					</div>
					<div>
						<div>State</div>
						<div className={node_state!="READY"?'error':'success'}>{node_state}</div>
					</div>
					<div>
						<div>Uptime</div>
						<div>{this.humanTime(node.uptime)}</div>
					</div>
					<div>
						<div>Version</div>
						<div>{node.version}</div>
					</div>
					<div>
						<div>Git support</div>
						<div>{node['git-support']}</div>
					</div>
				</div>
			);
		});
	}
	
	render() {
		return (
			<div className="evq-nodes">
				<HeaderMenu current="System state"/>
				{this.renderStatus()}
			</div>
		);
	}
}
