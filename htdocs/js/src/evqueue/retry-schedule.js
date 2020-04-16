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

import {DOMUtils} from '../utils/DOM.js';

export class retry_schedule {
	constructor()
	{
		this.name = '';
		this.levels = [];
	}
	
	addLevel() {
		this.levels.push({delay: '', times: ''});
	}
	
	removeLevel(idx) {
		this.levels.splice(idx, 1);
	}

	fromXML(schedule_node) {
		this.name = schedule_node.getAttribute('name');
		
		let level_ite = schedule_node.ownerDocument.evaluate('level', schedule_node);
		let level_node;
		while(level_node = level_ite.iterateNext())
		{
			let level = {};
			level.delay = level_node.getAttribute('retry_delay');
			level.times = level_node.getAttribute('retry_times');
			this.levels.push(level);
		}
	}
	
	toXML() {
		let xmldoc = new Document();
		
		let schedule_node = xmldoc.appendChild(xmldoc.createElement('schedule'));
		
		for(let i=0;i<this.levels.length;i++)
		{
			let level_node = schedule_node.appendChild(xmldoc.createElement('level'));
			level_node.setAttribute('retry_delay', this.levels[i].delay);
			level_node.setAttribute('retry_times', this.levels[i].times);
		}
		
		let xml = new XMLSerializer().serializeToString(xmldoc);
		console.log(xml);
		return xml;
	}
}
