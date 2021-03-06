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
import {App} from '../components/base/app.js';
import {evQueueComponent} from '../components/base/evqueue-component.js';
import {ListNotificationPlugins} from '../components/panels/notifications/list-plugins.js';
import {FileUpload} from '../ui/file-upload.js';

export class PageNotificationTypes extends evQueueComponent {
	constructor(props) {
		super(props);
		
		this.state.plugin_file = '';
		
		this.uploaded = this.uploaded.bind(this);
	}
	
	uploaded(content, filename) {
		var self = this;
		
		if(filename.substr(filename.length-4).toLowerCase()!='.zip')
			return App.warning("Plugin must be a .zip file");
		
		self.simpleAPI({
			group: 'notification_type',
			action: 'register',
			attributes: {zip: btoa(content)}
		}, "Successfully added plugin");
		
		self.setState({plugin_file: ''});
	}
	
	render() {
		return (
			<div className="evq-notification-types">
				<HeaderMenu current="Notifications"/>
				<div className="upload">
					<FileUpload type="binary" onUpload={this.uploaded} />
				</div>
				<div className="plugin-help">Drag-and-drop or browse for a zip file to add a new notification plugin.</div>
				<ListNotificationPlugins />
			</div>
		);
	}
}
