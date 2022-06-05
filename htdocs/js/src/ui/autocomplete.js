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

export class Autocomplete extends React.Component {
	constructor(props) {
		super(props);
		
		this.state = {
			dropdown_opened: false,
			filter: '',
			value: ''
		};
		
		this.ref = React.createRef();
		
		this.toggleDropdown = this.toggleDropdown.bind(this);
		this._mouseDown = this._mouseDown.bind(this);
		this._keyUp= this._keyUp.bind(this);
		this.click = this.click.bind(this);
		this.applyFilter = this.applyFilter.bind(this);
		this.changeValue = this.changeValue.bind(this);
	}
	
	componentDidMount() {
		document.addEventListener('mousedown', this._mouseDown);
		
		this.global_width = window.getComputedStyle(this.ref.current).getPropertyValue('width');
	}
	
	componentWillUnmount() {
		document.removeEventListener('mousedown', this._mouseDown);
  }
  
  _mouseDown(event) {
		if(this.ref.current && !this.ref.current.contains(event.target))
			this.setState({dropdown_opened:false});
	}
	
	_keyUp(e) {
		 if(e.keyCode!==13)
			 return;
		 
		 this.submit(this.props.value);
	}
	
	submit(value) {
		this.setState({dropdown_opened: false});
		
		if(this.props.onSubmit)
			 this.props.onSubmit(value);
	}
	
	click(value) {
		this.setState({dropdown_opened:false});
		
		let e = EventsUtils.createEvent(this.props.name, value);
		if(this.props.multiple)
		{
			for(let i=0;i<this.props.value.length;i++)
			{
				if(this.props.value[i]==value)
					return;
			}
			
			let new_value = this.props.value.concat();
			new_value.push(value);
			this.sortValue(new_value);
			this.setState({value: ''});
			
			e.target.value = new_value;
			e.target.value2 = value;
		}
		
		if(this.props.onChange)
			this.props.onChange(e);
		
		if(this.props.onChoose)
			this.props.onChoose(value);
	}
	
	removeValue(idx) {
		this.props.value.splice(idx, 1);
		
		if(this.props.onChange)
			this.props.onChange(EventsUtils.createEvent(this.props.name, this.props.value));
	}
	
	toggleDropdown() {
		this.setState({dropdown_opened: !this.state.dropdown_opened});
	}
	
	applyFilter() {
		let filter;
		if(this.props.multiple)
			filter = this.state.value;
		else
			filter = this.props.value;
		
		if(filter!==undefined)
			filter = filter.toLowerCase()
		else
			filter = '';
		
		if(filter=='')
			return this.props.autocomplete;
		
		let autocomplete = [];
		for(let i=0;i<this.props.autocomplete.length;i++)
		{
			if((''+this.props.autocomplete[i]).toLowerCase().includes(filter))
				autocomplete.push(''+this.props.autocomplete[i]);
		}
		
		return autocomplete;
	}
	
	changeValue(value) {
		if(this.props.multiple)
			this.setState({value: value});
		else
			this.props.onChange(EventsUtils.createEvent(this.props.name, value));
	}
	
	sortValue(val) {
		let autocomplete = {};
		for(let i=0;i<this.props.autocomplete.length;i++)
			autocomplete[this.props.autocomplete[i]] = i;
		
		val.sort( (a,b) => {
			return autocomplete[a] - autocomplete[b];
		});
	}
	
	renderDropdown() {
		if(!this.state.dropdown_opened)
			return;
		
		return (
			<div className="evq-autocomplete-dropdown" style={{width:this.global_width}}>
				<ul>{this.renderAutocomplete()}</ul>
			</div>
		);
	}
	
	renderAutocomplete() {
		var autocomplete = this.applyFilter();
		
		if(autocomplete.length==0)
			return (<li>No results found</li>);
		
		return autocomplete.map( (value) => {
			return (<li key={value} onClick={ () => this.click(value) }>{value}</li>);
		});
	}
	
	renderValues() {
		if(!this.props.multiple)
			return;
		
		return this.props.value.map( (value, idx) => {
			return (
				<span key={idx}>
					<span className="faicon fa-remove" onClick={ (e) => this.removeValue(idx) } />
					&#160;{value}
				</span>
			);
		});
	}
	
	render() {
		let className = 'evq-autocomplete';
		if(this.props.multiple)
			className += ' multiple';
		if(this.props.className)
			className += ' '+this.props.className;
		
		let value_style = {
			borderRadius: this.state.dropdown_opened?'0.4rem 0.4rem 0rem 0rem':'0.4rem 0.4rem 0.4rem 0.4rem'
		};
		
		let input_value = this.props.multiple?this.state.value:this.props.value;
		if(input_value===undefined)
			input_value = '';
		
		let input_style = {
			flexBasis: input_value.length<5?'5ch':input_value.length+'ch'
		};
		
		return (
			<div ref={this.ref} className={className}>
				<div style={value_style}>
					{ this.renderValues() }
					<input
						type="text"
						value={input_value}
						style={input_style}
						onChange={ (event) => {this.changeValue(event.target.value)} }
						onClick={ (e) => { if(!this.state.dropdown_opened) this.toggleDropdown() } }
						onFocus={this.toggleDropdown}
						onKeyUp={this._keyUp}
					/>
				</div>
				{this.renderDropdown()}
			</div>
		);
	}
}

Autocomplete.defaultProps = {
	multiple: false
};
