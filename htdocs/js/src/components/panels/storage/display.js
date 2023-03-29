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
import {Markdown} from '../../../ui/markdown.js';

export class Display extends evQueueComponent {
	constructor(props) {
		super(props);
		
		this.state.display = {
			path: '',
			order: 'ASC',
			item_title: '',
			item_content: ''
		};
		
		this.state.items = [];
		this.state.current_items = [];
		
		this.state.page = 0;
		this.state.items_per_page = 10;
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
			
			if(display.order=='DESC')
				items.reverse();
			
			
			this.changePage(this.state.page, display, items);
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
		str = await this.replaceAsync(str, /\{([\p{L}\d_\/-]+)\}(\.([\p{L}\d_\/]+))?/gu, match => {
			return new Promise((resolve, reject) => {
				let parts = match.match(/\{([\p{L}\d_\/-]+)\}(\.([\p{L}\d_\/]+))?/u);
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
	
	async changePage(page, display = null, items = null) {
		if(display===null)
			display = this.state.display;
		
		if(items===null)
			items = this.state.items;
		
		let start_item = page * this.state.items_per_page;
		let end_item = start_item + this.state.items_per_page;
		let current_items = items.slice(start_item, end_item);
		
		// Replace variables in items
		for(let i=0;i<current_items.length;i++)
		{
			current_items[i].title = await this.replace_variables(current_items[i].title, current_items[i].key, current_items[i].value);
			current_items[i].content = await this.replace_variables(current_items[i].content, current_items[i].key, current_items[i].value);
		}
		
		this.setState({
			items: items,
			current_items: current_items,
			page: page,
			display: {
				path: display.path,
				order: display.order,
				item_title: display.item_title,
				item_content: display.item_content
			}
		});
	}
	
	renderItems() {
		return this.state.current_items.map((item, idx) => {
			return (
				<div key={idx}>
					<Markdown md={item.title} />
					<Markdown md={item.content} />
				</div>
			);
		});
	}
	
	render() {
		let page = this.state.page + 1;
		let npages = (this.state.items.length % this.state.items_per_page==0)?this.state.items.length/this.state.items_per_page:Math.trunc(this.state.items.length/this.state.items_per_page)+1;
		
		let display = this.state.display;
		return (
			<div className="evq-display">
				<div className="center">
					<span className="faicon fa-backward" onClick={ e => { if(page>1) this.changePage(this.state.page - 1); } }></span>
					&nbsp;{page} of {npages}
					<span className="faicon fa-forward" onClick={ e => { if(page<npages) this.changePage(this.state.page + 1); } }></span>
				</div>
				{this.renderItems()}
			</div>
		);
	}
}
