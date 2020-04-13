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
import {evQueueComponent} from '../../base/evqueue-component.js';
import {Dialog} from '../../../ui/dialog.js';
import {Help} from '../../../ui/help.js';
import {Select} from '../../../ui/select.js';
import {NotificationTypeSelector} from '../../base/notification-type-selector.js';
import {ConfigEditor} from '../../base/config-editor.js';

export class EditNotification extends evQueueComponent {
	constructor(props) {
		super(props);
		
		this.state.help = '';
		this.state.fields = [];
		this.state.base_config= {
			type_id: this.props.type_id!==undefined?this.props.type_id:0,
			name: '',
			subscribe_all: 'yes'
		};
		this.state.notification_config = {};
		
		this.dlg = React.createRef();
		
		this.onBaseChange = this.onBaseChange.bind(this);
		this.onNotificationChange = this.onNotificationChange.bind(this);
	}
	
	componentDidMount() {
		if(this.props.type_id!==undefined)
			this.getConfig(this.props.type_id, this.props.id);
	}
	
	onBaseChange(e) {
		let config = this.state.base_config;
		config[e.target.name] = e.target.value;
		this.setState({base_config: config});
		
		if(e.target.name=='type_id')
			this.getConfig(e.target.value);
	}
	
	onNotificationChange(e) {
		let config = this.state.notification_config;
		config[e.target.name] = e.target.value;
		this.setState({notification_config: config});
	}
	
	getConfig(type_id, id) {
		this.API({
			group: 'notification_type',
			action: 'get',
			attributes: {id: type_id}
		}).then( (xml) => {
			let help = this.xpath("/response/plugin/configuration/notification",xml.documentElement)[0].help;
			
			let config_fields = this.xpath("/response/plugin/configuration/notification/field",xml.documentElement);
			
			if(id!==undefined)
			{
				this.API({
					group: 'notification',
					action: 'get',
					attributes: {id: id}
				}).then( (xml) => {
					let data = this.xpath('/response/notification', xml.documentElement)[0];
					let base_config = this.state.base_config;
					base_config.subscribe_all = data.subscribe_all;
					base_config.name = data.name;
					
					let notif_config = JSON.parse(atob(data.parameters));
					
					this.setState({help: help, fields: config_fields, base_config: base_config, notification_config: notif_config});
					
				});
			}
			else
			{
				let notif_config = {type: type_id};
				for(let i=0;i<config_fields.length;i++)
					notif_config[config_fields[i].name] = '';
				
				this.setState({help: help, fields: config_fields, notification_config: notif_config});
			}
		});
	}
	
	save() {
		if(this.state.base_config.name=="")
			return App.warning("Name cannot be empty");
		
		if(!this.state.base_config.type_id)
			return App.warning("You must choose a type");
		
		let attributes = {
			type_id: this.state.base_config.type_id,
			name: this.state.base_config.name,
			subscribe_all: this.state.base_config.subscribe_all,
			parameters: btoa(JSON.stringify(this.state.notification_config))
		}
		
		if(this.props.id!==undefined)
			attributes.id = this.props.id;
		
		this.simpleAPI({
			group: 'notification',
			action: this.props.id===undefined?'create':'edit',
			attributes: attributes
		}, "Notification saved");
		
		this.dlg.current.close();
	}
	
	render() {
		return (
			<Dialog ref={this.dlg} title="Edit notification configuration" width="700">
				<h2>
					Notification configuration
					<Help>Choose a notification type (you must have installed plugins first) and follow the guidelines of the plugin</Help>
				</h2>
				<div>{this.state.help}</div>
				<div className="formdiv">
					<div>
						<label>Type</label>
						<NotificationTypeSelector name="type_id" value={this.state.base_config.type_id} onChange={this.onBaseChange} />
					</div>
					<div>
						<label>Name</label>
						<input type="text" name="name" value={this.state.base_config.name} onChange={this.onBaseChange} />
					</div>
					<div>
						<label>Subscribe all workflows</label>
						<Select name="subscribe_all" value={this.state.base_config.subscribe_all} values={[{name: 'yes', value: 'yes'},{name: 'no', value: 'no'}]} filter={false} onChange={this.onBaseChange} />
					</div>
				</div>
				<ConfigEditor fields={this.state.fields} values={this.state.notification_config} onChange={this.onNotificationChange} />
				<button className="submit" onClick={ (e)=> this.save() }>Save notification</button>
			</Dialog>
		);
	}
}
