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

import {EventsUtils} from '../utils/events.js';

export class InputSpinner extends React.Component {
	constructor(props) {
		super(props);
		
		this.onChange = this.onChange.bind(this);
	}
	
	isValid(n) {
		if(n==='')
			return true;
		
		if(this.props.min!==undefined && n<this.props.min)
			return false;
		
		if(this.props.max!==undefined && n>this.props.max)
			return false;
		
		return true;
	}
	
	onChange(e) {
		let val = e.target.value;
		
		if(!val.match(/^[0-9]*$/))
			return;
		
		if(!this.isValid(val))
			return;
		
		this.props.onChange(e);
	}
	
	step(n) {
		let value = this.props.value==''?0:parseInt(this.props.value);
		let step = this.props.step!==undefined?this.props.step:1;
		let val = value+n*step;
		
		if(!this.isValid(val))
			return;
		
		let e = EventsUtils.createEvent(this.props.name, val);
		this.props.onChange(e);
		
	}
	
	render() {
		return (
			<div className="evq-input-spinner">
				<input type="text" name={this.props.name} value={this.props.value} onChange={this.onChange} />
				<span className="faicon fa-sort-up evq-input-spinner-plus" onClick={ (e) => this.step(1) } />
				<span className="faicon fa-sort-down evq-input-spinner-minus /" onClick={ (e) => this.step(-1) }></span>
			</div>
		);
	}
}
