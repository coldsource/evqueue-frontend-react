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

import {Select} from '../../ui/select.js';

export class ConfigEditor extends React.Component {
	constructor(props) {
		super(props);
	}
	
	renderFields() {
		return this.props.fields.map( (field) => {
			if(field.type=='select')
			{
				let option_ite = field.domnode.ownerDocument.evaluate('option',field.domnode);
				let option_node;
				let values = [];
				while(option_node = option_ite.iterateNext())
				{
					values.push({
						name: option_node.textContent,
					  value: option_node.getAttribute('value')
					});
				}
				
				return (
					<div key={field.name}>
						<label>{field.label}</label>
						<Select name={field.name} value={this.props.values[field.name]} values={values} onChange={this.props.onChange} />
					</div>
				);
			}
			
			if(field.type=='text')
			{
				return (
					<div key={field.name}>
						<label>{field.label}</label>
						<input type="text" name={field.name} value={this.props.values[field.name]} onChange={this.props.onChange} />
					</div>
				);
			}
			
			if(field.type=='textarea')
			{
				return (
					<div key={field.name}>
						<label>{field.label}</label>
						<textarea name={field.name} value={this.props.values[field.name]} onChange={this.props.onChange} />
					</div>
				);
			}
			
			return;
		});
	}
	
	render() {
		return (
			<div className="formdiv">
				{ this.renderFields() }
			</div>
		);
	}
}
