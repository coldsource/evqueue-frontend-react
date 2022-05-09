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
import {Tabs} from '../../../ui/tabs.js';
import {Tab} from '../../../ui/tab.js';
import {Select} from '../../../ui/select.js';
import {FieldTypeSelector} from '../../base/field-type-selector.js';
import {evQueueComponent} from '../../base/evqueue-component.js';


import {CheckConfig} from './check-config.js';

export class EditChannel extends evQueueComponent {
	constructor(props) {
		super(props);
		
		this.state.channel = {
			name: '',
			group_id: '',
			regex: '',
			date_format: '',
			date_field: '',
			crit: 'LOG_NOTICE',
			fields: {},
			group_matches: {},
			matches: {}
		};
		
		this.state.date_type = 'auto';
		this.state.groups = [];
		this.state.group_fields = {};
		this.state.regex_error = '';
		this.state.config_checker = false;
		
		this.dlg = React.createRef();
		this.dlg_checker = undefined;
		
		this.onChange = this.onChange.bind(this);
		this.dateTypeChange = this.dateTypeChange.bind(this);
		this.save = this.save.bind(this);
		this.renderRegexError = this.renderRegexError.bind(this);
		this.addField = this.addField.bind(this);
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
			}).then(response=> {
				let resp = this.parseResponse(response);
				let channel = this.state.channel;
				channel.group_id = resp.group_id;
				channel.name = resp.name;
				
				delete resp.config.fields;
				Object.assign(channel, JSON.parse(resp.config));
				
				let date_type = 'manual';
				if(channel.date_format=='auto')
				{
					date_type = 'auto';
					channel.date_format = '';
				}
				
				let fields = {};
				for(let i=0;i<resp.response.length;i++)
				{
					fields[resp.response[i].name] = {
						id: parseInt(resp.response[i].id),
						type: resp.response[i].type
					}
				}
				channel.fields = fields;
				
				this.setState({date_type: date_type, channel: channel});
				
				this.updateGroupFields(channel.group_id);
			});
		}
	}
	
	updateGroupFields(id) {
		this.API({
			group: 'channel_group',
			action: 'get',
			attributes: {id: id}
		}).then(response => {
			let data = this.parseResponse(response);
			let group_fields = {};
			for(let i=0;i<data.response.length;i++)
				group_fields[data.response[i].name] = data.response[i].type;
			this.setState({group_fields: group_fields});
		});
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
		
		if(name=='group_id')
			this.updateGroupFields(value);
		
		let channel = this.state.channel;
		
		if(name.substr(0,6)=='field_')
			channel.fields[name.substr(6)].type = value;
		else if(name.substr(0,11)=='groupmatch_')
			channel.group_matches[name.substr(11)] = value;
		else if(name.substr(0,6)=='match_')
			channel.matches[name.substr(6)] = value;
		else
			channel[name] = value;
		
		this.setState({channel: channel});
		
		if(this.state.config_checker)
			this.dlg_checker.current.setConfig(channel);
	}
	
	dateTypeChange(e) {
		let val = e.target.value;
		
		let channel = this.state.channel;
		
		if(val=='auto')
		{
			channel.date_format = 'auto';
			channel.date_field = '';
		}
		else
		{
			channel.date_format = '';
			channel.date_field = '';
		}
		
		this.setState({date_type: val, channel: channel});
		
		if(this.state.config_checker)
			this.dlg_checker.current.setConfig(channel);
	}
	
	save() {
		let action = this.props.id?'edit':'create';
		let action_name = this.props.id?'modified':'created';
		
		let config = {};
		Object.assign(config, this.state.channel);
		
		delete config.name;
		delete config.group_id;
		
		// Delete empty fields of config
		for(name in config)
		{
			if(!config[name])
				delete config[name];
		}
		
		if(this.state.date_type=='auto')
			config.date = 'auto'; // Special date format if auto is requested
		
		let attributes = {
			name: this.state.channel.name,
			group_id: this.state.channel.group_id,
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
	
	addField() {
		Dialogs.open(Prompt,{
			content: "Please enter your custom field's name",
			placeholder: "Cusrtom field name",
			width: 500,
			confirm: (name) => {
				let channel = this.state.channel;
				channel.fields[name] = {type: 'CHAR'};
				this.setState({channel: channel});
			}
		});
	}
	
	removeField(name) {
		let channel = this.state.channel;
		delete channel.fields[name];
		this.setState({channel: channel});
	}
	
	renderFieldsType() {
		let regex_values = this.addRegexValues();
		
		return Object.keys(this.state.channel.fields).map(name => {
			return (
				<div key={name}>
					<label>{name} <span title="Remove this custom field" className="faicon fa-remove" onClick={() => this.removeField(name)}></span></label>
					<FieldTypeSelector name={"field_"+name} value={this.state.channel.fields[name].type} values={regex_values} filter={false} onChange={this.onChange} />
				</div>
			);
		});
	}
	
	renderFieldsGroupMatch() {
		let regex_values = this.addRegexValues();
		
		return Object.keys(this.state.group_fields).map(name => {
			return (
				<div key={name}>
					<label>{name}</label>
					<Select name={"groupmatch_"+name} value={this.state.channel.group_matches[name]} values={regex_values} filter={false} onChange={this.onChange} />
				</div>
			);
		});
	}
	
	renderFieldsMatch() {
		let regex_values = this.addRegexValues();
		
		return Object.keys(this.state.channel.fields).map(name => {
			return (
				<div key={name}>
					<label>{name}</label>
					<Select name={"match_"+name} value={this.state.channel.matches[name]} values={regex_values} filter={false} onChange={this.onChange} />
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
	
	renderDateFormatSelector() {
		if(this.state.date_type=='auto')
			return;
		
		let regex_values = this.addRegexValues();
		
		return (
			<React.Fragment>
				<div>
					<label>Date format</label>
					<input type="text" name="date_format" placeholder="%Y-%m-%d %H:%M:%S" value={this.state.channel.date_format} onChange={this.onChange} />
				</div>
				<div>
					<label>Date field</label>
					<Select name={"date_field"} value={this.state.channel.date_field} values={regex_values} filter={false} onChange={this.onChange} />
				</div>
			</React.Fragment>
		);
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
						<br /><br />Date can be automatically set to the reception date of the log line or you can choose to match it from regular expression capture group. In this case, you must specify a format patter to parse the date, see C function strptime for a list of allowed fields.
						<br /><br />Criticality can be either fixed for all channel logs, or matched from the regular expression capture groupe.
					</Help>
				</h2>
				<Tabs>
					<Tab title="Fields">
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
								<label>Date type</label>
								<Select name="date" value={this.state.date_type} values={[{name: 'Automatic', value: 'auto'}, {name: 'Manual', value: 'manual'}]} filter={false} onChange={this.dateTypeChange} />
							</div>
							{this.renderDateFormatSelector()}
							<div>
								<label>Criticality</label>
								<Select name="crit" value={channel.crit} values={crit_values} filter={false} onChange={this.onChange} />
							</div>
							{this.renderFieldsType()}
							<div>
								<label><span title="Add custom field" className="faicon fa-plus" onClick={this.addField}></span></label>
							</div>
						</div>
					</Tab>
					<Tab title="Matching">
						<button onClick={this.toggleConfigCheck}>{config_checker_label}</button>
						<div className="formdiv">
							<div>
								<label>Regex</label>
								<input type="text" name="regex" value={channel.regex} onChange={this.onChange} />
								{this.renderRegexError()}
							</div>
							{this.renderFieldsGroupMatch()}
							{this.renderFieldsMatch()}
						</div>
					</Tab>
				</Tabs>
				<button className="submit" onClick={this.save}>{submit}</button>
			</Dialog>
		);
	}
}
