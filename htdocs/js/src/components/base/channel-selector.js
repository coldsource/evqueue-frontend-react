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

import {evQueueComponent} from './evqueue-component.js';
import {Select} from '../../ui/select.js';

export class ChannelSelector extends evQueueComponent {
	constructor(props) {
		super(props);
		
		this.state.channels = [];
	}
	
	componentDidMount() {
		let api = { group:'channels',action:'list' };
		
		if(this.props.group)
			api.parameters = {group_id: this.props.group};
		
		this.Subscribe('CHANNEL_CREATED',api,false);
		this.Subscribe('CHANNEL_MODIFIED',api,false);
		this.Subscribe('CHANNEL_REMOVED',api,true);
	}
	
	evQueueEvent(response) {
		let data = this.parseResponse(response);
		
		let channels = [{name: 'All channels', value: 0}];
		for(let i=0;i<data.response.length;i++)
			channels.push({name: data.response[i].name, value: parseInt(data.response[i].id)});
		
		this.setState({channels: channels});
	}
	
	render() {
		let value = this.props.value;
		if(value===undefined)
			value = 0;
		
		return (
			<Select value={value} values={this.state.channels} name={this.props.name} disabled={this.props.disabled} filter={false} onChange={this.props.onChange}>
			</Select>
		);
	}
}
