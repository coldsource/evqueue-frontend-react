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

export class NotificationTypeSelector extends evQueueComponent {
	constructor(props) {
		super(props);
		
		this.state.values = [];
	}
	
	componentDidMount() {
		var api = {node:'*', group:'notification_types',action:'list'};
		this.Subscribe('NOTIFICATION_TYPE_CREATED',api);
		this.Subscribe('NOTIFICATION_TYPE_REMOVED',api, true);
	}
	
	evQueueEvent(response) {
		let data = this.parseResponse(response,'/response/*');
		
		let values = [];
		for(let i=0;i<data.response.length;i++)
			values.push({name: data.response[i].name, value: data.response[i].id});
		this.setState({values: values});
	}
	
	render() {
		return (
			<Select value={this.props.value} values={this.state.values} name={this.props.name} disabled={this.props.disabled} filter={false} onChange={this.props.onChange}>
			</Select>
		);
	}
}
