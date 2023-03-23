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

import {PageHome} from '../../pages/home.js';
import {PageSystemState} from '../../pages/system-state.js';
import {PageRunningConfiguration} from '../../pages/running-configuration.js';
import {PageWorkflows} from '../../pages/workflows.js';
import {PageRetrySchedules} from '../../pages/retry-schedules.js';
import {PageWorkflowSchedules} from '../../pages/workflow-schedules.js';
import {PageQueues} from '../../pages/queues.js';
import {PageUsers} from '../../pages/users.js';
import {PageEngineLogs} from '../../pages/engine-logs.js';
import {PageAPILogs} from '../../pages/api-logs.js';
import {PageNotificationLogs} from '../../pages/notification-logs.js';
import {PageELogsChannels} from '../../pages/elogs-channels.js';
import {PageELogsChannelGroups} from '../../pages/elogs-channel-groups.js';
import {PageELogsSearch} from '../../pages/elogs-search.js';
import {PageELogsAlerts} from '../../pages/elogs-alerts.js';
import {PageELogsStatistics} from '../../pages/elogs-statistics.js';
import {PageStorageVariables} from '../../pages/storage-variables.js';
import {PageStorageLaunchers} from '../../pages/storage-launchers.js';
import {PageStorageDisplays} from '../../pages/storage-displays.js';
import {PageStorageAccess} from '../../pages/storage-access.js';
import {PageWorkflowEditor} from '../../pages/workflow-editor.js';
import {PageNotificationTypes} from '../../pages/notification-types.js';
import {PageNotification} from '../../pages/notification.js';
import {PageNodes} from '../../pages/nodes.js';
import {PageWorkflowsStatistics} from '../../pages/workflows-statistics.js';
import {PageSystemStatistics} from '../../pages/system-statistics.js';
import {PageInstancesStatistics} from '../../pages/instances-statistics.js';
import {Page404} from '../../pages/404.js';
import {PageAuth} from '../../pages/auth.js';
import {PageSettings} from '../../pages/settings.js';
import {LS} from '../../utils/local-storage.js';
import {NotificationsHandler} from './notifications-handler.js';

export class App extends React.Component {
	constructor(props) {
		super(props);
		
		this.wrap_context = 'server';
		if(typeof(chrome)!='undefined')
		{
			// Chrome
			if(chrome.storage!==undefined)
			{
				this.wrap_context = 'extension';
				this.wrapper = chrome;
			}
		}
		else
		{
			// Firefrox
			if(typeof(browser)!='undefined' && browser.storage!==undefined)
			{
				this.wrap_context = 'extension';
				this.wrapper = browser;
			}
		}
		
		App.wrap_context = this.wrap_context;
		if(this.wrap_context=='extension')
			App.wrapper = this.wrapper;
		
		App.global = {instance: this};
		
		let url = new URL(document.location);
		let get = new URLSearchParams(url.search);
		
		this.state = {
			path: url.hash,
			get: get,
			data: {},
			ready: false,
			config_error: '',
			messages: [],
		};
		
		document.querySelector('#pre-content').style.display='none';
		
		let self = this;
		window.onpopstate = (e) => {
			self.changeURL(document.location.search);
			return true;
		};
		
		document.addEventListener('click', (e) => {
			let el = e.target;
			while(el)
			{
				if(el.tagName=='A' && el.hasAttribute('href') && !el.hasAttribute('download'))
				{
					// We only want to intercept local links, external links are let with normal behaviour
					let href = el.getAttribute('href');
					let url = new URL(href, document.baseURI);
					if(url.origin!==window.location.origin)
						return true;
					
					e.preventDefault();
			
					this.changeURL(href);
					return false;
				}
				
				el = el.parentNode;
			}
			
			return true;
		}, false);
		
		// Try getting other tab's local storage, if ENV was not ready yet we will do init after data transfer
		this.localStorageTransfer = this.localStorageTransfer.bind(this);
		window.addEventListener('storage', this.localStorageTransfer);
		if(window.localStorage.length==0)
			window.localStorage.setItem('getLocalStorage', Date.now());
		
		// Load cluster configuration
		this.loadClusterConfig().then( (msg) => {
			document.querySelector('#content').style.display='block';
			this.setState({ready: true});
		}, (msg) => {
			document.querySelector('#content').style.display='block';
			this.setState({ready: true, config_error: msg});
		});
		
		App.notice = this.notice.bind(this);
		App.warning = this.warning.bind(this);
		App.changeURL = this.changeURL.bind(this);
		App.getParameter = this.getParameter.bind(this);
		App.getData = this.getData.bind(this);
	}
	
	loadClusterConfig() {
		return new Promise( (resolve, reject) => {
			if(this.wrap_context=='server')
			{
				// Classic server configuration, load configuration from json file
				var xhr = new XMLHttpRequest();
				xhr.open('GET', 'conf/cluster.json');
				xhr.setRequestHeader('Content-Type', 'application/json');
				xhr.onerror = () => reject("Could not download cluster.json");
				xhr.onload = () => {
					let config;
					try {
						config = JSON.parse(xhr.responseText);
					} catch(error) {
						return reject(error.message);
					}
					
					if(typeof(config)!='object' || Array.isArray(config))
						return reject("Configuration must be an object");
					
					if(Object.keys(config).length==0)
						return reject("No environment found in configuration");
					
					let clusters_config = {};
					for(let env in config)
					{
						let parts = env.split('#');
						let name = parts[0];
						let color = parts.length>1?parts[1]:'ffffff';
							
						clusters_config[name] = {
							color: color,
							nodes: config[env]
						};
					}
					
					App.global.clusters_config = clusters_config;
					
					// Lately read localStorage to wait for state transfer
					let env = window.localStorage.getItem('env');
					if(env!==null)
						App.global.cluster_config = App.global.clusters_config[env].nodes;
					
					return resolve();
				}
				xhr.send();
			}
			else
			{
				// Plugin configuration, load configuration from browser storage
				LS.get().then( (data) => {
					if(data.clusters===undefined)
						return reject("No configuration found");
					
					let clusters = data.clusters;
					if(Object.keys(clusters).length==0)
						return reject("No environment found in configuration");
					
					let clusters_config = {};
					for(let name in clusters)
					{
						let cluster = clusters[name];
						
						let nodes = cluster.desc.split(',');
						for(let i=0;i<nodes.length;i++)
							nodes[i] = nodes[i].trim();
						
						clusters_config[name] = {
							color: cluster.color,
							disable_notifications: cluster.disable_notifications,
							nodes: nodes
						};
					}
					
					App.global.clusters_config = clusters_config;
					
					// Lately read localStorage to wait for state transfer
					let env = window.localStorage.getItem('env');
					if(env!==null && App.global.clusters_config[env]!==undefined)
						App.global.cluster_config = App.global.clusters_config[env].nodes;
					
					if(window.localStorage.getItem('env')===null && data.clusters!==undefined)
						window.localStorage.setItem('env', Object.keys(clusters)[0]);
					
					return resolve();
				});
			}
		});
	}
	
	localStorageTransfer(e) {
		if(e.key=='getLocalStorage')
		{
			window.localStorage.setItem('setLocalStorage', JSON.stringify(window.localStorage));
			window.localStorage.removeItem('setLocalStorage');
		}
		
		if(e.key=='setLocalStorage')
		{
			let data = JSON.parse(event.newValue);
			for(let key in data)
				window.localStorage.setItem(key, data[key]);
		}
	}
	
	getParameter(name) {
		return this.state.get.get(name);
	}
	
	getData() {
		let data = Object.assign({}, this.state.data);
		if(Object.keys(data).length>0)
			this.setState({data: {}});
		return data;
	}
	
	changeURL(path, data = {})
	{
		let get = new URLSearchParams(path);
		
		window.history.pushState('','',path);
		
		this.setState({
			get: get,
			data: data
		});
	}
	
	notice(msg) {
		return this.message('notice', msg);
	}
	
	warning(msg) {
		return this.message('warning', msg);
	}
	
	message(severity, msg) {
		var messages = this.state.messages;
		messages.push({
			severity: severity,
			content: msg
		});
		
		this.setState({messages: messages});
		
		var timeout = 3000;
		if(severity=='warning')
			timeout = 7000;
		var self = this;
		setTimeout( () => {
			var messages = this.state.messages;
			messages.splice(0,1);
			this.setState({messages: messages});
		}, timeout);
	}
	
	getPath() {
		return this.state.get.has('loc')?this.state.get.get('loc'):'';
	}
	
	isAuthenticated() {
		return (window.localStorage.authenticated!==undefined && window.localStorage.authenticated=='true');
	}
	
	route() {
		let path = this.getPath();
		
		if(path!='auth' && path!='settings' && !this.isAuthenticated())
		{
			window.history.pushState('','','?loc=auth');
			path = 'auth';
		}
		
		if(this.wrap_context=='extension' && this.state.config_error && path!='settings')
		{
			return (
				<div className="center error">
					<br />
					Error loading extension configuration, please fill correct configuration from <a href="?loc=settings">extension configuration</a>
					<br />
					<br />
					The following error was encountered : {this.state.config_error}
				</div>
			);
		}
		
		if(path=='' || path=='home')
			return (<PageHome />);
		else if(path=='auth')
			return (<PageAuth />);
		else if(path=='system-state')
			return (<PageSystemState />);
		else if(path=='running-configuration')
			return (<PageRunningConfiguration />);
		else if(path=='workflows')
			return (<PageWorkflows />);
		else if(path=='retry-schedules')
			return (<PageRetrySchedules />);
		else if(path=='workflow-schedules')
			return (<PageWorkflowSchedules />);
		else if(path=='queues')
			return (<PageQueues />);
		else if(path=='users')
			return (<PageUsers />);
		else if(path=='logs-engine')
			return (<PageEngineLogs />);
		else if(path=='logs-notification')
			return (<PageNotificationLogs />);
		else if(path=='logs-api')
			return (<PageAPILogs />);
		else if(path=='elogs-channel-groups')
			return (<PageELogsChannelGroups />);
		else if(path=='elogs-channels')
			return (<PageELogsChannels />);
		else if(path=='elogs-search')
			return (<PageELogsSearch />);
		else if(path=='elogs-alerts')
			return (<PageELogsAlerts />);
		else if(path=='elogs-stats')
			return (<PageELogsStatistics />);
		else if(path=='storage-variables')
			return (<PageStorageVariables />);
		else if(path=='storage-launchers')
			return (<PageStorageLaunchers />);
		else if(path=='storage-displays')
			return (<PageStorageDisplays/>);
		else if(path=='storage-access')
			return (<PageStorageAccess />);
		else if(path=='workflow-editor')
			return (<PageWorkflowEditor />);
		else if(path=='notification-plugins')
			return (<PageNotificationTypes />);
		else if(path=='notification')
			return (<PageNotification />);
		else if(path=='nodes')
			return (<PageNodes />);
		else if(path=='statistics-workflows')
			return (<PageWorkflowsStatistics />);
		else if(path=='statistics-system')
			return (<PageSystemStatistics />);
		else if(path=='statistics-instances')
			return (<PageInstancesStatistics />);
		else if(path=='settings')
			return (<PageSettings/>);
		
		return (<Page404 />);
	}
	
	renderMessages() {
		if(this.state.messages.length==0)
			return;
		
		return this.state.messages.map( (msg, idx) => {
			if(msg.severity=='notice')
				return (<div key={idx}><span className="notice">{msg.content}</span></div>);
			if(msg.severity=='warning')
				return (<div key={idx}><span className="warning">{msg.content}</span></div>);
		});
	}
	
	renderNotificationsHandler() {
		if(App.global.cluster_config===undefined)
			return;
		
		let path = this.getPath();
		if(path=='auth' || path=='settings' || !this.isAuthenticated())
			return;
		
		return (<NotificationsHandler />);
	}
	
	render() {
		if(!this.state.ready)
			return (<div></div>);
		
		if(this.state.config_error)
		{
			if(this.wrap_context=='server')
			{
				return (
					<div className="center error">
						<br />
						Error loading configuration from confile « conf/cluster.json », please check file content and refresh this page
						<br />
						<br />
						The following error was encountered : {this.state.config_error}
					</div>
				);
			}
		}
		
		return (
			<div>
				{ this.renderNotificationsHandler() }
				{ this.route() }
				<div className="evq-messages">
					{ this.renderMessages() }
				</div>
			</div>
		);
	}
}

const root = ReactDOM.createRoot(document.querySelector('#content'));
root.render(<App />, );
