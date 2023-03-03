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
import {Panel} from '../../../ui/panel.js';
import {Dialogs} from '../../../ui/dialogs.js';
import {Prompt} from '../../../ui/prompt.js';
import {EditLauncher} from '../../dialogs/storage/edit-launcher.js';
import {Launcher} from '../../dialogs/storage/launcher.js';

export class Launchers extends evQueueComponent {
	constructor(props) {
		super(props);
		
		this.state.launchers = {};
		this.state.group_launchers = {};
		this.state.groups = [];
		
		this.editLauncher = this.editLauncher.bind(this);
		this.removeLauncher = this.removeLauncher.bind(this);
	}
	
	componentDidMount() {
		let api = {node:'*', group:'launcher',action:'list'};
		this.Subscribe('LAUNCHER_CREATED',api);
		this.Subscribe('LAUNCHER_MODIFIED',api);
		this.Subscribe('LAUNCHER_REMOVED',api, true);
	}
	
	evQueueEvent(response, ref) {
		let data = this.parseResponse(response,'/response/*');
		
		let launchers = {};
		let group_launchers = {};
		let groups = [];
		for(let i=0;i<data.response.length;i++)
		{
			let launcher = data.response[i];
			let group = launcher.group?launcher.group:'No group';
			
			if(group_launchers[group]===undefined)
			{
				group_launchers[group] = [];
				groups.push(group);
			}
			
			group_launchers[group].push(launcher);
			launchers[launcher.id] = launcher;
		}
		
		groups.sort((a, b) => {
			if(a=='No group')
				return 1;
			if(b=='No group')
				return -1;
			return a>b;
		});
		
		this.setState({launchers: launchers, group_launchers: group_launchers, groups: groups});
	}
	
	editLauncher(e, id) {
		Dialogs.open(EditLauncher, {id: id, groups: this.state.groups});
	}
	
	removeLauncher(id, name) {
		this.simpleAPI({
			group: 'launcher',
			action: 'delete',
			attributes: { id: id }
		}, "Launcher has been deleted","You are about to delete launcher «\xA0"+name+"\xA0»");
	}
	
	launch(id) {
		Dialogs.open(Launcher, {id: id});
	}
	
	renderGroups() {
		return this.state.groups.map( (group) => {
			return (
				<React.Fragment key={"group_"+group}>
					<tr className="group"><td colSpan="4">{group}</td></tr>
					{ this.renderLaunchers(group) }
					{ this.renderSpacer(group) }
				</React.Fragment>
			);
		});
	}
	
	renderSpacer(group) {
		if(this.state.groups[this.state.groups.length-1]==group)
			return;
		return (<tr className="groupspace"><td colSpan="4"></td></tr>);
	}
	
	renderLaunchers(group) {
		return this.state.group_launchers[group].map( (launcher, idx) => {
			return (
				<tr key={launcher.id}>
					<td>
						{launcher.name}
						<span className="faicon fa-rocket" onClick={() => this.launch(launcher.id)}></span>
					</td>
					<td>{launcher.description}</td>
					<td className="tdActions">
						<span className="faicon fa-edit" title="Edit this launcher" onClick={(e) => { this.editLauncher(e, launcher.id); }}></span>
						<span className="faicon fa-remove" title="Delete this instance" onClick={() => { this.removeLauncher(launcher.id, launcher.name); }}></span>
					</td>
				</tr>
			);
		});
	}
	
	render() {
		let actions = [
			{icon:'fa-file-o', title: "Create new launcher", callback:this.editLauncher}
		];
		
		return (
			<div className="evq-workflows-list">
				<Panel noborder left="" title="Launchers" actions={actions}>
					<table className="border">
						<thead>
							<tr>
								<th>Name</th>
								<th>Comment</th>
								<th className="tdActions">Actions</th>
							</tr>
						</thead>
						<tbody>
							{ this.renderGroups() }
						</tbody>
					</table>
				</Panel>
			</div>
		);
	}
}
