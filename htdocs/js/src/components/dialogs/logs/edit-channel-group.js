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
import {Dialogs} from '../../../ui/dialogs.js';
import {Prompt} from '../../../ui/prompt.js';
import {Help} from '../../../ui/help.js';
import {Select} from '../../../ui/select.js';
import {evQueueComponent} from '../../base/evqueue-component.js';


import {CheckConfig} from './check-config.js';

export class EditChannelGroup extends evQueueComponent {
	constructor(props) {
		super(props);
		
		this.state.channelgroup = {
			name: '',
			fields: {}
		}
		
		this.types = [
			{name: 'Indexed char', value: 'CHAR'},
			{name: 'Integer', value: 'INT'},
			{name: 'IP', value: 'IP'},
			{name: 'Paked value', value: 'PACK'},
			{name: 'Full text', value: 'TEXT'}
		];
		
		this.state.regex_error = '';
		this.state.config_checker = false;
		
		this.dlg = React.createRef();
		this.dlg_checker = undefined;
		
		this.onChange = this.onChange.bind(this);
		this.save = this.save.bind(this);
		this.renderRegexError = this.renderRegexError.bind(this);
		this.renderFields = this.renderFields.bind(this);
		this.addField = this.addField.bind(this);
		this.removeField = this.removeField.bind(this);
		this.toggleConfigCheck = this.toggleConfigCheck.bind(this);
		this.dlgClose = this.dlgClose.bind(this);
	}
	
	componentDidMount() {
		if(this.props.id)
		{
			this.API({
				group: 'channel_group',
				action: 'get',
				attributes: {id: this.props.id}
			}).then( (response) => {
				let resp = this.parseResponse(response);
				
				let fields = {};
				for(let i=0;i<resp.response.length;i++)
					fields[resp.response[i].name] = resp.response[i].type;
				
				let channelgroup = {name: resp.name, fields: fields};
				this.setState({channelgroup: channelgroup});
			});
		}
	}
	
	onChange(e) {
		let name = e.target.name;
		let value = e.target.value;
		
		let channelgroup = this.state.channelgroup;
		
		if(name.substr(0,6)=='field_')
			channelgroup.fields[name.substr(6)] = value;
		else
			channelgroup[name] = value;
		
		this.setState({channelgroup: channelgroup});
	}
	
	save() {
		let action = this.props.id?'edit':'create';
		let action_name = this.props.id?'modified':'created';
		
		let attributes = {};
		if(this.props.id)
			attributes.id = this.props.id;
		
		attributes.name = this.state.channelgroup.name;
		attributes.fields = JSON.stringify(this.state.channelgroup.fields);
		
		this.simpleAPI({
			group: 'channel_group',
			action: action,
			attributes: attributes
		}, "Channel group successfully "+action_name).then( () => {
			this.dlg.current.close();
		});
	}
	
	addRegexValues(values = []) {
		for(let i=1;i<=20;i++)
			values.push({name: "Regex capture group "+i, value: i});
		return values;
	}
	
	renderRegexError() {
		if(!this.state.regex_error)
			return;
		
		return (<div className="light-error inline-error">{this.state.regex_error}</div>);
	}
	
	addField() {
		Dialogs.open(Prompt,{
			content: "Please enter your field's name",
			placeholder: "Cusrtom field name",
			width: 500,
			confirm: (name) => {
				let channelgroup = this.state.channelgroup;
				channelgroup.fields[name] = 1;
				this.setState({channelgroup: channelgroup});
			}
		});
	}
	
	removeField(name) {
		let channelgroup = this.state.channelgroup;
		delete channelgroup.fields[name];
		this.setState({channelgroup: channelgroup});
	}
	
	renderFields() {
		let regex_values = this.addRegexValues();
		
		return Object.keys(this.state.channelgroup.fields).map(name => {
			return (
				<div key={name}>
					<label>{name} <span title="Remove this custom field" className="faicon fa-remove" onClick={() => this.removeField(name)}></span></label>
					<Select name={"field_"+name} value={this.state.channelgroup.fields[name]} values={this.types} filter={false} onChange={this.onChange} />
				</div>
			);
		});
	}
	
	dlgClose() {
		this.setState({config_checker: false});
		return true;
	}
	
	toggleConfigCheck() {
		if(!this.state.config_checker)
			this.dlg_checker = Dialogs.open(CheckConfig, {onClose: this.dlgClose, config: this.state.channelgroup});
		else
			this.dlg_checker.current.close();
		
		this.setState({config_checker: !this.state.config_checker});
	}
	
	render() {
		let channelgroup = this.state.channelgroup;
		let title = this.props.id?"Edit channel group « "+channelgroup.name+" »":"Create new channel group";
		let submit = this.props.id?"Edit channel group":"Create channel group";
		
		return (
			<Dialog ref={this.dlg} title={title} width="700">
				<h2>
					Channel group properties
					<Help>
						Logging channels are used for external logging purpose. Each channel can have its own custom fields. A regular expression is used to extract data from the raw logged line.
					</Help>
				</h2>
				<div className="formdiv">
					<div>
						<label>Name</label>
						<input type="text" name="name" value={channelgroup.name} onChange={this.onChange} />
					</div>
					{this.renderFields()}
					<div>
						<label><span title="Add field" className="faicon fa-plus" onClick={this.addField}></span></label>
					</div>
				</div>
				<button className="submit" onClick={this.save}>{submit}</button>
			</Dialog>
		);
	}
}
