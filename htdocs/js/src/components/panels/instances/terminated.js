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

import {ListInstances} from './list.js';
import {Panel} from '../../../ui/panel.js';
import {EventsUtils} from '../../../utils/events.js';

export class TerminatedInstances extends ListInstances {
	constructor(props) {
		super(props,'any');
		
		// Off-state attributes
		this.state.search_filters = {};
		this.state.current_page = 1;
		this.items_per_page = 30;
		
		// Bind actions
		this.nextPage = this.nextPage.bind(this);
		this.previousPage = this.previousPage.bind(this);
		this.removeInstance = this.removeInstance.bind(this);
		this.updateFilters = this.updateFilters.bind(this);
		this.toggleErrorFilter = this.toggleErrorFilter.bind(this);
	}
	
	componentDidMount() {
		var api = { node:'*',group:'instances',action:'list' };
		this.Subscribe('INSTANCE_REMOVED',api);
		this.Subscribe('INSTANCE_TERMINATED',api,true);
	}
	
	workflowDuration(wf) {
		return this.humanTime((Date.parse(wf.end_time)-Date.parse(wf.start_time))/1000);
	}
	
	workflowInfos(wf) {
		return ( <span className="faicon fa-comment-o" title={"Comment : " + wf.comment}></span> );
	}
	
	renderActions(wf) {
		return (
			<td className="tdActions">
				<span className="faicon fa-remove" title="Delete this instance" onClick={() => { this.removeInstance(wf.id); }}></span>
			</td>
		);
	}
	
	removeInstance(id) {
		this.simpleAPI({
			group: 'instance',
			action: 'delete',
			attributes: { 'id': id }
		}, 'Instance '+id+' removed', "You are about to remove instance "+id);
	}
	
	WorkflowStatus(wf) {
		if(wf.status = 'TERMINATED' && wf.errors > 0)
			return <span className="faicon fa-exclamation error" title="Errors"></span>;
		
		if(wf.status = 'TERMINATED' && wf.errors == 0)
			return <span className="faicon fa-check success" title="Workflow terminated"></span>;
	}
	
	toggleErrorFilter() {
		let e = EventsUtils.createEvent('filter_error',this.state.search_filters.filter_error=='yes'?'no':'yes');
		this.props.filters.current.filterChange(e);
	}
	
	renderErrorFilter() {
		if(this.state.search_filters.filter_error!='yes')
			return (<span className="faicon fa-exclamation evq-error-filter" title="Show only failed workflows" onClick={this.toggleErrorFilter} />);
		else
			return (<span className="faicon fa-exclamation evq-error-filter error" title="Show all workflows" onClick={this.toggleErrorFilter} />);
	}
	
	renderTitle() {
		let current_page = this.state.current_page;
		
		var title = (
			<span>
				Terminated workflows
				&#160;
				{ current_page>1?(<span className="faicon fa-backward" onClick={this.previousPage}></span>):'' }
				&#160;
				{ (current_page-1)*this.items_per_page + 1 } - { current_page*this.items_per_page } &#47; {this.state.workflows.current.rows}
				{ current_page*this.items_per_page<this.state.workflows.current.rows?(<span className="faicon fa-forward" onClick={this.nextPage}></span>):''}
			</span>
			
		);
		
		var actions = [
			{icon:'fa-refresh '+(this.state.refresh?' fa-spin':''), callback:this.toggleAutorefresh}
		];
		
		return (
			<Panel left={this.renderErrorFilter()} title={title} actions={actions} />
		);
	}
	
	updateFilters(search_filters) {
		search_filters.limit = this.items_per_page;
		search_filters.offset = (this.state.current_page-1)*this.items_per_page;
		this.setState({search_filters: search_filters});
		
		this.Unsubscribe('INSTANCE_TERMINATED');
		
		var api = {
			group: 'instances',
			action: 'list',
			attributes: search_filters
		};
		
		this.Subscribe('INSTANCE_TERMINATED',api,true);
	}
	
	nextPage() {
		this.setState({current_page: ++this.state.current_page});
		this.updateFilters(this.state.search_filters);
	}
	
	previousPage() {
		this.setState({current_page: --this.state.current_page});
		this.updateFilters(this.state.search_filters);
	}
}
