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
import {Checkbox} from './checkbox.js';

export class Permission extends React.Component {
	constructor(props) {
		super(props);
		
		this.state = {
			granted: false
		};
		
		App.wrapper.permissions.contains({permissions: [this.props.name]}, granted => {
			this.setState({granted: granted});
		});
		
		this.changeValue = this.changeValue.bind(this);
	}
	
	changeValue(e) {
		if(!this.state.granted)
		{
			App.wrapper.permissions.request({
				permissions: [this.props.name]
			}, (granted) => {
				if (granted)
					this.setState({granted: true});
			});
		}
		else
		{
			App.wrapper.permissions.remove({permissions: [this.props.name]});
			this.setState({granted: false});
		}
	}
	
	render() {
		return (
			<Checkbox name="granted" value={this.state.granted} onChange={this.changeValue} />
		);
	}
}
