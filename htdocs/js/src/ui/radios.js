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

export const RadiosContext = React.createContext({});

export class Radios extends React.Component {
	constructor(props) {
		super(props);
	}
	
	render() {
		return (
			<RadiosContext.Provider value={{value: this.props.value, name: this.props.name, onChange: this.props.onChange}}>
				{this.props.children}
			</RadiosContext.Provider>
		);
	}
}
