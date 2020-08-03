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
import {Help} from '../../../ui/help.js';
import {FileUpload} from '../../../ui/file-upload.js';
import {Dialog} from '../../../ui/dialog.js';
import {Dialogs} from '../../../ui/dialogs.js';

export class WorkflowUpload extends React.Component {
	constructor(props) {
		super(props);
		
		this.dlg = React.createRef();
		
		this.upload = this.upload.bind(this);
	}
	
	upload(content) {
		this.props.onUpload(content);
		this.dlg.current.close();
	}
	
	render() {
		return (
			<Dialog ref={this.dlg} title="Upload workflow XML" width="800" onClose={this.props.onClose}>
				<div className="evq-workflow-upload">
					<h2>
						Import workflow
						<Help>Upload an XML file to import a new workflow. The current workflow will be overwritten.</Help>
					</h2>
					<div>
						<FileUpload onUpload={this.upload} />
					</div>
				</div>
			</Dialog>
		);
	}
}
