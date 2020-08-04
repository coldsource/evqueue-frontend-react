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

export class FileUpload extends React.Component {
	constructor(props) {
		super(props);
		
		this.browse_btn = React.createRef();
		
		this.drag = this.drag.bind(this);
		this.drop = this.drop.bind(this);
		this.browse = this.browse.bind(this);
	}
	
	drag(e) {
		e.preventDefault();
	}
	
	drop(e) {
		e.preventDefault();
		
		if(e.dataTransfer.items.length!=1)
			return;
		
		if(e.dataTransfer.items[0].kind !== 'file')
			return;
		
		this.readfile(e.dataTransfer.items[0].getAsFile());
	}
	
	browse(e) {
		this.readfile(e.target.files[0]);
	}
	
	readfile(file) {
		let reader = new FileReader();
		
		reader.onload = (event) => {
			this.props.onUpload(reader.result, file.name);
		};
		
		if(this.props.type!==undefined && this.props.type=='binary')
			reader.readAsBinaryString(file);
		else
			reader.readAsText(file);
	}
	
	render() {
		return (
			<div className="evq-file-upload">
				<input ref={this.browse_btn} id="file" type="file" onChange={this.browse} />
				<div className="dropzone" onDragOver={this.drag} onDrop={this.drop}>
					<button onClick={ e => this.browse_btn.current.click() }>Browse</button>
					Drop file here
				</div>
			</div>
		);
	}
}
