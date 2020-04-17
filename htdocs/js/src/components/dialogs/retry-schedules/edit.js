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
import {Checkbox} from '../../../ui/checkbox.js';
import {InputSpinner} from '../../../ui/input-spinner.js';
import {evQueueComponent} from '../../base/evqueue-component.js';
import {retry_schedule} from '../../../evqueue/retry-schedule.js';

export class EditRetrySchedule extends evQueueComponent {
	constructor(props) {
		super(props);
		
		this.state.retry_schedule = new retry_schedule();
		
		this.dlg = React.createRef();
		
		this.onChange = this.onChange.bind(this);
		this.addLevel = this.addLevel.bind(this);
		this.save = this.save.bind(this);
	}
	
	componentDidMount() {
		if(this.props.id)
		{
			this.API({
				group: 'retry_schedule',
				action: 'get',
				attributes: {id: this.props.id}	
			}).then( (response) => {
				let retry_schedule_obj = new retry_schedule();
				retry_schedule_obj.fromXML(response.documentElement.firstChild);
				this.setState({retry_schedule: retry_schedule_obj});
			});
		}
	}
	
	onChange(e, idx) {
		let name = e.target.name;
		let value = e.target.value;
		
		let retry_schedule = this.state.retry_schedule;
		
		if(idx===undefined)
			retry_schedule[name] = value;
		else
			retry_schedule.levels[idx][name] = value;
		
		this.setState({retry_schedule: retry_schedule});
	}
	
	addLevel() {
		let retry_schedule = this.state.retry_schedule;
		retry_schedule.addLevel();
		this.setState({retry_schedule: retry_schedule});
	}
	
	removeLevel(idx) {
		let retry_schedule = this.state.retry_schedule;
		retry_schedule.removeLevel(idx);
		this.setState({retry_schedule: retry_schedule});
	}
	
	save() {
		let action = this.props.id?'edit':'create';
		let action_name = this.props.id?'modified':'created';
		
		let attributes = {
			name: this.state.retry_schedule.name,
			content: btoa(this.state.retry_schedule.toXML())
		};
		
		if(this.props.id)
			attributes.id = this.props.id;
		
		this.simpleAPI({
			group: 'retry_schedule',
			action: action,
			attributes: attributes
		}, "Retry schedule successfully "+action_name).then( () => {
			this.dlg.current.close();
		});
	}
	
	renderLevels() {
		return this.state.retry_schedule.levels.map( (level, idx) => {
			return (
				<div key={idx}>
					<label>{idx==0?"If task fails, retry":"then"}</label>
					<span>
						every&#160;
						<InputSpinner name="delay" step="1" min="1" value={level.delay} onChange={ (e) => this.onChange(e, idx) } />
						&#160;seconds for&#160;
						<InputSpinner name="times" step="1" min="1" value={level.times} onChange={ (e) => this.onChange(e, idx) } />
						&#160;times
						&#160;
						<span className="faicon fa-remove" title="Remove this level" onClick={ (e) => this.removeLevel(idx) } />
					</span>
				</div>
			);
		});
	}
	
	render() {
		let retry_schedule = this.state.retry_schedule;
		let title = this.props.id?"Edit retry schedule « "+retry_schedule.name+" »":"Create new retry schedule";
		let submit = this.props.id?"Edit retry schedule":"Create retry schedule";
		
		return (
			<Dialog ref={this.dlg} title={title} width="700">
				<h2>
					Retry schedule description
					<Help>
						Retry schedules are used to relaunch a task when it fails. The task will not be considered failed as long as all retries have not been executed. This is especially useful for tasks that are accessing remote serices like FTP or Webservices.
						<br /><br />
						For this to work you have to set the retry schedule in the task properties of the workflow editor.
					</Help>
				</h2>
				<div className="formdiv">
					<div>
						<label>Name</label>
						<input type="text" name="name" value={retry_schedule.name} onChange={this.onChange} />
					</div>
					{ this.renderLevels() }
					<div>
						<label>
							<span className="faicon fa-plus" title="Add a new level" onClick={this.addLevel}/>
						</label>
					</div>
				</div>
				<button className="submit" onClick={this.save}>{submit}</button>
			</Dialog>
		);
	}
}
