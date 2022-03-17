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

export class CheckConfig extends evQueueComponent {
	constructor(props) {
		super(props);
		
		this.state.valid = 'yes'
		this.state.details = ''
		this.state.fields = {};
		this.state.log = '';
		
		this.dlg = React.createRef();
		
		this.renderFields = this.renderFields.bind(this);
		this.onChange = this.onChange.bind(this);
	}
	
	onChange(e) {
		this.setState({log: e.target.value});
		
		this.API({
			group: 'channel',
			action: 'testlog',
			attributes: {id: this.props.id, log: e.target.value}
		}).then( (response) => {
			let status = this.parseResponse(response);
			if(status.valid=='no')
				this.setState({valid: status.valid, details: status.details});
			else
				this.setState({valid: status.valid, fields: JSON.parse(status.fields)});
		});
	}
	
	renderFields(f, type) {
		if(!f)
			return;
		
		return (
			<fieldset className="tabbed">
				<legend>{type}</legend>
				{this.renderFieldsInner(f)}
			</fieldset>
		);
	}
	
	renderFieldsInner(f) {
		return Object.keys(f).map(name => {
			return (
				<div key={name}>
					<div>{name}</div>
					<div>{f[name]}</div>
				</div>
			);
		});
	}
	
	renderError() {
		if(this.state.valid=='yes')
			return;
		
		return (
			<div>
				<div>Error</div>
				<div className="error">{this.state.details}</div>
			</div>
		);
	}
	
	render() {
		return (
			<Dialog ref={this.dlg} title="Config check" width="700">
				<h2>
					Channel config check
					<Help>
						Here you can test your configuration by pasting a log line. You will see how fields are extracted.
					</Help>
				</h2>
				<div>
					<input className="fullwidth" type="text" value={this.state.log} onChange={this.onChange} />
					<br /><br />
					<fieldset className="tabbed">
						<legend>Result</legend>
						<div>
							<div>Valid</div>
							<div>{this.state.valid}</div>
						</div>
						{this.renderError()}
					</fieldset>
					{this.renderFields(this.state.fields.std, "Standard")}
					{this.renderFields(this.state.fields.custom, "Custom")}
				</div>
			</Dialog>
		);
	}
}
