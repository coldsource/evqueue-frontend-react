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

import {App} from '../components/base/app.js';
import {EventsUtils} from '../utils/events.js';
import {InputSpinner} from './input-spinner.js';
import {Dialogs} from './dialogs.js';
import {Prompt} from './prompt.js';

export class Variable extends React.Component {
	constructor(props) {
		super(props);
		
		this.onChange = this.onChange.bind(this);
	}
	
	onChange(e, key) {
		let value = this.props.value;
		if(key!==false)
			value[key] = e.target.value;
		else
			value = e.target.value;
		
		this.props.onChange(EventsUtils.createEvent(this.props.name, value));
	}
	
	renderStructure() {
		if(this.props.structure=='NONE')
		{
			return (
				<div>
					<label><b>Value</b></label>
					{this.renderVariable()}
				</div>
			);
		}
		else if(this.props.structure=='ARRAY')
		{
			return (
				<React.Fragment>
					{this.renderStructureArray()}
					<div>
						<label></label>
						<span className="faicon fa-plus" onClick={ e => {
							this.props.value.push('');
							this.onChange(EventsUtils.createEvent(this.props.name, this.props.value), false);
						}}></span>
					</div>
				</React.Fragment>
			);
		}
		else if(this.props.structure=='MAP')
		{
			return (
				<React.Fragment>
					{this.renderStructureMap()}
					<div>
						<label></label>
						<span className="faicon fa-plus" onClick={ e => {
							Dialogs.open(Prompt,{
								content: "Please entry key",
								placeholder: "key",
								width: 300,
								confirm: (key) => {
									if(this.props.value[key]!==undefined)
									{
										App.warning("Key already exist");
										return false;
									}
									
									if(key=='')
									{
										App.warning("Key cannot be empty");
										return false;
									}
									
									this.props.value[key] = '';
									this.onChange(EventsUtils.createEvent(this.props.name, this.props.value), false);
								}
							});
						}}></span>
					</div>
				</React.Fragment>
			);
		}
	}
	
	renderStructureArray() {
		return this.props.value.map((v, idx) => {
			return (
				<div key={idx}>
					<label><b>{idx}</b></label>
					{this.renderVariable(idx)}
					<span className="faicon fa-remove" onClick= { e => {
						this.props.value.splice(idx, 1);
						this.onChange(EventsUtils.createEvent(this.props.name, this.props.value), false);
					}}></span>
				</div>
			);
		});
	}
	
	renderStructureMap() {
		return Object.keys(this.props.value).map((key) => {
			return (
				<div key={key}>
					<label><b>{key}</b></label>
					{this.renderVariable(key)}
					<span className="faicon fa-remove" onClick= { e => {
						delete this.props.value[key];
						this.onChange(EventsUtils.createEvent(this.props.name, this.props.value), false);
					}}></span>
				</div>
			);
		});
	}
	
	renderVariable(key = false) {
		let value = this.props.value;
		if(key!==false)
			value = value[key];
		
		if(this.props.type=='STRING')
			return (<input type="text" name={this.props.name} value={value} onChange={e => this.onChange(e, key)} />);
		else if(this.props.type=='INT')
			return (<InputSpinner name={this.props.name} value={value} onChange={e => this.onChange(e, key)} />);
	}
	
	render() {
		return (
			<div className="evq-variable">
				<div className="formdiv">
					{this.renderStructure()}
				</div>
			</div>
		);
	}
}
