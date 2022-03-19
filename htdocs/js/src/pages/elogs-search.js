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

import {HeaderMenu} from '../components/menus/header.js';
import {ELogs} from '../components/panels/logs/elogs.js';
import {ELogsFilters} from '../components/panels/logs/elogs-filters.js';

export class PageELogsSearch extends React.Component {
	constructor(props) {
		super(props);
		
		this.logs = React.createRef();
		this.filters = React.createRef();
	}
	
	render() {
		return (
			<div>
				<HeaderMenu current="External Logs" />
				<ELogsFilters ref={this.filters} onChange={this.logs} />
				<br />
				<ELogs ref={this.logs} filters={this.filters} />
			</div>
		);
	}
}