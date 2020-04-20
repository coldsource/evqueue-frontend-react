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

export class DOMUtils {
	static nodeToObject(node) {
		var obj = {};
		for(var i=0;i<node.attributes.length;i++)
		{
			var name = node.attributes[i].name.replace(/-/g,"_");
			obj[name] = node.attributes[i].value;
		}
		return obj;
	}
	
	static objectToParameters(obj) {
		if(Object.keys(obj).length==0)
			return undefined;
		
		xmldoc = new Document();
		for(let name in obj)
		{
			let node_parameter = xmldoc.appendChild(xmldoc.createElement('parameters'));
			node_parameter.appendChild(xmldoc.createElement('parameter'));
			node_parameter.setAttribute('name',name);
			node_parameter.setAttribute('value',obj[name]);
		}
		
		return xmldoc;
	}
}
