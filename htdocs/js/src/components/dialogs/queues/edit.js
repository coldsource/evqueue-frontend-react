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

import {evQueueComponent} from '../../base/evqueue-component.js';

export class EditQueue extends evQueueComponent {
	constructor(props) {
		super(props);
		
		this.state.queue = {
			name: '',
			concurrency: '',
			scheduler: 'default',
			dynamic: 'no',
		}
		
		this.dlg = React.createRef();
		
		this.onChange = this.onChange.bind(this);
		this.save = this.save.bind(this);
	}
	
	componentDidMount() {
		if(this.props.id)
		{
			this.API({
				group: 'queue',
				action: 'get',
				attributes: {id: this.props.id}	
			}).then( (response) => {
				let queue = this.parseResponse(response).response[0];
				this.setState({queue: queue});
			});
		}
	}
	
	onChange(e) {
		let name = e.target.name;
		let value = e.target.value;
		
		if(name=='dynamic')
			value = value?'yes':'no';
		
		if(name=='concurrency' && !/^[0-9]*$/.test(value))
			return;
		
		let queue = this.state.queue;
		queue[name] = value;
		this.setState({queue: queue});
	}
	
	save() {
		let action = this.props.id?'edit':'create';
		let action_name = this.props.id?'modified':'created';
		
		let attributes = this.state.queue;
		if(this.props.id)
			attributes.id = this.props.id;
		
		this.simpleAPI({
			group: 'queue',
			action: action,
			attributes: attributes
		}, "Queue successfully "+action_name).then( () => {
			this.dlg.current.close();
		});
	}
	
	render() {
		let queue = this.state.queue;
		let title = this.props.id?"Edit queue « "+queue.name+" »":"Create new queue";
		let submit = this.props.id?"Edit queue":"Create queue";
		
		return (
			<Dialog ref={this.dlg} title={title} width="700">
				<h2>
					Queue properties
					<Help>
						Queues are used to limit tasks parallelism. Queues are global amongst jobs and workflows.
						<br /><br />
						Concurrency defines the maximum number of tasks in this queue that can be executed simultaneously. Other tasks will be queued and executed when other tasks are terminated.
						<br /><br />
						Scheduler defines how the queue behaves. Fifo scheduler guarantees that tasks are executed in the same order they are placed in the queue. Prio scheduler will first execute tasks of older workflows, even if they are added later in the queue.
						<br /><br />
						Dynamic queues are used for remote execution. A dynamic queue will be created for each different host, and then destructed when it is no longer needed. So the concurrency is intended per host.
					</Help>
				</h2>
				<div className="formdiv">
					<div>
						<label>Name</label>
						<input type="text" name="name" value={queue.name} onChange={this.onChange} />
					</div>
					<div>
						<label>Concurrency</label>
						<input type="text" name="concurrency" value={queue.concurrency} onChange={this.onChange} />
					</div>
					<div>
						<label>Scheduler</label>
						<Select name="scheduler" value={queue.scheduler} values={[{name: 'default', value: 'default'},{name: 'fifo', value: 'fifo'},{name: 'prio', value: 'prio'}]} onChange={this.onChange} />
					</div>
					<div>
						<label>Dynamic</label>
						<Checkbox name="dynamic" value={queue.dynamic=='yes'?true:false} onChange={this.onChange} />
					</div>
				</div>
				<button className="submit" onClick={this.save}>{submit}</button>
			</Dialog>
		);
	}
}
