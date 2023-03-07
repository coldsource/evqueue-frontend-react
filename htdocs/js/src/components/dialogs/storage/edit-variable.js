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

import {App} from '../../base/app.js';
import {Dialog} from '../../../ui/dialog.js';
import {Help} from '../../../ui/help.js';
import {Select} from '../../../ui/select.js';
import {Variable} from '../../../ui/variable.js';
import {VariableAutocomplete} from '../../base/variable-autocomplete.js';
import {evQueueComponent} from '../../base/evqueue-component.js';

export class EditVariable extends evQueueComponent {
	constructor(props) {
		super(props);
		
		this.state.variable = {
			path: '',
			name: '',
			type: 'INT',
			structure: 'NONE',
			value: this.getEmptyValue('INT')
		}
		
		this.dlg = React.createRef();
		
		this.onChange = this.onChange.bind(this);
		this.save = this.save.bind(this);
	}
	
	componentDidMount() {
		if(this.props.id)
		{
			this.API({
				group: 'storage',
				action: 'get',
				attributes: {id: this.props.id}
			}).then( (response) => {
				let variable = this.parseResponse(response);
				this.setState({variable: {
					path: variable.path,
					name: variable.name,
					type: variable.type,
					structure: variable.structure,
					value: JSON.parse(variable.value)
				}});
			});
		}
	}
	
	getEmptyValue(type) {
		if(type=='STRING')
			return '';
		else if(type=='INT')
			return 0;
		else if(type=='BOOLEAN')
			return false;
	}
	
	onChange(e) {
		let name = e.target.name;
		let value = e.target.value;
		
		let variable = this.state.variable;
		
		if(name=='type' || name=='structure')
		{
			let new_structure = variable.structure;
			let new_type = variable.type;
			
			if(name=='structure')
				new_structure = value;
			if(name=='type')
				new_type = value;
			
			if(new_structure=='NONE')
				variable.value = this.getEmptyValue(new_type);
			else if(new_structure=='ARRAY')
				variable.value = [];
			else if(new_structure=='MAP')
				variable.value = {};
		}
		
		variable[name] = value;
		this.setState({variable: variable});
	}
	
	save() {
		let action_name = this.props.id?'changed':'created';
		
		let attributes = Object.assign({}, this.state.variable);
		attributes.value = JSON.stringify(attributes.value);
		
		if(attributes.path=='')
		{
			App.warning("Path can't be empty");
			return;
		}
		
		if(attributes.name=='')
		{
			App.warning("Name can't be empty");
			return;
		}
		
		if(this.props.id)
			attributes.id = this.props.id
		
		this.simpleAPI({
			group: 'storage',
			action: 'set',
			attributes: attributes
		}, "Variable successfully "+action_name).then( () => {
			this.dlg.current.close();
		});
	}
	
	render() {
		let variable = this.state.variable;
		let title = this.props.id?"Edit variable « "+variable.name+" »":"Create new variable";
		let submit = this.props.id?"Edit variable":"Create variable";
		
		return (
			<Dialog ref={this.dlg} title={title} width="700">
				<h2>
					Variable properties
					<Help>
						Choose variable type and structure
					</Help>
				</h2>
				<div className="formdiv">
					<div>
						<label>Path</label>
						<VariableAutocomplete name="path" value={variable.path} type="path" onChange={this.onChange} />
					</div>
					<div>
						<label>Name</label>
						<input type="text" name="name" value={variable.name} onChange={this.onChange} />
					</div>
					<div>
						<label>Type</label>
						<Select name="type" value={variable.type} values={[{name: 'Integer', value: 'INT'},{name: 'String', value: 'STRING'},{name: 'Boolean', value: 'BOOLEAN'}]} onChange={this.onChange} />
					</div>
					<div>
						<label>Structure</label>
						<Select name="structure" value={variable.structure} values={[{name: 'None', value: 'NONE'},{name: 'Array', value: 'ARRAY'},{name: 'Map', value: 'MAP'}]} onChange={this.onChange} />
					</div>
				</div>
				<Variable name="value" value={variable.value} type={variable.type} structure={variable.structure} onChange={this.onChange} />
				<button className="submit" onClick={this.save}>{submit}</button>
			</Dialog>
		);
	}
}
