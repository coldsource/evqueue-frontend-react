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

import {evQueueComponent} from '../../base/evqueue-component.js';
import {Panel} from '../../../ui/panel.js';
import {Dialogs} from '../../../ui/dialogs.js';
import {EditVariable} from '../../dialogs/storage/edit-variable.js';

export class Variables extends evQueueComponent {
	constructor(props) {
		super(props);
		
		this.state.tree = {subdirs: {}, variables: {}};
		this.state.collapsed = {};
		
		this.editVariable = this.editVariable.bind(this);
	}
	
	componentDidMount() {
		let api = {node:'*', group:'storage', action:'list', attributes: {path: '', recursive: 'yes'}};
		
		this.Subscribe('VARIABLE_UNSET',api);
		this.Subscribe('VARIABLE_SET',api,true);
	}
	
	evQueueEvent(data) {
		let root = {
			subdirs: {},
			variables: {}
		};
		
		for(let v of this.parseResponse(data).response)
		{
			let curdir = root;
			for(let dir of v.path.split('/'))
			{
				if(curdir.subdirs[dir]===undefined)
					curdir.subdirs[dir] = {subdirs: {}, variables: {}};
				
				curdir = curdir.subdirs[dir];
			}
			
			curdir.variables[v.name] = v.id;
		}
		
		this.setState({tree: root});
	}
	
	editVariable(e, id) {
		Dialogs.open(EditVariable, {id: id});
	}
	
	removeVariable(id, name) {
		this.simpleAPI({
			group: 'storage',
			action: 'unset',
			attributes: {id: id}
		}, "Variable successfully removed", "Are you sure you want to delete «\xA0" + name + "\xA0»");
	}
	
	renderTree(parent) {
		return Object.keys(parent.subdirs).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())).map((dir, idx, dirs) => {
			let islast = (idx==dirs.length-1 && Object.keys(parent.variables).length==0);
			let collapsed = this.state.collapsed[dir]!==undefined && this.state.collapsed[dir];
			return (
				<React.Fragment key={dir}>
					<div className={"dir" + (islast?' last':'')}>
						
						<span className={"faicon " + (collapsed?"fa-plus":"fa-minus")} onClick={ () => {this.state.collapsed[dir] = !collapsed; this.setState({collapsed: this.state.collapsed}); } }></span>
						<span className="faicon fa-folder-o"></span> {dir}
					</div>
					<div className={"dircontent" + (islast?' last':'')}>
						{collapsed?null:this.renderTree(parent.subdirs[dir])}
						{collapsed?null:this.renderVariables(parent.subdirs[dir].variables)}
					</div>
				</React.Fragment>
			);
		});
	}
	
	renderVariables(variables) {
		return Object.keys(variables).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())).map((name, idx, vars) => {
			let islast = (idx==vars.length-1);
			return (
				<div className="dir" key={name}>
					<span className={"left" + (islast?' last':'')}><span></span></span>
					<span className="faicon fa-hashtag"></span>
					<span className="varname" onClick={ e => this.editVariable(e, variables[name]) }>{name}</span>
					<span className="faicon fa-remove" onClick={e => this.removeVariable(variables[name], name)}></span>
				</div>
			);
		});
	}
	
	render() {
		let actions = [
			{icon:'fa-file-o', title: "Create new variable", callback:this.editVariable}
		];
		
		return (
			<div className="evq-storage-variables">
				<Panel noborder left="" title="Variables tree" actions={actions}>
					<div className="tree">
						<div className="dircontent last">
							{this.renderTree(this.state.tree)}
						</div>
					</div>
				</Panel>
			</div>
		);
	}
}
