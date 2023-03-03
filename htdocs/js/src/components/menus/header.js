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

import {App} from '../base/app.js';
import {evQueueComponent} from '../base/evqueue-component.js';
import {EditUserPreferences} from '../dialogs/users/preferences.js';
import {Dialogs} from '../../ui/dialogs.js';
import {EnvSelector} from '../base/env-selector.js';

export class HeaderMenu extends evQueueComponent {
	constructor(props) {
		super(props);
		
		this.menu = [
			{
				label: 'System state',
				icon: 'fa-desktop',
				submenu: [
					{ label: 'Workflows Instances', icon: 'fa-cubes', url: ''},
					{ label: 'Queues', icon: 'fa-hand-stop-o', url: 'system-state' },
					{ label: 'Running configuration', icon: 'fa-terminal', url: 'running-configuration' }
				]
			},
			{
				label: 'Settings',
				icon: 'fa-cogs',
				submenu: [
					{ label: 'Workflows', icon: 'fa-cubes', url: 'workflows' },
					{ label: 'Workflow schedules', icon: 'fa-calendar', url: 'workflow-schedules' },
					{ label: 'Retry schedules', icon: 'fa-clock-o', url: 'retry-schedules' },
					{ label: 'Queues', icon: 'fa-cubes', url: 'queues' },
					{ label: 'Users', icon: 'fa-user-o', url: 'users' }
				]
			},
			{
				label: 'Notifications',
				icon: 'fa-rss',
				submenu: [
					{ label: 'Configure', icon: 'fa-rss', url: 'notification' },
					{ label: 'Manage plugins', icon: 'fa-plug', url: 'notification-plugins' }
				]
			},
			{
				label: 'Statistics',
				icon: 'fa-area-chart',
				submenu: [
					{ label: 'Workflows', icon: 'fa-cubes', url: 'statistics-workflows' },
					{ label: 'Instances', icon: 'fa-line-chart', url: 'statistics-instances' },
					{ label: 'System', icon: 'fa-percent', url: 'statistics-system' }
				]
			},
			{
				label: 'Logging',
				icon: 'fa-file-text-o',
				submenu: [
					{ label: 'Engine logs', icon: 'fa-file-text-o', url: 'logs-engine' },
					{ label: 'API logs', icon: 'fa-file-text-o', url: 'logs-api' },
					{ label: 'Notification logs', icon: 'fa-file-text-o', url: 'logs-notification' }
				]
			},
			{
				label: 'External Logs',
				icon: 'fa-podcast',
				submenu: [
					{ label: 'Channel groups', icon: 'fa-clone', url: 'elogs-channel-groups' },
					{ label: 'Channels', icon: 'fa-road', url: 'elogs-channels' },
					{ label: 'Logs', icon: 'fa-file-text-o', url: 'elogs-search' },
					{ label: 'Alerts', icon: 'fa-exclamation-triangle', url: 'elogs-alerts' },
					{ label: 'Statistics', icon: 'fa-area-chart', url: 'elogs-stats' }
				]
			},
			{
				label: 'Storage',
				icon: 'fa-database',
				submenu: [
					{ label: 'Variables', icon: 'fa-hashtag', url: 'storage-variables' },
					{ label: 'Launchers', icon: 'fa-rocket', url: 'storage-launchers' }
				]
			}
		];
		
		for(var idx = 0;idx<this.menu.length;idx++)
			if(this.menu[idx].label==this.props.current)
				break;
		
			if(idx==this.menu.length)
				idx = 0;
		
		this.state.env = window.localStorage.getItem('env');
		this.state.sel1 = idx;
		this.state.sel2 = 0;
		
		this.logout = this.logout.bind(this);
	}
	
	logout() {
		let env = this.state.env;
		
		// Disconnect engines
		evQueueComponent.global.event_dispatcher.Close();
		evQueueComponent.global.evqueue_api.Close();
		delete evQueueComponent.global;
		
		window.localStorage.removeItem('authenticated');
		window.localStorage.removeItem('user');
		window.localStorage.removeItem('password');
		window.localStorage.removeItem(env+'.user');
		window.localStorage.removeItem(env+'.password');
		App.changeURL('?loc=auth');
	}
	
	changeEnv(e) {
		window.localStorage.setItem('env', e.target.value);
		
		window.localStorage.removeItem('authenticated');
		window.localStorage.removeItem('user');
		window.localStorage.removeItem('password');
		
		document.location.href='?loc=auth';
	}
	
	editPreferences(e) {
		Dialogs.open(EditUserPreferences, {});
	}
	
	level1() {
		return this.menu.map((entry, idx) => {
			if(entry.label=='External Logs' && this.state.cluster.available_modules.elogs!==true)
				return;
			
			if(entry.label=='Storage' && this.state.cluster.available_modules.storage!==true)
				return;
			
			return (
				<li key={idx} className={this.state.sel1==idx?'selected':''} onClick={ () => this.setState({sel1:idx}) }>
					<span className={'faicon '+entry.icon}></span>
					&#160;
					{entry.label}
				</li>
			);
		});
	}
	
	level2() {
		return this.menu[this.state.sel1].submenu.map((entry, idx) => {
			return (
				<li key={idx}>
					<a href={'?loc='+entry.url}>
						<span className={'faicon '+entry.icon}></span>
						&#160;
						{entry.label}
					</a>
				</li>
			);
		});
	}
	
	render() {
		return (
			<div className="evq-headermenu">
				<div><img src="images/evQueue-small.svg" title="evQueue" onClick={ (e) => App.changeURL('?loc=home') } /></div>
				<div className="login-box">
					<b>{window.localStorage.user}</b>
					<span className="faicon fa-pencil" title="Edit user properties" onClick={this.editPreferences} />
					<span className="faicon fa-power-off" title="Logout" onClick={this.logout} />
				</div>
				<div className="env-box">
					<EnvSelector name="env" value={this.state.env} onChange={this.changeEnv} />
				</div>
				<ul className="level1">
					{ this.level1() }
				</ul>
				<ul className="level2" id="submenu-system-state">
					{ this.level2() }
				</ul>
			</div>
		);
	}
}
