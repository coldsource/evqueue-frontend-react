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

export class App extends React.Component {
	constructor(props) {
		super(props);
		
		this.context = typeof(browser)=='undefined'?'server':'extension';
		
		App.global = {instance: this};
		
		let url = new URL(document.location);
		let get = new URLSearchParams(url.search);
		
		this.state = {
			path: url.hash,
			get: get,
			ready: false,
			messages: [],
		};
		
		document.querySelector('#pre-content').style.display='none';
		
		var self = this;
		window.onpopstate = (e) => {
			self.changeURL(document.location.search);
			return true;
		};
		
		document.addEventListener('click', (e) => {
			var el = e.target;
			while(el)
			{
				if(el.tagName=='A' && el.hasAttribute('href') && !el.hasAttribute('download'))
				{
					e.preventDefault();
			
					this.changeURL(el.getAttribute('href'));
					return false;
				}
				
				el = el.parentNode;
			}
			
			return true;
		}, false);
		
		// Try getting other tab's local storage
		if(window.localStorage.length==0)
			window.localStorage.setItem('getLocalStorage', Date.now());
		
		window.addEventListener('storage', this.localStorageTransfer);
		
		this.loadClusterConfig();
		
		App.notice = this.notice.bind(this);
		App.warning = this.warning.bind(this);
		App.changeURL = this.changeURL.bind(this);
		App.getParameter = this.getParameter.bind(this);
	}
	
	loadClusterConfig() {
		let env = window.localStorage.getItem('env');
		
		if(this.context=='server')
		{
			// Classic server configuration, load configuration from json file
			var xhr = new XMLHttpRequest();
			xhr.open('GET', 'conf/cluster.json');
			xhr.setRequestHeader('Content-Type', 'application/json');
			xhr.onload = () => {
				let config = JSON.parse(xhr.responseText);
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
				
				if(env!==null)
					App.global.cluster_config = App.global.clusters_config[env].nodes;
				
				this.setState({ready: true});
				document.querySelector('#content').style.display='block';
			}
			xhr.send();
		}
		else
		{
			// Plugin configuration, load configuration from browser storage
			browser.storage.local.get().then( (data) => {
				let clusters = data.clusters;
				let clusters_config = {};
				for(let name in clusters)
				{
					let cluster = clusters[name];
					
					let nodes = cluster.desc.split(',');
					for(let i=0;i<nodes.length;i++)
						nodes[i] = nodes[i].trim();
					
					clusters_config[name] = {
						color: cluster.color,
						nodes: nodes
					};
				}
				
				App.global.clusters_config = clusters_config;
				
				if(env!==null)
					App.global.cluster_config = App.global.clusters_config[env].nodes;
				
				if(window.localStorage.getItem('env')===null && data.clusters!==undefined)
					window.localStorage.setItem('env', Object.keys(clusters)[0]);
				
				this.setState({ready: true});
				document.querySelector('#content').style.display='block';
			});
		}
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
	
	changeURL(path)
	{
		let get = new URLSearchParams(path);
		
		window.history.pushState('','',path);
		
		this.setState({
			get: get
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
	
	route() {
		let path = this.state.get.has('loc')?this.state.get.get('loc'):'';
		
		if(path!='auth' && path!='settings' && (window.localStorage.authenticated===undefined || window.localStorage.authenticated!='true'))
		{
			window.history.pushState('','','?loc=auth');
			path = 'auth';
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
	
	render() {
		if(!this.state.ready)
			return (<div></div>);
		
		return (
			<div>
				{ this.route() }
				<div className="evq-messages">
					{ this.renderMessages() }
				</div>
			</div>
		);
	}
}

ReactDOM.render(<App />, document.querySelector('#content'));
