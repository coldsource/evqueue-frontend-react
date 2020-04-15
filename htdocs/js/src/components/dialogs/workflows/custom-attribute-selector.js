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
import {XPathHelper} from '../../base/xpath-helper.js';
import {Dialog} from '../../../ui/dialog.js';

export class CustomAttributeSelector extends React.Component {
	constructor(props) {
		super(props);
	}
	
	render() {
		let custom_attribute = this.props.custom_attribute;
		let path = this.props.workflow.getTasksPath();
		
		return (
			<Dialog dlgid={this.props.dlgid} title={"Custom attribute « "+custom_attribute.name+" »"} width="650" onClose={this.props.onClose}>
				<div className="evq-xpath-selector">
					<div>
						This helper allows you to create a custom attribute, writing an XPath expression to match a specific node in the workflow document that will be the value of your attribute
						<br /><br />
						Please remember that only named jobs can be used here. Add a name to your job first if you want to use it here.
					</div>
					<br />
					<XPathHelper path={path} name="value" value={custom_attribute.value} onChange={ this.props.onChange } />
				</div>
			</Dialog>
		);
	}
}
