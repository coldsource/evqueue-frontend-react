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
import {ConfigEditor} from '../../base/config-editor.js';

import {evQueueComponent} from '../../base/evqueue-component.js';

export class EditNotificationPlugin extends evQueueComponent {
	constructor(props) {
		super(props);
		
		this.state.help = '';
		this.state.fields = [];
		this.state.values =  {};
		
		this.dlg = React.createRef();
		
		this.onChange = this.onChange.bind(this);
	}
	
	componentDidMount() {
		this.getConfig(this.props.id);
	}
	
	onChange(e) {
		let values = this.state.values;
		values[e.target.name] = e.target.value;
		this.setState({values: values});
	}
	
	getConfig(id) {
		this.API({
			group: 'notification_type',
			action: 'get',
			attributes: {id: id}
		}).then( (xml) => {
			let help = this.xpath("/response/plugin/configuration/plugin",xml.documentElement)[0].help;
			
			let config_fields = this.xpath("/response/plugin/configuration/plugin/field",xml.documentElement);
			
			this.API({
				group: 'notification_type',
				action: 'get_conf',
				attributes: {id: id}
			}).then( (response) => {
				let json = this.parseResponse(response).response[0].content;
				let config = {};
				if(json=="")
				{
					for(let i=0;i<config_fields.length;i++)
						config[config_fields[i].name] = '';
				}
				else
					config = JSON.parse(atob(json));
				
				this.setState({help: help, fields: config_fields, values: config});
			});
		});
	}
	
	save(values) {
		this.simpleAPI({
			group: 'notification_type',
			action: 'set_conf',
			attributes: {id: this.props.id, content: btoa(JSON.stringify(this.state.values))}
		}, "Configuration saved");
	}
	
	render() {
		return (
			<Dialog ref={this.dlg} title="Edit plugin configuration" width="700">
				<h2>
					Plugin configuration
					<Help>{this.state.help}</Help>
				</h2>
				<ConfigEditor fields={this.state.fields} values={this.state.values} onChange={this.onChange} />
				<button className="submit" onClick={ (e)=> { this.save(); this.dlg.current.close(); } }>Save configuration</button>
			</Dialog>
		);
	}
}
