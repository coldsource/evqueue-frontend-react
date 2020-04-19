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

import {RadiosContext} from './radios.js';
import {EventsUtils} from '../utils/events.js';

export class Radio extends React.Component {
	constructor(props) {
		super(props);
	}
	
	render() {
		return (
			<RadiosContext.Consumer>
				{ ctx => (
					<span
						className={ctx.value==this.props.value?'faicon fa-check-circle-o':'faicon fa-circle-o'}
						onClick={ (e) => ctx.onChange(EventsUtils.createEvent(ctx.name, this.props.value)) }
					/>
				)}
			</RadiosContext.Consumer>
		);
	}
}
