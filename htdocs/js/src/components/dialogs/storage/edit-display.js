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

import {Dialog} from '../../../ui/dialog.js';
import {Help} from '../../../ui/help.js';
import {Select} from '../../../ui/select.js';
import {WorkflowSelector} from '../../base/workflow-selector.js';
import {DisplayGroupAutocomplete} from '../../base/display-group-autocomplete.js';
import {VariableAutocomplete} from '../../base/variable-autocomplete.js';

import {evQueueComponent} from '../../base/evqueue-component.js';

export class EditDisplay extends evQueueComponent {
	constructor(props) {
		super(props);
		
		this.state.display = {
			name: '',
			group: '',
			path: '',
			order: '',
			item_title: '',
			item_content: ''
		}
		
		this.dlg = React.createRef();
		
		this.onChange = this.onChange.bind(this);
		this.save = this.save.bind(this);
	}
	
	componentDidMount() {
		if(this.props.id)
		{
			this.API({
				group: 'display',
				action: 'get',
				attributes: {id: this.props.id}
			}).then( (response) => {
				let display = this.parseResponse(response);
				this.setState({display: {
					name: display.name,
					group: display.group,
					path: display.path,
					order: display.order,
					item_title: display.item_title,
					item_content: display.item_content,
				}});
			});
		}
	}
	
	onChange(e) {
		let name = e.target.name;
		let value = e.target.value;
		
		let display = this.state.display;
		display[name] = value;
		
		this.setState({display: display});
	}
	
	save() {
		let action_name = this.props.id?'changed':'created';
		let action = this.props.id?'edit':'create';
		
		let attributes = Object.assign({}, this.state.display);
		
		if(this.props.id)
			attributes.id = this.props.id
		
		this.simpleAPI({
			group: 'display',
			action: action,
			attributes: attributes
		}, "Display successfully "+action_name).then( () => {
			this.dlg.current.close();
		});
	}
	
	render() {
		let display = this.state.display;
		let title = this.props.id?"Edit display « "+display.name+" »":"Create new display";
		let submit = this.props.id?"Edit display":"Create display";
		
		return (
			<Dialog ref={this.dlg} title={title} width="700">
				<h2>
					Display properties
					<Help>
						Choose a variable structured as a Map or an Array. Display will loop on the values and create an text item with a title and content for each item. You can refer to the current item value with $key and $value parameters.
						<br />
						<br />You can use variables in item title or content by using this syntax : {"{path/to/variable/}"}. If variable is a Map, you can access a special key by using {"{path/to/variable}.key"}. $key and $value special variables can be used in variable names.
						<br />
						<br />Both title and content support lightweight Markdown syntax.
					</Help>
				</h2>
				<div className="formdiv">
					<div>
						<label>Name</label>
						<input type="text" name="name" value={display.name} onChange={this.onChange} />
					</div>
					<div>
						<label>Group</label>
						<DisplayGroupAutocomplete name="group" value={display.group} onChange={this.onChange} />
					</div>
					<div>
						<label>Variable path</label>
						<VariableAutocomplete name="path" value={display.path} onChange={this.onChange} />
					</div>
					<div>
						<label>Order</label>
						<Select values={[{name: 'Ascending', value: 'ASC'}, {name: 'Descending', value: 'DESC'}]} name="order" value={display.order} onChange={this.onChange} />
					</div>
					<div>
						<label>Item title</label>
						<input type="text" name="item_title" value={display.item_title} onChange={this.onChange} />
					</div>
					<div>
						<label>Item content</label>
						<textarea name="item_content" value={display.item_content} onChange={this.onChange}></textarea>
					</div>
				</div>
				<button className="submit" onClick={this.save}>{submit}</button>
			</Dialog>
		);
	}
}
