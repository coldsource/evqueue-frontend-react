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
  * Author: Thibaud Bugier
  */

'use strict';

export class TruncatedText extends React.Component {
	constructor(props) {
		super(props);
		
		this.state = {
			text: this.props.maxlength > this.props.children.length ? this.props.children : this.props.children.substring(0, this.props.maxlength),
			truncate: this.props.maxlength > this.props.children.length ? false : true,
		};
		this.showFullValue = this.showFullValue.bind(this);
		this.showLessValue = this.showLessValue.bind(this);
	}
	
	renderValues() {
		if(this.state.truncate)
			return (<div>{this.state.text}<span className="faicon fa-plus-square" onClick={this.showFullValue} title="Show full value"></span></div>);
		
		return (<div>{this.state.text}<span className="faicon fa-minus-square" onClick={this.showLessValue} title="Show less value"></span></div>);
	}

	showFullValue() {
		this.setState({truncate:false});
		this.setState({text:this.props.children});
	}

	showLessValue() {
		this.setState({truncate:true});
		this.setState({text:this.props.children.substring(0, this.props.maxlength)});
	}

	render() {
		return (
			<div className="evq-truncated-text">
				{this.renderValues()}
			</div>
		);
	}
}

TruncatedText.defaultProps = {
	maxlength: 10
	};
