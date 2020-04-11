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

import {job} from './job.js';
import {task} from './task.js';
import {input} from './input.js';
import {input_part} from './input-part.js';

export class workflow {
	constructor()
	{
		this.subjobs = [ this.createJob({name: "New job"}) ];
		
		this.wf_pre_undo = '';
		this.wf_undo = [];
		this.wf_redo = [];
		
		this.parent_depth = 0;
	}
	
	createJob(desc = {}) {
		var new_job = new job(desc, this);
		new_job._workflow = this;
		return new_job;
	}
	
	createTask(desc = {}) {
		return new task(desc, this);
	}
	
	createInput(desc = {}) {
		return new input(desc, this);
	}
	
	createInputPart(desc = {}) {
		return new input_part(desc, this);
	}
	
	loadXML(workflow) {
		this.subjobs = [];
		
		this.name= workflow.hasAttribute('name')?workflow.getAttribute('name'):'';
		this.comment = workflow.hasAttribute('comment')?workflow.getAttribute('comment'):'';
		this.group= workflow.hasAttribute('group')?workflow.getAttribute('group'):'';
		
		let job_ite = workflow.ownerDocument.evaluate('workflow/subjobs/job',workflow);
		let job_node;
		while(job_node = job_ite.iterateNext())
			this.subjobs.push(this.createJob(job_node));
	}
	
	saveXML() {
		let xmldoc = new Document();
		
		let workflow_node = xmldoc.appendChild(xmldoc.createElement('workflow'));
		let subjobs_node = workflow_node.appendChild(xmldoc.createElement('subjobs'));
		
		for(let i=0;i<this.subjobs.length;i++)
			subjobs_node.appendChild(this.subjobs[i].toXML(xmldoc));
		
		let xml = new XMLSerializer().serializeToString(xmldoc);
	}
	
	stringify(obj) {
		return JSON.stringify(obj, (name, value) => {
			if(name.substr(0,1)=='_' && name!='_id')
				return undefined;
			return value;
		});
	}
	
	backup() {
		this.wf_undo.push(this.stringify(this.subjobs));
		this.wf_redo = [];
	}
	
	preBackup() {
		this.wf_pre_undo = this.stringify(this.subjobs);
	}
	
	postBackup() {
		if(this.wf_pre_undo!='')
		{
			this.wf_undo.push(this.wf_pre_undo);
			this.wf_pre_undo = '';
		}
		
		this.wf_redo = [];
	}
	
	restore(json) {
		let subjobs = JSON.parse(json);
		for(let i=0;i<subjobs.length;i++)
		{
			subjobs[i] = this._restore(subjobs[i]);
			subjobs[i]._parent = this;
		}
		return subjobs;
	}
	
	_restore(jobobj) {
		for(var i=0;i<jobobj.subjobs.length;i++)
		{
			jobobj.subjobs[i] = this._restore(jobobj.subjobs[i]);
			jobobj.subjobs[i]._parent = jobobj;
		}
		
		for(var i=0;i<jobobj.tasks.length;i++)
		{
			jobobj.tasks[i] = Object.setPrototypeOf(jobobj.tasks[i], task.prototype);
			jobobj.tasks[i]._parent = jobobj;
			
			for(var j=0;j<jobobj.tasks[i].inputs.length;j++)
			{
				jobobj.tasks[i].inputs[j] = Object.setPrototypeOf(jobobj.tasks[i].inputs[j], input.prototype);
				jobobj.tasks[i].inputs[j]._parent = jobobj.tasks[i];
				
				for(var k=0;k<jobobj.tasks[i].inputs[j].parts.length;k++)
				{
					jobobj.tasks[i].inputs[j].parts[k] = Object.setPrototypeOf(jobobj.tasks[i].inputs[j].parts[k], input_part.prototype);
					jobobj.tasks[i].inputs[j].parts[k]._parent = jobobj.tasks[i].inputs[j];
				}
			}
		}
		
		return Object.setPrototypeOf(jobobj, job.prototype);
	}
	
	undo() {
		if(this.wf_undo.length==0)
			return;
		
		this.wf_redo.push(this.stringify(this.subjobs));
		this.subjobs = this.restore(this.wf_undo.pop());
	}
	
	redo() {
		if(this.wf_redo.length==0)
			return;
		
		this.wf_undo.push(this.stringify(this.subjobs));
		this.subjobs = this.restore(this.wf_redo.pop());
	}
	
	moveJob(dst_job, dst_position, src_job, src_type) {
		var src_parent = src_job._parent;
		var src_removed_subjobs = [];
		var src_idx = src_parent?src_parent.subjobs.indexOf(src_job):-1;
		
		var dst_parent = dst_position=='bottom'?dst_job:dst_job._parent;
		var dst_idx;
		
		if(dst_position=='left' || dst_position=='right')
		{
			dst_idx = dst_position=='left'?dst_parent.subjobs.indexOf(dst_job):dst_parent.subjobs.indexOf(dst_job)+1
			dst_parent.addSubjob(src_job, dst_idx);
			
			// When a job is inserted left or right, it has no more children, they will be re-inserted later
			if(src_type=='job')
				src_removed_subjobs = src_job.emptySubjobs();
			
			// If new job has been inserted on the same array, we have to recompute index
			if(src_parent===dst_parent && dst_idx<=src_idx)
				src_idx++;
		}
		else if(dst_position=='top')
		{
			// New job is placed in place of old one
			dst_idx = dst_parent.subjobs.indexOf(dst_job);
			let dst_parent_removed_subjobs = dst_parent.replaceSubjob(src_job, dst_idx);
			
			// Re-insert old job
			if(src_type=='job')
				src_removed_subjobs = src_job.setSubjobs(dst_parent_removed_subjobs);
			else
			{
				let leaf = src_job.leftLeaf();
				src_removed_subjobs = leaf.setSubjobs(dst_parent_removed_subjobs);
			}
		}
		else if(dst_position=='bottom')
		{
			// Set new job as only child of destination and store previous children
			let dst_parent_removed_subjobs = dst_parent.setSubjobs(src_job);
			
			// Re-insert old children after new job and get replaced subjobs, they will be re-inserted later
			if(src_type=='job')
				src_removed_subjobs = src_job.setSubjobs(dst_parent_removed_subjobs);
			else
			{
				let leaf = src_job.leftLeaf();
				src_removed_subjobs = leaf.setSubjobs(dst_parent_removed_subjobs);
			}
		}
		else if(dst_position=='trash')
		{
			if(src_type=='job')
				src_removed_subjobs = src_job.subjobs;
		}
		
		if(src_parent)
		{
			// Remove old job
			src_parent.removeSubjob(src_idx);
			
			// Insert back removed children (ie old children of the newly inserted job)
			for(let i=0;i<src_removed_subjobs.length;i++)
				src_parent.addSubjob(src_removed_subjobs[i], src_idx++);
		}
	}
	
	getJob(id) {
		return this.getObject('job', id, this.subjobs);
	}
	
	getJobPath(id) {
		var path = [];
		
		this.parent_depth = 0;
		var ret = this.getObject('job', id, this.subjobs, path);
		
		return ret===false?false:path;
	}
	
	getTask(id) {
		return this.getObject('task', id, this.subjobs);
	}
	
	getTaskPath(id) {
		var path = [];
		
		this.parent_depth = 0;
		var ret = this.getObject('task', id, this.subjobs, path);
		
		return ret===false?false:path;
	}
	
	getInput(id) {
		return this.getObject('input', id, this.subjobs);
	}
	
	getInputPart(id) {
		return this.getObject('input-part', id, this.subjobs);
	}
	
	getObject(type, id, subjobs, path) {
		for(var i=0;i<subjobs.length;i++)
		{
			if(type=='job' && subjobs[i]._id==id)
			{
				if(subjobs[i].loop && path!==undefined)
				{
					path.push({group: 'Current job', values: [{value: 'evqGetCurrentJob()/evqGetContext()', name: 'Loop context'}]});
				}
				
				return subjobs[i];
			}
			else if(type=='task' || type=='input' || type=='input-part')
			{
				for(var j=0;j<subjobs[i].tasks.length;j++)
				{
					if(type=='task' && subjobs[i].tasks[j]._id==id)
					{
						if(path!==undefined && subjobs[i].tasks[j].loop)
						{
							path.push({group: 'Current task', value: '.', name: 'Loop context'});
							
							if(subjobs[i].loop)
								path.push({group: 'Current job', value: 'evqGetCurrentJob()/evqGetContext()', name: 'Loop context'});
						}
						return subjobs[i].tasks[j];
					}
					else if(type=='input' || type=='input-part')
					{
						if(type=='input' && subjobs[i].tasks[j].stdin._id==id)
							return subjobs[i].tasks[j].stdin;
						
						if(type=='input-part')
						{
							for(var l=0;l<subjobs[i].tasks[j].stdin.parts.length;l++)
							{
								if(subjobs[i].tasks[j].stdin.parts[l]._id==id)
									return subjobs[i].tasks[j].stdin.parts[l];
							}
						}
						
						for(var k=0;k<subjobs[i].tasks[j].inputs.length;k++)
						{
							if(type=='input' && subjobs[i].tasks[j].inputs[k]._id==id)
								return subjobs[i].tasks[j].inputs[k];
							
							if(type=='input-part')
							{
								for(var l=0;l<subjobs[i].tasks[j].inputs[k].parts.length;l++)
								{
									if(subjobs[i].tasks[j].inputs[k].parts[l]._id==id)
										return subjobs[i].tasks[j].inputs[k].parts[l];
								}
							}
						}
					}
				}
			}
			
			let job = this.getObject(type, id, subjobs[i].subjobs, path);
			if(job!==false)
			{
				if(path!==undefined)
				{
					var group = 'Parent job '+(this.parent_depth+1);
					if(subjobs[i].loop)
						path.push({group: group, value: 'evqGetParentJob('+(this.parent_depth)+'/evqGetContext()', name: 'Loop context'});
					
					for(var j=0;j<subjobs[i].tasks.length;j++)
						path.push({group: group, value: "evqGetParentJob("+(this.parent_depth)+")/evqGetOutput('"+subjobs[i].tasks[j].getPath()+"')", name:"Task: "+subjobs[i].tasks[j].getPath(), path: subjobs[i].tasks[j].getPath()});
					
					this.parent_depth++;
				}
				
				return job;
			}
		}
		
		return false;
	}
}

workflow.addSubjob = job.addSubjob;
workflow.removeSubjob = job.removeSubjob;
