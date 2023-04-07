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

export class Markdown extends React.Component {
	constructor(props) {
		super(props);
	}
	
	compile() {
		let lines = this.props.md.split("\n");
		
		this.md = [];
		for(const line of lines)
			this.md.push({type: 'line', content: line});
		
		this.handleFencedCode();
		this.handleParagraphs('code', /^\s{4,}/, false);
		this.handleParagraphs('quote', /^\>/);
		this.handleHeadings();
		this.handleLists('ol', /^\s*[0-9]+\.\s/);
		this.handleLists('ul', /^\s*\*\s/);
		this.handleLists('ul', /^\s*\+\s/);
		this.handleLists('ul', /^\s*\-\s/);
		this.handleParagraphs('p', /^/);
		
		return this.md;
	}
	
	// Fenced code
	handleFencedCode() {
		let current_code = null;
		let code_start;
		let code_lines;
		
		for(let i=0;i<this.md.length;i++)
		{
			let content = this.md[i].content;
			if(content=="~~~" || content=="```")
			{
				if(current_code===null) // Start new block
				{
					current_code = {type: 'code', content: []};
					code_start = i;
					code_lines = 1;
				}
				else // End current block
				{
					current_code.content = [{type: 'text', content: current_code.content.join("\n")}];
					this.md.splice(code_start, code_lines + 1, current_code);
				}
			}
			else if(current_code!==null) // We are un block code
			{
				current_code.content.push(content);
				code_lines++;
			}
		}
	}
	
	// Paragraphs
	handleParagraphs(html_el, regex, handle_inline = true) {
		let current_p = null;
		
		for(let i=0;i<this.md.length;i++)
		{
			let content = this.md[i].content;
			if(this.md[i].type!='line' || content=="" || content.match(regex)===null)
			{
				if(current_p)
					current_p.content = handle_inline?this.handleInline(current_p.content):[{type: 'text', content: current_p.content}];
				
				current_p = null;
			}
			else
			{
				content = content.replace(regex,'');
				if(current_p===null)
				{
					current_p = {type: html_el, content: content};
					this.md.splice(i, 1, current_p);
				}
				else
				{
					current_p.content += (handle_inline?" ":"\n") + content;
					this.md.splice(i, 1);
					i--;
				}
			}
		}
		
		if(current_p)
			current_p.content = handle_inline?this.handleInline(current_p.content):[{type: 'text', content: current_p.content}];
	}
	
	// Lists
	isListItem(str, regex) {
		if(str.match(regex)!==null)
			return str.replace(regex, '').trim();
		return false;
	}
	
	handleLists(html_el, regex) {
		let lists_stack = [];
		let current_indent = 0;
		
		for(let i=0;i<this.md.length;i++)
		{
			let li = false;
			if(this.md[i].type=='line')
				li = this.isListItem(this.md[i].content, regex);
			
			if(li===false)
			{
				if(lists_stack.length>0 && this.md[i].type=='line' && this.md[i].content!='') // Continuation of last item
				{
					let ol = lists_stack[lists_stack.length-1];
					let li = ol.content[ol.content.length-1];
					li.content = li.content.concat(this.handleInline(" " + this.md[i].content));
					this.md.splice(i, 1);
					i--;
				}
				else
					lists_stack = [];
			}
			else
			{
				let indent = this.md[i].content.match(/\s*/)[0].length;
				
				if(lists_stack.length==0 || indent>current_indent)
				{
					current_indent = indent;
					
					let new_list = {type: html_el, content: [{type: 'li', content: this.handleInline(li)}]};
					
					if(lists_stack.length==0)
						this.md.splice(i, 1, new_list);
					else
					{
						const content = lists_stack[lists_stack.length-1].content;
						const last_li = content[content.length-1];
						last_li.content.push(new_list);
						this.md.splice(i, 1);
						i--;
					}
					
					lists_stack.push(new_list);
				}
				else
				{
					if(indent<current_indent && lists_stack.length>1)
						lists_stack.pop();
					
					lists_stack[lists_stack.length-1].content.push({type: 'li', content: this.handleInline(li)});
					this.md.splice(i, 1);
					i--;
				}
			}
		}
	}
	
	// Headings
	handleHeadings() {
		for(let i=0;i<this.md.length;i++)
		{
			if(this.md[i].type=='line')
			{
				let matches = this.md[i].content.match(/^(#{1,6})\s+/);
				if(matches!==null)
					this.md.splice(i, 1, {type: 'heading', level: matches[1].length, content: this.handleInline(this.md[i].content.substr(matches[0].length))});
			}
		}
	}
	
	// Inline
	handleInline(str) {
		let lines = str.split("\n");
		for(let i=0;i<lines.length;i++)
		{
			let richtext = [{type: 'text', content: lines[i]}];
			this.handleInlineRecursive(richtext, str => this.handleInlineRegex(str, /(\s{2,}$)/, 1, 'line-break')); // Line breaks
			this.handleInlineRecursive(richtext, str => this.handleInlineRegex(str, /(\*\*.*?\*\*)($|[^\*])/, 2, 'bold')); // Bold **...**
			this.handleInlineRecursive(richtext, str => this.handleInlineRegex(str, /(\*[^\*]+\*)/, 1, 'em')); // Italic *...*
			this.handleInlineRecursive(richtext, this.handleInlineImages); // Images ![...](...)
			this.handleInlineRecursive(richtext, this.handleInlineLinks); // Links [...](...)
			lines.splice(i, 1, ...richtext);
			i+= richtext.length-1;
		}
		return lines;
	}
	
	handleInlineRecursive(richtext, cbk) {
		for(let i=0;i<richtext.length;i++)
		{
			if(richtext[i].type=='text')
			{
				let res = cbk(richtext[i].content, i);
				if(res!==false)
				{
					richtext.splice(i, 1, ...res);
					i += res.length - 1;
				}
			}
			else if(richtext[i].content!==undefined)
				this.handleInlineRecursive(richtext[i].content, cbk);
		}
	}
	
	handleInlineRegex(str, regex, sub, type) {
		let parts = str.split(regex);
		
		if(parts.length==1)
			return false; // Nothing to replace
		
		let res = [];
		for(let i=0;i<parts.length;i++)
		{
			if(parts[i].match(regex)!==null)
				res.push({type: type, content: [{type: 'text', content: parts[i].substr(sub,parts[i].length-2*sub)}]});
			else if(parts[i]!='')
				res.push({type: 'text', content: parts[i]});
		}
		
		return res;
	}
	
	handleInlineLinks(str) {
		let parts = str.split(/(\[[^\]]+\]\([^)]+\))/);
		
		if(parts.length==1)
			return false; // Nothing to replace
		
		let res = [];
		for(let i=0;i<parts.length;i++)
		{
			let matches = parts[i].match(/\[([^\]]+)\]\(([^)]+)\)/);
			if(matches!==null)
				res.push({type: 'link', name: matches[1], href: matches[2]});
			else if(parts[i]!='')
				res.push({type: 'text', content: parts[i]});
		}
		
		return res;
	}
	
	handleInlineImages(str) {
		let parts = str.split(/(\!\[[^\]]+\]\([^)]+\))/);
		
		if(parts.length==1)
			return false; // Nothing to replace
		
		let res = [];
		for(let i=0;i<parts.length;i++)
		{
			let matches = parts[i].match(/\!\[([^\]]+)\]\(([^)]+)\)/);
			if(matches!==null)
				res.push({type: 'image', alt: matches[1], src: matches[2]});
			else if(parts[i]!='')
				res.push({type: 'text', content: parts[i]});
		}
		
		return res;
	}
	
	renderMD(el) {
		return el.map((el, idx) => {
			if(el.type=='text')
				return (<React.Fragment key={idx}>{el.content}</React.Fragment>);
			
			if(el.type=='line-break')
				return (<br key={idx} />);
			
			if(el.type=='p')
				return (<p key={idx}>{this.renderMD(el.content)}</p>);
			
			if(el.type=='bold')
				return (<strong key={idx}>{this.renderMD(el.content)}</strong>);
			
			if(el.type=='em')
				return (<em key={idx}>{this.renderMD(el.content)}</em>);
			
			if(el.type=='link')
				return (<a target="_blank" key={idx} href={el.href}>{el.name}</a>);
			
			if(el.type=='image')
				return (<img alt={el.alt} key={idx} src={el.src} />);
			
			if(el.type=='heading')
				return React.createElement('h' + el.level, {key: idx}, this.renderMD(el.content));
			
			if(el.type=='ol')
				return (<ol key={idx}>{this.renderMD(el.content)}</ol>);
			
			if(el.type=='ul')
				return (<ul key={idx}>{this.renderMD(el.content)}</ul>);
			
			if(el.type=='li')
				return (<li key={idx}>{this.renderMD(el.content)}</li>);
			
			if(el.type=='code')
				return (<pre key={idx}><code>{this.renderMD(el.content)}</code></pre>);
			
			if(el.type=='quote')
				return (<blockquote key={idx}>{this.renderMD(el.content)}</blockquote>);
		});
	}
	
	render() {
		let md = this.compile();
		
		return (
			<div className="markdown">
				{this.renderMD(md)}
			</div>
		);
	}
}
