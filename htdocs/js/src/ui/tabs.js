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

import {DialogContext} from './dialog.js';
import {Tab} from './tab.js';

export class Tabs extends React.Component {
	constructor(props) {
		super(props);
		
		this.state = {
			current:this.props.active!==undefined?this.props.active:0
		}
	}
	
	componentDidMount() {
		if(this.props.onChange)
			this.props.onChange(this.state.current);
	}
	
	componentDidUpdate() {
		if(this.context.onComponentUpdate)
			this.context.onComponentUpdate();
	}
	
	changeTab(idx) {
		if(this.props.onChange)
			this.props.onChange(idx);
		
		this.setState({current:idx});
	}
	
	renderAction(action) {
		if(action===undefined)
			return;
		
		return (<span className={"fa " + action.icon} onClick={action.callback}></span>);
	}
	
	renderTabs() {
		return React.Children.map(this.props.children, (child,i) => {
			if(child.type!=Tab)
				return;
			
			return (
				<li key={i} className={this.state.current==i?'selected':''} onClick={ () => { this.changeTab(i) } }>
					{child.props.title}
					{this.renderAction(child.props.action)}
				</li>);
		});
	}
	
	renderActiveTab() {
		if(this.props.render)
			return this.props.render(this.state.current);
		
		return React.Children.map(this.props.children, (child,i) => {
			if(child.type!=Tab)
				return;
			
			if(i!=this.state.current)
				return;
			
			return child.props.children;
		});
	}
	
	render() {
		return (
			<div>
				<ul className="evq-tabs">
					{this.renderTabs()}
				</ul>
				<div className="evq-tabs-content">
					{this.renderActiveTab()}
				</div>
			</div>
		);
	}
}

Tabs.contextType = DialogContext;
