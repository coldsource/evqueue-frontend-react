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
import {Tabs} from '../../../ui/tabs.js';
import {Tab} from '../../../ui/tab.js';

export class RunningConfiguration extends evQueueComponent {
	constructor(props) {
		super(props);
		
		this.state.configs = [];
		this.state.idx = 0;
		
		this.renderTabs = this.renderTabs.bind(this);
	}
	
	componentDidMount() {
		var api = { node:'*', group:'status',action:'query',attributes:{type:'configuration'} };
		this.API(api).then( (responses) => {
			for(let i=0;i<responses.length;i++) {
				let data = this.parseResponse(responses[i], '/response/configuration/entry');
				
				let configs = this.state.configs;
				var node_idx = this.evqueue_event.GetNodeByName(data.node);
				configs[node_idx] = data.response;
				
				this.setState({configs: configs});
			}
		});
	}
	
	renderNodesList() {
		var ret = [];
		var nodes = this.state.cluster.nodes_names;
		for(var i=0;i<nodes.length;i++)
		{
			var node = nodes[i];
			ret.push(<Tab key={node} title={node} />);
		}
		return ret;
	}
	
	renderEntries(config_idx) {
		if(this.state.configs[config_idx]===undefined)
			return;
		
		return this.state.configs[config_idx].map( (entry, idx) => {
			let diff = false;
			for(let i=0;i<this.state.configs.length;i++)
			{
				if(this.state.configs[i][idx].value!=entry.value)
				{
					diff = true;
					break;
				}
			}
			
			return (
				<tr key={entry.name}><td>{entry.name}</td><td className={diff?'bold':''}>{entry.value}</td></tr>
			);
		});
	}
	
	renderConfiguration(idx) {
		if(this.state.cluster.nodes_states[idx]!='READY')
			return (<div className="center error">Engine is offline</div>);
		
		return (
			<div>
				<div className="config-desc"><i>Bold entries differ between nodes</i></div>
				<table className="border hover">
					<tbody>
						{ this.renderEntries(idx) }
					</tbody>
				</table>
			</div>
		);
	}
	
	renderTabs(idx) {
		if(this.state.configs.length==0)
			return;
		
		return this.renderConfiguration(idx);
	}

	render() {
		return (
			<div id="running-configuration">
				<Panel left="" title="Running engine configuration">
					<Tabs render={this.renderTabs}>
						{ this.renderNodesList() }
					</Tabs>
				</Panel>
			</div>
		);
	}
}
