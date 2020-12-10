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
import {Radios} from '../../../ui/radios.js';
import {Radio} from '../../../ui/radio.js';
import {Tabs} from '../../../ui/tabs.js';
import {Tab} from '../../../ui/tab.js';
import {Help} from '../../../ui/help.js';
import {Select} from '../../../ui/select.js';
import {Checkbox} from '../../../ui/checkbox.js';
import {Autocomplete} from '../../../ui/autocomplete.js';
import {App} from '../../base/app.js';
import {evQueueComponent} from '../../base/evqueue-component.js';
import {WorkflowSelector} from '../../base/workflow-selector.js';
import {GroupAutocomplete} from '../../base/group-autocomplete.js';
import {FilesystemAutocomplete} from '../../base/filesystem-autocomplete.js';
import {NodeSelector} from '../../base/node-selector.js';

export class EditWorkflowSchedule extends evQueueComponent {
	constructor(props) {
		super(props);
		
		this.state.workflow_schedule = {
			workflow_id: '',
			workflow_parameters: {},
			when: 'daily',
			schedule: false,
			time: '',
			seconds: ['any'],
			minutes: ['any'],
			hours:  ['any'],
			days: ['any'],
			months: ['any'],
			weekdays: ['any'],
			onfailure: 'CONTINUE',
			comment: '',
			user: '',
			host: '',
			node: 'any'
		};
		
		this.seconds = [];
		for(let i=0;i<60;i++)
			this.seconds.push(i);
		
		this.minutes = this.seconds;
		
		this.hours = [];
		for(let i=0;i<24;i++)
			this.hours.push(i);
		
		this.days = [];
		for(let i=1;i<=31;i++)
			this.days.push(i);
		
		this.times = [];
		for(let i=0;i<24;i++)
		{
			let h = (''+i).padStart(2,'0');
			this.times.push(h+':00');
			this.times.push(h+':30');
		}
		
		this.months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
		
		this.weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
		
		this.dlg = React.createRef();
		
		this.onChange = this.onChange.bind(this);
		this.save = this.save.bind(this);
	}
	
	componentDidMount() {
		if(this.props.id)
		{
			this.API({
				group: 'workflow_schedule',
				action: 'get',
				attributes: {id: this.props.id}	
			}).then( (response) => {
				let workflow_schedule = this.state.workflow_schedule;
				Object.assign(workflow_schedule, this.parseResponse(response).response[0]);
				
				// Parse schedule
				let schedule_parts = workflow_schedule.schedule.split(';');
				workflow_schedule.seconds = this.loadScheduleLevel(schedule_parts[0]);
				workflow_schedule.minutes = this.loadScheduleLevel(schedule_parts[1]);
				workflow_schedule.hours = this.loadScheduleLevel(schedule_parts[2]);
				workflow_schedule.days = this.loadScheduleLevel(schedule_parts[3]);
				workflow_schedule.months = this.loadScheduleLevel(schedule_parts[4]);
				workflow_schedule.weekdays = this.loadScheduleLevel(schedule_parts[5]);
				
				if(workflow_schedule.weekdays.length>0 && workflow_schedule.weekdays[0]!='any')
				{
					// Convert weekdays integer to strings (ie week days)
					for(let i=0;i<workflow_schedule.weekdays.length;i++)
						workflow_schedule.weekdays[i] = this.weekdays[(parseInt(workflow_schedule.weekdays[i])+6)%7];
				}
				
				if(workflow_schedule.seconds.length==1 && workflow_schedule.seconds[0]!='any'
				   && workflow_schedule.minutes.length==1 && workflow_schedule.minutes[0]!='any'
				   && workflow_schedule.hours.length==1 && workflow_schedule.hours[0]!='any'
				   && workflow_schedule.days.length==1 && workflow_schedule.days[0]=='any'
				   && workflow_schedule.months.length==1 && workflow_schedule.months[0]=='any'
				   && workflow_schedule.weekdays.length==1 && workflow_schedule.weekdays[0]=='any')
				{
					workflow_schedule.when = 'daily';
					workflow_schedule.time = workflow_schedule.hours[0].padStart(2,'0')+':'+workflow_schedule.minutes[0].padStart(2,'0');
				}
				else
					workflow_schedule.when = 'custom';
				
				this.setState({workflow_schedule: workflow_schedule});
			});
		}
	}
	
	loadScheduleLevel(level) {
		if(level=='')
			return ['any'];
		
		level = level.split(',');
		
		for(let i=0;i<level.length;i++)
			level[i] = parseInt(level[i]).toString();
		
		return level;
	}
	
	loadWorkflowParameters(id) {
		// Get parameters and custom attributes of this workflow
		this.API({
			group: 'workflow',
			action: 'get',
			attributes: {id: id}
		}).then( (response) => {
			let names = this.xpath('/response/workflow/workflow/parameters/parameter/@name', response.documentElement);
			let parameters = {};
			for(let i=0;i<names.length;i++)
				parameters[names[i]] = '';
			
			let workflow_schedule = this.state.workflow_schedule;
			workflow_schedule.workflow_parameters = parameters;
			this.setState({workflow_schedule: workflow_schedule});
		});
	}
	
	onChange(e) {
		let name = e.target.name;
		let value = e.target.value;
		
		let workflow_schedule = this.state.workflow_schedule;
		
		if(name.substr(0,10)=='parameter.')
			workflow_schedule.workflow_parameters[name.substr(10)] = value;
		else
			workflow_schedule[name] = value;
		
		if(name=='workflow_id')
			this.loadWorkflowParameters(value);
		
		
		if(name=='seconds' || name=='minutes' || name=='hours' || name=='days' || name=='months' || name=='weekdays')
		{
			if(workflow_schedule[name].length==0)
				workflow_schedule[name] = ['any'];
			else if(e.target.value2=='any')
				workflow_schedule[name] = ['any'];
			else if(workflow_schedule[name].length>1 && workflow_schedule[name].indexOf('any')!=-1)
				workflow_schedule[name].splice(workflow_schedule[name].indexOf('any'),1);
		}
		
		if(workflow_schedule.when=='custom')
		{
			let schedule_desc = [];
			schedule_desc.push(workflow_schedule.seconds.join(','));
			schedule_desc.push(workflow_schedule.minutes.join(','));
			schedule_desc.push(workflow_schedule.hours.join(','));
			schedule_desc.push(workflow_schedule.days.join(','));
			
			if(workflow_schedule.months.length>0 && workflow_schedule.months[0]!='any')
			{
				let months = workflow_schedule.months.map( (month) => this.months.indexOf(month) );
				schedule_desc.push(months.join(','));
			}
			else
				schedule_desc.push(workflow_schedule.months);
			
			if(workflow_schedule.weekdays.length>0 && workflow_schedule.weekdays[0]!='any')
			{
				let weekdays = workflow_schedule.weekdays.map( (weekday) => (this.weekdays.indexOf(weekday)+1)%7) ;
				schedule_desc.push(weekdays.join(','));
			}
			else
				schedule_desc.push(workflow_schedule.weekdays);
			
			schedule_desc = schedule_desc.map( (val) => val=='any'?'':val );
			workflow_schedule.schedule = schedule_desc.join(';');
		}
		else if(workflow_schedule.when=='daily')
		{
			workflow_schedule.schedule = false;
			if(workflow_schedule.time.match(/^[0-9]+:[0-9]+$/))
			{
				let time_parts = workflow_schedule.time.split(':');
				if(parseInt(time_parts[0])<24 && parseInt(time_parts[1])<60)
					workflow_schedule.schedule = '0;'+parseInt(time_parts[1])+';'+parseInt(time_parts[0])+';;;';
			}
		}
		
		this.setState({workflow_schedule: workflow_schedule});
	}
	
	save() {
		let workflow_schedule = this.state.workflow_schedule;
		if(workflow_schedule.schedule===false)
			return App.warning("Scheduled time is invalid");
		
		let action = this.props.id?'edit':'create';
		let action_name = this.props.id?'modified':'created';
		
		let attributes = {
			workflow_id: workflow_schedule.workflow_id,
			schedule: workflow_schedule.schedule,
			onfailure: workflow_schedule.onfailure,
			user: workflow_schedule.user,
			host: workflow_schedule.host,
			node: workflow_schedule.node,
			active: 'yes',
			comment: workflow_schedule.comment
		};
		
		if(this.props.id)
			attributes.id = this.props.id;
		
		this.simpleAPI({
			group: 'workflow_schedule',
			action: action,
			attributes: attributes,
			parameters: workflow_schedule.workflow_parameters
		}, "Schedule successfully "+action_name).then( () => {
			this.dlg.current.close();
		});
	}
	
	renderWorkflowParameters() {
		return Object.keys(this.state.workflow_schedule.workflow_parameters).map( (name) => {
			return (
				<div key={name}>
					<label>{name}</label>
					<input type="text" name={"parameter."+name} value={this.state.workflow_schedule.workflow_parameters[name]} onChange={this.onChange} />
				</div>
			);
		});
	}
	
	renderWhat() {
		let workflow_schedule = this.state.workflow_schedule;
		
		return (
			<div className="formdiv">
				<div>
					<label>Workflow</label>
					<WorkflowSelector name="workflow_id" value={workflow_schedule.workflow_id} onChange={this.onChange} />
				</div>
				{ this.renderWorkflowParameters() }
			</div>
		);
	}
	
	renderWhen() {
		let workflow_schedule = this.state.workflow_schedule;
		if(workflow_schedule.when=='daily')
		{
			return (
				<div className="formdiv">
					<div>
						<label>Every day at</label>
						<Autocomplete type="text" name="time" value={workflow_schedule.time} autocomplete={this.times} onChange={this.onChange} />
					</div>
				</div>
			);
		}
		
		if(workflow_schedule.when=='custom')
		{
			return (
				<div className="formdiv">
					<div>
						<label>Seconds</label>
						<Autocomplete name="seconds" value={workflow_schedule.seconds} autocomplete={['any'].concat(this.seconds)} multiple={true} onChange={this.onChange} />
					</div>
					<div>
						<label>Minutes</label>
						<Autocomplete name="minutes" value={workflow_schedule.minutes} autocomplete={['any'].concat(this.minutes)} multiple={true} onChange={this.onChange} />
					</div>
					<div>
						<label>Hours</label>
						<Autocomplete name="hours" value={workflow_schedule.hours} autocomplete={['any'].concat(this.hours)} multiple={true} onChange={this.onChange} />
					</div>
					<div>
						<label>Days</label>
						<Autocomplete name="days" value={workflow_schedule.days} autocomplete={['any'].concat(this.days)} multiple={true} onChange={this.onChange} />
					</div>
					<div>
						<label>Months</label>
						<Autocomplete name="months" value={workflow_schedule.months} autocomplete={['any'].concat(this.months)} multiple={true} onChange={this.onChange} />
					</div>
					<div>
						<label>Weekdays</label>
						<Autocomplete name="weekdays" value={workflow_schedule.weekdays} autocomplete={['any'].concat(this.weekdays)} multiple={true} onChange={this.onChange} />
					</div>
				</div>
			);
		}
	}
	
	renderProperties() {
		let workflow_schedule = this.state.workflow_schedule;
		return (
			<div className="formdiv">
				<div>
					<label>On error</label>
					<Select name="onfailure" value={workflow_schedule.onfailure} values={[{name: 'Suspend', value: 'SUSPEND'},{name: 'Continue', value: 'CONTINUE'}]} filter={false} onChange={this.onChange} />
				</div>
				<div>
					<label>Comment</label>
					<input type="text" name="comment" value={workflow_schedule.comment} onChange={this.onChange} />
				</div>
			</div>
		);
	}
	
	render() {
		let workflow_schedule = this.state.workflow_schedule;
		let title = this.props.id?"Edit schedule « "+workflow_schedule.name+" »":"Create new schedule";
		let submit = this.props.id?"Edit schedule":"Create schedule";
		
		return (
			<Dialog ref={this.dlg} title={title} width="700">
				<Tabs>
					<Tab title="General">
						<h2>
							General properties
							<Help>
								A scheduled workflow is the equivalent of a cron job. You can launch an existing workflow or a simple command line script (though a workflow will be created).
								<br /><br />
								The 'Daily' configuration is used to launch the task once a day. the 'Custom' mode is for more complex schedules, like in cron.
								<br /><br />
								If the workflow fails, you can choose to suspend the planification (On error: suspend), or continue normaly with the next planned date (On error: continue).
							</Help>
						</h2>
						<fieldset>
							<legend><b>What</b></legend>
							{ this.renderWhat() }
						</fieldset>
						<br />
						<fieldset>
							<legend>
								<b>When:</b>
								<Radios name="when" value={workflow_schedule.when} onChange={this.onChange}>
									<Radio value="daily" /> Daily
									<Radio value="custom" /> Custom
								</Radios>
							</legend>
							{ this.renderWhen() }
						</fieldset>
						<br />
						<fieldset>
							<legend>Properties</legend>
							{ this.renderProperties() }
						</fieldset>
					</Tab>
					<Tab title="Remote">
						<h2>
							Remote execution
							<Help>
								The workflow or task can be launched through SSH on a distant machine. Enter the user and host used for SSH connection.
							</Help>
						</h2>
						<div className="formdiv">
							<div>
								<label>User</label>
								<input type="text" name="user" value={workflow_schedule.user} onChange={this.onChange} />
							</div>
							<div>
								<label>Host</label>
								<input type="text" name="host" value={workflow_schedule.host} onChange={this.onChange} />
							</div>
						</div>
					</Tab>
					<Tab title="Node">
						<h2>
							Cluster node
							<Help>
								If you are using evQueue in a clustered environment, specify here the node on which the workflow will be launched.
								<br /><br />
								Two special nodes can be used. 'All' will launch the instance on all clustered nodes. 'Any' will launch the instance on a node elected amongst the online nodes, thus guaranteeing high availability.
							</Help>
						</h2>
						<div className="formdiv">
							<div>
								<label>Node</label>
								<NodeSelector name="node" value={workflow_schedule.node} all={true} any={true} onChange={this.onChange} />
							</div>
						</div>
					</Tab>
				</Tabs>
				<br />
				<button className="submit" onClick={this.save}>{submit}</button>
			</Dialog>
		);
	}
}
