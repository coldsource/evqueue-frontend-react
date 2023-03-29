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

export class Textarea extends React.Component {
	constructor(props) {
		super(props);
		
		this.state = {
			full: false
		}
		
		this.ref = React.createRef();
		
		this.changeValue = this.changeValue.bind(this);
		this.clickHandler = this.clickHandler.bind(this);
	}
	
	componentDidMount() {
		document.addEventListener('click', this.clickHandler);
	}
	
	componentWillUnmount() {
		document.removeEventListener('click', this.clickHandler);
	}
	
	clickHandler(e) {
		if(!this.state.full)
			return;
		
		if(!this.ref.current.contains(e.target))
			this.setState({full: false});
	}
	
	changeValue(e) {
		let value = this.props.value!==undefined?this.props.value:'';
		
		if(this.props.onChange)
			this.props.onChange(EventsUtils.createEvent(this.props.name, e.target.value));
	}
	
	render() {
		let icon = this.props.value?'fa-check-square-o':'fa-square-o';
		return (
			<div className={"evq-textarea" + (this.state.full?' full':'')} ref={this.ref}>
                <span className="faicon fa-expand" onClick={e => this.setState({full: !this.state.full})}></span>
				<textarea onChange={this.changeValue} value={this.props.value!==undefined?this.props.value:''}></textarea>
			</div>
		);
	}
}
