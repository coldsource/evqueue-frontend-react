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

import {evQueueComponent} from '../components/base/evqueue-component.js';
import {HeaderMenu} from '../components/menus/header.js';

export class PageELogsStatistics extends evQueueComponent {
	constructor(props) {
		super(props);
		
		this.state.partitions = [];
	}
	
	componentDidMount() {
		this.API({
			group: 'elogs',
			action: 'statistics',
		}).then( (response) => {
			let data = this.parseResponse(response);
			
			this.setState({partitions: data.response});
		});
	}
	
	sizeToHuman(s) {
		s = parseInt(s);
		
		if(s>1000*1000*1000)
			return Math.round(s/1000/1000/1000)+' G';
		else if(s>1000*1000)
			return Math.round(s/1000/1000)+' M';
		else if(s>1000)
			return Math.round(s/1000)+' K';
		return s+"";
	}
	
	renderPartitions() {
		return this.state.partitions.map(partition => {
			let date = partition.name.substr(1,4)+'-'+partition.name.substr(5,2)+'-'+partition.name.substr(7,2);
			
			return (
				<tr key={partition.name}>
					<td>{date}</td>
					<td className="center">{partition.name}</td>
					<td className="center">{partition.creation}</td>
					<td className="center">{partition.rows}</td>
					<td className="center">{this.sizeToHuman(partition.datasize)}</td>
					<td className="center">{this.sizeToHuman(partition.indexsize)}</td>
					<td className="center">{this.sizeToHuman(parseInt(partition.datasize) + parseInt(partition.indexsize))}</td>
				</tr>
			);
		});
	}
	
	render() {
		return (
			<div>
				<HeaderMenu current="External Logs" />
				<table className="evenodd">
					<thead>
						<tr>
							<th className="left">Date</th>
							<th style={{width: '10rem'}}>Partition</th>
							<th style={{width: '10rem'}}>Creation time</th>
							<th style={{width: '10rem'}}>Rows</th>
							<th style={{width: '10rem'}}>Data size</th>
							<th style={{width: '10rem'}}>Index size</th>
							<th style={{width: '10rem'}}>Total size</th>
						</tr>
					</thead>
					<tbody>
						{ this.renderPartitions() }
					</tbody>
				</table>
			</div>
		);
	}
}
