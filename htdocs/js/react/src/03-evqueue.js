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

class evQueueWS
{
	constructor(context,callback)
	{
		this.context = context;
		this.callback = callback;
		
		this.nodes = document.querySelector("body").dataset.nodes.split(',');
		for(var i=0;i<this.nodes.length;i++)
			this.nodes[i] = this.nodes[i].replace('tcp://','ws://');
		
		this.nodes_names = document.querySelector("body").dataset.nodesnames.split(',');
		
		this.failed_nodes = 0;
		this.connected_nodes = 0;
		this.current_node = 0;
		this.ws = [];
		this.state = [];
	}
	
	GetNodes()
	{
		return this.nodes_names;
	}
	
	ChangeNode(idx)
	{
		this.Close();
		return this.Connect(idx);
	}
	
	GetConnectedNodes()
	{
		return this.connected_nodes;
	}
	
	Connect(idx = 0)
	{
		this.current_node = idx;
		
		var self = this;
		return new Promise(function(resolve, reject) {
			if(idx=='*')
			{
				for(var i=0;i<self.nodes.length;i++)
					self.connect(i,resolve,reject);
			}
			else
				self.connect(idx,resolve,reject);
		});
	}
	
	connect(idx, resolve, reject)
	{
		var self = this;
		
		self.ws[idx] = new WebSocket(self.nodes[idx], "events");
		
		self.time_delta = 0;
		
		self.state[idx] = 'CONNECTING';
		
		self.ws[idx].onopen = function (event) {
			console.log("Connected to node "+self.nodes_names[idx]);
		};
		
		self.ws[idx].onclose = function(event) {
			if(self.state[idx]=='READY')
				self.connected_nodes--;
			
			self.failed_nodes++;
			
			self.state[idx] = 'DISCONNECTED';
			console.log("Disconnected from node "+self.nodes_names[idx]);
		}
		
		self.ws[idx].onmessage = function (event) {
			var parser = new DOMParser();
			var xmldoc = parser.parseFromString(event.data, "text/xml");
			
			if(self.state[idx] == 'CONNECTING')
			{
				var challenge = xmldoc.documentElement.getAttribute("challenge");
			
				var user = document.querySelector("body").dataset.user;
				var passwd_hash = CryptoJS.enc.Hex.parse(document.querySelector("body").dataset.password);
				var response = CryptoJS.HmacSHA1(CryptoJS.enc.Hex.parse(challenge), passwd_hash).toString(CryptoJS.enc.Hex);
				
				self.ws[idx].send("<auth response='"+response+"' user='"+user+"' />");
				self.state[idx] = 'AUTHENTICATED';
			}
			else if(self.state[idx] == 'AUTHENTICATED')
			{
				var time = xmldoc.documentElement.getAttribute("time");
				self.time_delta = Date.now()-Date.parse(time);
				
				self.state[idx] = 'READY';
				self.connected_nodes++;
				if(self.connected_nodes+self.failed_nodes==self.nodes.length && self.current_node=='*')
					resolve();
				else if(self.current_node!='*')
					resolve();
			}
			else if(self.state[idx]=='READY')
			{
				var parser = new DOMParser();
				var xmldoc = parser.parseFromString(event.data, "text/xml");
				
				var ret = { response: [] };
				
				var root = xmldoc.documentElement;
				for(var i=0;i<root.attributes.length;i++)
					ret[root.attributes[i].name] = root.attributes[i].value;
				
				var nodes_ite = xmldoc.evaluate(self.output_xpath_filter,xmldoc.documentElement);
				var node;
				while(node = nodes_ite.iterateNext())
				{
					var obj = {};
					for(var i=0;i<node.attributes.length;i++)
						obj[node.attributes[i].name] = node.attributes[i].value;
					ret.response.push(obj);
				}
				self.callback(self.context,ret);
			}
		}
	}
	
	Close()
	{
		if(this.current_node=='*')
		{
			for(var i=0;i<this.nodes.length;i++)
				this.close(i);
		}
		else
			this.close(this.current_node);
	}
	
	close(idx)
	{
		this.ws[idx].close();
	}
	
	GetTimeDelta()
	{
		return this.time_delta;
	}
	
	Subscribe(event,api,output_xpath_filter="/response/*")
	{
		if(this.current_node=='*')
		{
			for(var i=0;i<this.nodes.length;i++)
				this.subscribe(i,event,api.group,api.action,api.parameters,output_xpath_filter);
		}
		else
			this.subscribe(this.current_node,event,api.group,api.action,api.parameters,output_xpath_filter);
	}
	
	subscribe(idx,event,group,action,parameters,output_xpath_filter="/response/*")
	{
		if(this.state[idx]!='READY')
			return;
		
		this.output_xpath_filter = output_xpath_filter;
		
		var xmldoc = new Document();
		var api_node = xmldoc.createElement(group);
		api_node.setAttribute('action',action);
		xmldoc.appendChild(api_node);
		for(var parameter in parameters)
			api_node.setAttribute(parameter,parameters[parameter]);
		var api_cmd = new XMLSerializer().serializeToString(xmldoc);
		
		var api_cmd_b64 = btoa(api_cmd);
		this.ws[idx].send("<event action='subscribe' type='"+event+"' api_cmd='"+api_cmd_b64+"' />");
	}
	
	UnsubscribeAll(api_cmd,event)
	{
		if(this.current_node=='*')
		{
			for(var i=0;i<this.nodes.length;i++)
				this.unsubscribeAll(i);
		}
		else
			this.unsubscribeAll(this.current_node);
	}
	
	unsubscribeAll(idx)
	{
		if(this.state[idx]!='READY')
			return;
		
		this.ws[idx].send("<event action='unsubscribeall' />");
	}
}