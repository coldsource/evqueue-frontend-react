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
import {InputSpinner} from '../../../ui/input-spinner.js';
import {Select} from '../../../ui/select.js';
import {FieldTypeSelector} from '../../base/field-type-selector.js';
import {evQueueComponent} from '../../base/evqueue-component.js';
import {ELogsFilters} from '../../panels/logs/elogs-filters.js';

export class EditAlert extends evQueueComponent {
	constructor(props) {
		super(props);
		
		this.state.alert = {
			occurencies: 1,
			period: 1,
			group: ''
		};
		
		this.dlg = React.createRef();
		
		this.onChange = this.onChange.bind(this);
		this.filterChange = this.filterChange.bind(this);
		this.save = this.save.bind(this);
		
	}
	
	componentDidMount() {
	}
	
	onChange(e) {
		let name = e.target.name;
		let value = e.target.value;
		console.log(name);
		console.log(value);
		
		let alert = this.state.alert;
		alert[name] = value;
		this.setState({alert: alert});
	}
	
	filterChange(filters) {
		console.log(filters);
	}
	
	save() {
	}
	
	render() {
		let alert = this.state.alert;
		let title = this.props.id?"Edit alert « "+alert.name+" »":"Create new alert";
		let submit = this.props.id?"Edit alert":"Create alert";
		
		return (
			<Dialog ref={this.dlg} title={title} width="700">
				<h2>
					Alert properties
					<Help>
						Alerts will allow you to call notification plugins when specific logs are matched. Here you will be able to configure filters, and a number of occurencies that are needed to trigger the alert.
					</Help>
				</h2>
				<Tabs>
					<Tab title="Filters">
						<ELogsFilters panel={false} datefilter={false} onChange={this.filterChange} />
					</Tab>
					<Tab title="Trigger">
						<div className="formdiv">
							<div>
								<label>Occurencies</label>
								<InputSpinner type="text" name="occurencies" value={alert.occurencies} onChange={this.onChange} min="1" />
							</div>
							<div>
								<label>Time period (minutes)</label>
								<InputSpinner type="text" name="period" value={alert.period} onChange={this.onChange} min="1" />
							</div>
							<div>
								<label>Group by</label>
								...
							</div>
						</div>
					</Tab>
					<Tab title="Notifications">
						<div>Notifications</div>
					</Tab>
				</Tabs>
				<button className="submit" onClick={this.save}>{submit}</button>
			</Dialog>
		);
	}
}
