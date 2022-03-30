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

import {evQueueComponent} from '../components/base/evqueue-component.js';
import {HeaderMenu} from '../components/menus/header.js';
import {ELogs} from '../components/panels/logs/elogs.js';
import {ELogsFilters} from '../components/panels/logs/elogs-filters.js';
import {Tabs} from '../ui/tabs.js';
import {Tab} from '../ui/tab.js';

export class PageELogsSearch extends evQueueComponent {
	constructor(props) {
		super(props);
		
		this.state.channelgroups = [];
		
		this.logs = React.createRef();
		this.filters = React.createRef();
	}
	
	componentDidMount() {
		var api = {node:'*', group:'channel_groups',action:'list'};
		this.Subscribe('CHANNELGROUP_CREATED',api);
		this.Subscribe('CHANNELGROUP_MODIFIED',api);
		this.Subscribe('CHANNELGROUP_REMOVED',api,true);
	}
	
	evQueueEvent(response, ref) {
		let data = this.parseResponse(response);
		this.setState({channelgroups: data.response});
	}
	
	renderTabs() {
		return this.state.channelgroups.map(group => {
			return (
				<Tab key={group.name} title={group.name}>
					<ELogsFilters group={group.id} ref={this.filters} onChange={this.logs} />
					<br />
					<ELogs group={group.id} ref={this.logs} filters={this.filters} />
				</Tab>
			);
		});
	}
	
	render() {
		return (
			<div>
				<HeaderMenu current="External Logs" />
				<Tabs>
					{this.renderTabs()}
				</Tabs>
			</div>
		);
	}
}
