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

import {evQueueWS} from './evqueue.js';

export class evQueueCluster
{
	/*
	 * Creates a new evQueue cluster
	 *
	 * nodes_desc: an array of connection descriptors, e.g. ['ws://localhost:5000']
	 * eventCallback: if omitted, connection will be made in API mode. If present, connection will be made in Events mode and this function will be called when an event occurs
	 * stateChange: a callback function that can be used to monitor the cluster status (nodes becoming up or down)
	 */
	constructor(nodes_desc, eventCallback, stateChange)
	{
		this.stateChangeCallback = stateChange;
		this.stateChange = this.stateChange.bind(this);
		
		// Init global state
		if(this.stateChangeCallback!==undefined)
		{
			evQueueCluster.global = {};
			evQueueCluster.global.nodes_names = [];
			evQueueCluster.global.nodes_versions = [];
			evQueueCluster.global.nodes_modules = [];
			evQueueCluster.global.nodes_states = [];
			for(var i=0;i<nodes_desc.length;i++)
			{
				evQueueCluster.global.nodes_names.push('offline');
				evQueueCluster.global.nodes_versions.push('');
				evQueueCluster.global.nodes_modules.push([]);
				evQueueCluster.global.nodes_states.push('DISCONNECTED');
			}
		}
		
		this.nodes_desc = nodes_desc;
		this.nodes = [];
		for(var i=0;i<nodes_desc.length;i++)
		{
			var evq = new evQueueWS({
				node: nodes_desc[i],
				callback: eventCallback,
				stateChange: stateChange===undefined?undefined:this.stateChange
			});
			
			if(this.stateChangeCallback!==undefined)
				evq.Connect();
			
			this.nodes.push(evq);
		}
	}
	
	/*
	 * Returns the name of the nodes of the cluster. Some nodes can have 'offline' name if not yet connected
	 */
	GetNodes()
	{
		return evQueueCluster.global.nodes_names.concat();
	}
	
	/*
	 * Returns the version of the nodes of the cluster. Some nodes can have empty version if not yet connected
	 */
	GetVersions()
	{
		return evQueueCluster.global.nodes_versions.concat();
	}
	
	/*
	 * Returns the modules supported by the node
	 */
	GetModules()
	{
		return evQueueCluster.global.nodes_modules.concat();
	}
	
	/*
	 * Returns the state of the cluster nodes
	 */
	GetStates()
	{
		return evQueueCluster.global.nodes_states.concat();
	}
	
	/*
	 * Returns the index of the node that has a specific connection descriptor
	 */
	GetNodeByCnx(cnx) {
		for(var i=0;i<this.nodes_desc.length;i++)
			if(this.nodes_desc[i]==cnx)
				return i;
		
		return -1;
	}
	
	/*
	 * Returns a node's index from its name
	 */
	GetNodeByName(name)
	{
		if(name=='*')
			return '*';
		
		var nodes_names = evQueueCluster.global.nodes_names;
		for(var i=0;i<nodes_names.length;i++)
			if(nodes_names[i]==name)
				return i;
		return -1;
	}
	
	/*
	 * Returns the index of the first connected (Up) node found in the cluster or -1 of no node is found
	 */
	GetUpNode()
	{
		for(var i=0;i<this.nodes.length;i++)
		{
			if(this.nodes[i].GetState()!='ERROR')
				return i;
		}
		
		return -1;
	}
	
	
	_api(api, resolve, reject)
	{
		var self = this;
		
		// Connecttion requested to all nodes, success only if all nodes are successful
		if(api.node=='*')
		{
			var resolved = 0;
			var data = [];
			for(var i=0;i<self.nodes.length;i++)
			{
				self.nodes[i].API(api).then(
					(xml) => {
						resolved++;
						data.push(xml);
						if(resolved==self.nodes.length)
							resolve(data);
					},
					(reason) => reject(reason)
				);
			}
		}
		else
		{
			// Specific node is requested
			if(api.node!==undefined)
			{
				var node = self.GetNodeByName(api.node)
				if(node==-1)
					return reject('Cluster error : unknown node');
				
				return self.nodes[node].API(api).then(
					(xml) => resolve(xml),
					(reason) => reject(reason)
				);
			}
			
			// Request for any up nodes, try to find one answering
			var node = self.GetUpNode();
			if(node==-1)
				return reject('Cluster error : no nodes up');
			
			self.nodes[node].API(api).then(
				(xml) => resolve(xml),
				(reason) => {
					if(self.nodes[node].GetLastError()=='AUTHENTICATION')
						reject(reason); // No need to retry on authentication error
					else
						self._api(api, resolve, reject); // Connection error, try another node
				}
			);
		}
	}
	
	/*
	 * Performs an API query and returns a promise that can be used to get the result once available
	 */
	API(api)
	{
		var self = this;
		
		return new Promise(function(resolve, reject) {
			return self._api(api, resolve, reject);
		});
	}
	
	/*
	 * Creates an XML query from an object
	 */
	BuildAPI(api)
	{
		return this.nodes[0].build_api_xml(api);
	}
	
	/*
	 * Closes all connection to nodes in the cluster
	 */
	Close()
	{
		for(var i=0;i<this.nodes.length;i++)
			this.nodes[i].Close();
	}
	
	stateChange(node, name, state, version, modules) {
		let idx = this.GetNodeByCnx(node);
		evQueueCluster.global.nodes_names[idx] = name;
		evQueueCluster.global.nodes_versions[idx] = version;
		evQueueCluster.global.nodes_modules[idx] = modules;
		evQueueCluster.global.nodes_states[idx] = state;
		
		if(this.stateChangeCallback!==undefined)
			this.stateChangeCallback(node, name, state, version);
	}
	
	/*
	 * Subscribes a new event to the cluster
	 * event: the type of the event, as a string
	 * api: the API command whose result must be sent when the event occurs
	 * send_now: a boolean specifiying whether the result of the api command should be sent immediatly for initialization purpose
	 * object_id: a filter that can be used to monitor only events of this object
	 * external_id: a numerical ID that will be sent back when the event occurs
	 */
	Subscribe(event,api,send_now,object_id,external_id)
	{
		let api_cmd_b64 = btoa(this.BuildAPI(api));
		
		let attributes = {
			type: event,
			api_cmd: api_cmd_b64,
			send_now: (send_now?'yes':'no')
		};
		
		if(external_id)
			attributes.external_id = external_id;
		
		if(object_id)
			attributes.object_id = object_id;
		
		let cmd = {
			node: api.node,
			group: 'event',
			action: 'subscribe',
			attributes: attributes
		};
		
		if(api.required_modules!==undefined)
			cmd.required_modules = api.required_modules;
		
		return this.API(cmd);
	}
	
	/*
	 * Unsubscribes an event
	 * event, external_id and object_id are the same parameters as in Subscribes(). They are used to filter which event to unsubscribe
	 */
	Unsubscribe(event, external_id, object_id = 0)
	{
		var attributes = {
			type: event
		};
		
		if(external_id)
			attributes.external_id = external_id;
		
		if(object_id)
			attributes.object_id = object_id;
		
		return this.API({
			node:'*',
			group: 'event',
			action: 'unsubscribe',
			attributes: attributes
		});
	}
	
	/*
	 * Unsubscribes all events for this connection
	 */
	UnsubscribeAll()
	{
		return this.API({
			node:'*',
			group: 'event',
			action: 'unsubscribeall'
		});
	}
}
