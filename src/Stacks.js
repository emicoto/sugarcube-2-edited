/* eslint-disable linebreak-style */
/* eslint-disable no-unused-vars */

/***********************************************************************************************************************

	Stacks.js

	Copyright © 2024-2025 Lunefox All rights reserved.
	Use of this source code is governed by a BSD 2-clause "Simplified" License, which may be found in the LICENSE file.

***********************************************************************************************************************/
/*
	global Config, State, clone
*/

// eslint-disable-next-line no-var
var Stacks = (() => {
	'use strict';

	// Variables
	const _stacks = [];
	const _passages = [];

	function _clear() {
		_stacks.splice(0, _stacks.length);
		_passages.splice(0, _passages.length);
	}

	function _pushPassage(name) {
		_passages.push(name);
		_stacks.push(`@ passage :: ${name}`);
	}

	function _pushWidget(name, errorType) {
		_stacks.push(`@ widget <<${name}>>${errorType ? ` : ${errorType}` : ''}`);
		return _stacks.length - 1;
	}

	function _popPassage() {
		const lastPassage = _stacks.findIndex(stack => stack.includes(_passages[_passages.length - 1]));
		_stacks.splice(lastPassage, 1);
		return _passages.pop();
	}

	function _deleteWidget(index) {
		return _stacks.splice(index, 1);
	}

	function _popLast() {
		return _stacks.pop();
	}

	function _setStackType(index, errorType) {
		const text = _stacks[index].split(' : ')[0];
		_stacks[index] = `${text} : ${errorType}`;
	}

	function _listup() {
		let html = '\n';
		const stacks = clone(_stacks).reverse();
		html += `stop wikify ${stacks[0].split(' : ')[0]} on :: ${_passages[_passages.length - 1]}\n`;

		if (stacks[0].includes(' : ')) {
			stacks.shift();
		}

		html += `[stacks]\n ${stacks.join('\n ')}\n`;
		return html;
	}
	
	return Object.freeze({
		get : () => _stacks,
		
		clear  : _clear,
		listup : _listup,
		add    : _pushWidget,
		pop    : _popLast,
		delete : _deleteWidget,
		set    : _setStackType,
		
		passage : {
			get  : () => _passages,
			push : _pushPassage,
			pop  : _popPassage
		}
	});
})();
