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

export class EditChannel extends evQueueComponent {
	constructor(props) {
		super(props);
		
		this.state.channel = {
			name: '',
			regex: '',
			date: '',
			crit: 'LOG_NOTICE',
			machine: '',
			domain: '',
			ip: '',
			uid: '',
			status: '',
			custom_fields: {}
		}
		
		this.state.regex_error = '';
		
		this.dlg = React.createRef();
		
		this.onChange = this.onChange.bind(this);
		this.save = this.save.bind(this);
		this.renderRegexError = this.renderRegexError.bind(this);
		this.renderCustomFields = this.renderCustomFields.bind(this);
		this.addCustomField = this.addCustomField.bind(this);
		this.removeCustomField = this.removeCustomField.bind(this);
	}
	
	componentDidMount() {
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
			channel.custom_fields[name.substr(7)] = value;
		else
			channel[name] = value;
		
		this.setState({channel: channel});
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
				channel.custom_fields[name] = 1;
				this.setState({channel: channel});
			}
		});
	}
	
	removeCustomField(name) {
		let channel = this.state.channel;
		delete channel.custom_fields[name];
		this.setState({channel: channel});
	}
	
	renderCustomFields() {
		let regex_values = this.addRegexValues();
		
		return Object.keys(this.state.channel.custom_fields).map(name => {
			return (
				<div key={name}>
					<label>{name} <span title="Remove this custom field" className="faicon fa-remove" onClick={() => this.removeCustomField(name)}></span></label>
					<Select name={"custom_"+name} value={this.state.channel.custom_fields[name]} values={regex_values} filter={false} onChange={this.onChange} />
				</div>
			);
		});
	}
	
	render() {
		let channel = this.state.channel;
		let title = this.props.id?"Edit channel « "+channel.name+" »":"Create new channel";
		let submit = this.props.id?"Edit channel":"Create channel";
		
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
				<div className="formdiv">
					<div>
						<label>Name</label>
						<input type="text" name="name" value={channel.name} onChange={this.onChange} />
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
					<div>
						<label>Machine</label>
						<Select name="machine" value={channel.machine} values={regex_values} filter={false} onChange={this.onChange} />
					</div>
					<div>
						<label>Domain</label>
						<Select name="domain" value={channel.domain} values={regex_values} filter={false} onChange={this.onChange} />
					</div>
					<div>
						<label>IP</label>
						<Select name="ip" value={channel.ip} values={regex_values} filter={false} onChange={this.onChange} />
					</div>
					<div>
						<label>UID</label>
						<Select name="uid" value={channel.uid} values={regex_values} filter={false} onChange={this.onChange} />
					</div>
					<div>
						<label>Status</label>
						<Select name="status" value={channel.status} values={regex_values} filter={false} onChange={this.onChange} />
					</div>
					{this.renderCustomFields()}
					<div>
						<label><span title="Add custom field" className="faicon fa-plus" onClick={this.addCustomField}></span></label>
					</div>
				</div>
				<button className="submit" onClick={this.save}>{submit}</button>
			</Dialog>
		);
	}
}
