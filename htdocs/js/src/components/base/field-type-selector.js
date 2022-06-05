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

export class FieldTypeSelector extends React.Component {
	constructor(props) {
		super(props);
		
		this.types = [
			{name: 'Indexed char (max 128)', value: 'CHAR'},
			{name: 'Integer', value: 'INT'},
			{name: 'IP', value: 'IP'},
			{name: 'Packed value', value: 'PACK'},
			{name: 'Full text', value: 'TEXT'},
			{name: 'Full text (indexed)', value: 'ITEXT'}
		];
	}
	
	render() {
		return (
			<Select value={this.props.value} values={this.types} name={this.props.name} disabled={this.props.disabled} filter={false} onChange={this.props.onChange}>
			</Select>
		);
	}
}
