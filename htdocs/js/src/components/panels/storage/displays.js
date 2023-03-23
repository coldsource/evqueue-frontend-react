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
import {Tabs} from '../../../ui/tabs.js';
import {Tab} from '../../../ui/tab.js';
import {EditDisplay} from '../../dialogs/storage/edit-display.js';
import {Display} from './display.js';

export class Displays extends evQueueComponent {
	constructor(props) {
		super(props);
		
		this.state.displays = [];
		
		this.editDisplay = this.editDisplay.bind(this);
		this.removeDisplay = this.removeDisplay.bind(this);
	}
	
	componentDidMount() {
		let api = {node:'*', group:'displays',action:'list'};
		this.Subscribe('DISPLAY_CREATED',api);
		this.Subscribe('DISPLAY_MODIFIED',api);
		this.Subscribe('DISPLAY_REMOVED',api, true);
	}
	
	evQueueEvent(response, ref) {
		let displays = this.parseResponse(response,'/response/*').response;
		displays.sort();
		this.setState({displays: displays});
	}
	
	editDisplay(e, id) {
		Dialogs.open(EditDisplay, {id: id});
	}
	
	removeDisplay(id, name) {
		this.simpleAPI({
			group: 'display',
			action: 'delete',
			attributes: { id: id }
		}, "Display has been deleted","You are about to delete display «\xA0"+name+"\xA0»");
	}
	
	renderDisplays() {

		return this.state.displays.map( (display, idx) => {
			return (
				<Tab key={display.id} title={display.name} action={{icon: 'fa-edit', callback: (e) => { this.editDisplay(e, display.id); }}}>
					<Display id={display.id} />
				</Tab>
			);
		});
	}
	
	render() {
		let actions = [
			{icon:'fa-file-o', title: "Create new display", callback:this.editDisplay}
		];
		
		return (
			<div className="evq-displays-list">
				<Panel noborder left="" title="Displays" actions={actions}>
					<Tabs>
						{this.renderDisplays()}
					</Tabs>
				</Panel>
			</div>
		);
	}
}
