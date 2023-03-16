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

export class Display extends evQueueComponent {
	constructor(props) {
		super(props);
		
		this.state.display = {
			path: '',
			orsder: 'ASC',
			item_title: '',
			item_content: ''
		};
		
		this.state.items = [];
	}
	
	componentDidMount() {
		let api = {node:'*', group:'display', action:'get', attributes: {id: this.props.id}};
		this.Subscribe('DISPLAY_MODIFIED', api, true, this.props.id);
	}
	
	evQueueEvent(response) {
		let display = this.parseResponse(response);
		
		this.get_variable(display.path).then(async v => {
			let items = [];
			if(v.structure=='MAP')
			{
				for(const [key, value] of Object.entries(v.value))
					items.push({key: key, value: value, title: display.item_title, content: display.item_content});
			}
			else
			{
				for(let i=0;i<v.value.length;i++)
					items.push({key: v.value[i], value: v.value[i], title: display.item_title, content: display.item_content});
			}
			
			
			// Replace variables in items
			for(let i=0;i<items.length;i++)
			{
				items[i].title = await this.replace_variables(items[i].title, items[i].key, items[i].value);
				items[i].content = await this.replace_variables(items[i].content, items[i].key, items[i].value);
			}
			
			if(display.order=='DESC')
				items.reverse();
			
			this.setState({
				items: items,
				display: {
					path: display.path,
					order: display.order,
					item_title: display.item_title,
					item_content: display.item_content
				}
			});
		});
	}
	
	get_variable(path) {
		return new Promise((resolve, reject) => {
			return this.API({
				group: 'storage',
				action: 'get',
				attributes: {path: path}
			}).then(response => {
				let variable = this.parseResponse(response);
				variable.value = JSON.parse(variable.value);
				resolve(variable);
			});
		});
	}
	
	async replaceAsync(str, regex, asyncFn) {
		const promises = [];
		str.replaceAll(regex, (match, ...args) => {
			const promise = asyncFn(match, ...args);
			promises.push(promise);
		});
		
		const data = await Promise.all(promises);
		return str.replaceAll(regex, () => data.shift());
	}

	
	async replace_variables(str, key, value) {
		str = str.replaceAll('$key', key);
		str = str.replaceAll('$value', value);
		str = await this.replaceAsync(str, /{([^}]+)}(\.([^\s]+))?/g, match => {
			return new Promise((resolve, reject) => {
				let parts = match.match(/{([^}]+)}(\.([^\s]+))?/);
				let path = parts[1];
				let key = parts[3];
				this.get_variable(path, key, value).then(v => {
					if(key!==undefined && v.structure!='MAP')
					{
						App.warning("Variable « " + path + " » used with key index but has not MAP structure");
						return resolve(match);
					}
					
					if(key===undefined && v.structure!='NONE')
					{
						App.warning("Variable « " + path + " » is structured, please use index key");
						return resolve(match);
					}
					
					let val = v.value;
					if(key!==undefined)
					{
						if(val[key]===undefined)
						{
							App.warning("Variable « " + path + " » do not have key « " + key +" »");
							return resolve(match);
						}
						
						val = val[key];
					}
					
					resolve(val);
				});
			});
		});
		
		return str;
	}
	
	renderItems() {
		return this.state.items.map((item, idx) => {
			return (
				<div key={idx}>
					<h2>{item.title}</h2>
					<pre>{item.content}</pre>
				</div>
			);
		});
	}
	
	render() {
		let display = this.state.display;
		return (
			<div className="evq-display">
				{this.renderItems()}
			</div>
		);
	}
}
