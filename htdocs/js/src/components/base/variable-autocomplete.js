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
import {Autocomplete} from '../../ui/autocomplete.js';

export class VariableAutocomplete extends evQueueComponent {
	constructor(props) {
		super(props);
		
		this.state.paths = [];
	}
	
	componentDidMount() {
		let api = {node:'*', group:'storage', action:'list', attributes: {path: '', recursive: 'yes'}};
		
		this.Subscribe('VARIABLE_UNSET',api);
		this.Subscribe('VARIABLE_SET',api,true);
	}
	
	evQueueEvent(data) {
		if(this.props.type=='path')
		{
			let paths = new Set();
			for(let v of this.parseResponse(data).response)
			{
				let parts = v.path.split('/');
				let path = parts[0];
				paths.add(path);
				for(let i=1;i<parts.length;i++)
				{
					path += '/' + parts[i];
					paths.add(path);
				}
			}
			
			this.setState({paths: Array.from(paths)});
		}
		else
		{
			let paths = [];
			for(let v of this.parseResponse(data).response)
				paths.push(v.path + '/' + v.name);
			this.setState({paths: paths});
		}
	}
	
	render() {
		return (
			<Autocomplete value={this.props.value} autocomplete={this.state.paths} name={this.props.name} onChange={this.props.onChange} />
		);
	}
}
