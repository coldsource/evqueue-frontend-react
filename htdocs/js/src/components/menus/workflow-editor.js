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

export class WorkflowEditorMenu extends React.Component {
	constructor(props) {
		super(props);
	}
	
	render() {
		return (
			<div className="evq-workflow-editor-menu">
				<div>
					<div className="menu-left">
						<span className="faicon fa-save" title="Save" onClick={ this.props.onSave }></span>
						<span className="faicon fa-cogs" title="Undo" onClick={ this.props.onProperties }></span>
						<span className="faicon fa-rotate-left" title="Undo" onClick={ this.props.onUndo }></span>
						<span className="faicon fa-rotate-right" title="Redo" onClick={ this.props.onRedo }></span>
						<span className="faicon fa-arrow-down" title="Download workflow XML" onClick={ this.props.onDownload }></span>
						<span className="faicon fa-arrow-up" title="Upload workflow XML" onClick={ this.props.onUpload }></span>
					</div>
					<div className="menu-right">
						<span className="faicon fa-remove" title="Exit editor" onClick={ this.props.onExit }></span>
					</div>
				</div>
			</div>
		);
	}
}
