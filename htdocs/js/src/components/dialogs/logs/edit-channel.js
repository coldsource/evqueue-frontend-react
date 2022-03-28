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

export class EditChannel extends evQueueComponent {
	constructor(props) {
		super(props);
		
		this.state.channel = {
			name: '',
			group_id: '',
			regex: '',
			date: '',
			crit: 'LOG_NOTICE',
			fields: {}
		}
		
		this.state.groups = [];
		this.state.regex_error = '';
		this.state.config_checker = false;
		
		this.dlg = React.createRef();
		this.dlg_checker = undefined;
		
		this.onChange = this.onChange.bind(this);
		this.save = this.save.bind(this);
		this.renderRegexError = this.renderRegexError.bind(this);
		this.renderFields = this.renderFields.bind(this);
		this.addCustomField = this.addCustomField.bind(this);
		this.removeField = this.removeField.bind(this);
		this.toggleConfigCheck = this.toggleConfigCheck.bind(this);
		this.dlgClose = this.dlgClose.bind(this);
	}
	
	componentDidMount() {
		this.API({
			group: 'channel_groups',
			action: 'list',
		}).then( (response) => {
			let data = this.parseResponse(response);
			
			let groups = [];
			for(let i=0;i<data.response.length;i++)
				groups.push({name: data.response[i].name, value: data.response[i].id});
			this.setState({groups: groups});
		});
		
		if(this.props.id)
		{
			this.API({
				group: 'channel',
				action: 'get',
				attributes: {id: this.props.id}
			}).then( (response) => {
				let resp = this.parseResponse(response).response[0];
				let channel = this.state.channel;
				channel.name = resp.name;
				Object.assign(channel, JSON.parse(resp.config));
				this.setState({channel: channel});
			});
		}
	}
	
	onChange(e) {
		let name = e.target.name;
		let value = e.target.value;
		
		if(name=='regex')
		{
			this.API({
				group: 'channel',
				action: 'checkregex',
				attributes: {regex: value}
			}).then( (response) => {
				let status = this.parseResponse(response);
				if(status.valid!='yes')
					this.setState({regex_error: status.details});
				else
					this.setState({regex_error: ''});
			});
		}
		
		let channel = this.state.channel;
		
		if(name.substr(0,7)=='custom_')
			channel.fields[name.substr(7)] = value;
		else
			channel[name] = value;
		
		this.setState({channel: channel});
		
		if(this.state.config_checker)
			this.dlg_checker.current.setConfig(channel);
	}
	
	save() {
		let action = this.props.id?'edit':'create';
		let action_name = this.props.id?'modified':'created';
		
		let config = {};
		Object.assign(config, this.state.channel);
		
		delete config.name;
		
		// Delete empty fields of config
		for(name in config)
		{
			if(!config[name])
				delete config[name];
		}
		
		let attributes = {
			name: this.state.channel.name,
			
			config: JSON.stringify(config)
		};
		
		if(this.props.id)
			attributes.id = this.props.id;
		
		this.simpleAPI({
			group: 'channel',
			action: action,
			attributes: attributes
		}, "Channel successfully "+action_name).then( () => {
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
	
	addCustomField() {
		Dialogs.open(Prompt,{
			content: "Please enter your custom field's name",
			placeholder: "Cusrtom field name",
			width: 500,
			confirm: (name) => {
				let channel = this.state.channel;
				channel.fields[name] = 1;
				this.setState({channel: channel});
			}
		});
	}
	
	removeField(name) {
		let channel = this.state.channel;
		delete channel.fields[name];
		this.setState({channel: channel});
	}
	
	renderFields() {
		let regex_values = this.addRegexValues();
		
		return Object.keys(this.state.channel.fields).map(name => {
			return (
				<div key={name}>
					<label>{name} <span title="Remove this custom field" className="faicon fa-remove" onClick={() => this.removeField(name)}></span></label>
					<Select name={"field_"+name} value={this.state.channel.fields[name]} values={regex_values} filter={false} onChange={this.onChange} />
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
			this.dlg_checker = Dialogs.open(CheckConfig, {onClose: this.dlgClose, config: this.state.channel});
		else
			this.dlg_checker.current.close();
		
		this.setState({config_checker: !this.state.config_checker});
	}
	
	render() {
		let channel = this.state.channel;
		let title = this.props.id?"Edit channel « "+channel.name+" »":"Create new channel";
		let submit = this.props.id?"Edit channel":"Create channel";
		let config_checker_label = this.state.config_checker?'Close config checker':'Open config checker';
		
		let crit_values = [
			{name: 'Emergency', value: 'LOG_EMERG'},
			{name: 'Alert', value: 'LOG_ALERT'},
			{name: 'Critical', value: 'LOG_CRIT'},
			{name: 'Error', value: 'LOG_ERR'},
			{name: 'Warning', value: 'LOG_WARNING'},
			{name: 'Notice', value: 'LOG_NOTICE'},
			{name: 'Info', value: 'LOG_INFO'},
			{name: 'Debug', value: 'LOG_DEBUG'},
		];
		
		crit_values = this.addRegexValues(crit_values);
		
		let regex_values = this.addRegexValues([{name: 'Empty', value: ''}]);
		
		return (
			<Dialog ref={this.dlg} title={title} width="700">
				<h2>
					Channel properties
					<Help>
						Logging channels are used for external logging purpose. Each channel can have its own custom fields. A regular expression is used to extract data from the raw logged line.
					</Help>
				</h2>
				<button onClick={this.toggleConfigCheck}>{config_checker_label}</button>
				<div className="formdiv">
					<div>
						<label>Name</label>
						<input type="text" name="name" value={channel.name} onChange={this.onChange} />
					</div>
					<div>
						<label>Group</label>
						<Select name="group_id" value={this.state.channel.group_id} values={this.state.groups} onChange={this.onChange} />
					</div>
					<div>
						<label>Regex</label>
						<input type="text" name="regex" value={channel.regex} onChange={this.onChange} />
						{this.renderRegexError()}
					</div>
					<div>
						<label>Criticality</label>
						<Select name="crit" value={channel.crit} values={crit_values} filter={false} onChange={this.onChange} />
					</div>
					{this.renderFields()}
					<div>
						<label><span title="Add custom field" className="faicon fa-plus" onClick={this.addCustomField}></span></label>
					</div>
				</div>
				<button className="submit" onClick={this.save}>{submit}</button>
			</Dialog>
		);
	}
}
