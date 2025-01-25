/***********************************************************************************************************************

	lib/helpers.js

	Copyright © 2013–2021 Thomas Michael Edwards <thomasmedwards@gmail.com>. All rights reserved.
	Use of this source code is governed by a BSD 2-clause "Simplified" License, which may be found in the LICENSE file.

***********************************************************************************************************************/
/* global Config, L10n, State, Story, Util, Wikifier, Errors, Stacks */

var { // eslint-disable-line no-var
	/* eslint-disable no-unused-vars */
	convertBreaks,
	safeActiveElement,
	setDisplayTitle,
	setPageElement,
	throwError,
	stringFrom
	/* eslint-enable no-unused-vars */
} = (() => {
	'use strict';


	/*******************************************************************************************************************
		Utility Functions.
	*******************************************************************************************************************/
	function _getTextContent(source) {
		const copy = source.cloneNode(true);
		const frag = document.createDocumentFragment();
		let node;

		while ((node = copy.firstChild) !== null) {
			// Insert spaces before various elements.
			if (node.nodeType === Node.ELEMENT_NODE) {
				switch (node.nodeName.toUpperCase()) {
				case 'BR':
				case 'DIV':
				case 'P':
					frag.appendChild(document.createTextNode(' '));
					break;
				}
			}

			frag.appendChild(node);
		}

		return frag.textContent;
	}


	/*******************************************************************************************************************
		Helper Functions.
	*******************************************************************************************************************/
	/*
		Converts <br> elements to <p> elements within the given node tree.
	*/
	function convertBreaks(source) {
		const output = document.createDocumentFragment();
		let para = document.createElement('p');
		let node;

		while ((node = source.firstChild) !== null) {
			if (node.nodeType === Node.ELEMENT_NODE) {
				const tagName = node.nodeName.toUpperCase();

				switch (tagName) {
				case 'BR':
					if (
						   node.nextSibling !== null
						&& node.nextSibling.nodeType === Node.ELEMENT_NODE
						&& node.nextSibling.nodeName.toUpperCase() === 'BR'
					) {
						source.removeChild(node.nextSibling);
						source.removeChild(node);
						output.appendChild(para);
						para = document.createElement('p');
						continue;
					}
					else if (!para.hasChildNodes()) {
						source.removeChild(node);
						continue;
					}
					break;

				case 'ADDRESS':
				case 'ARTICLE':
				case 'ASIDE':
				case 'BLOCKQUOTE':
				case 'CENTER':
				case 'DIV':
				case 'DL':
				case 'FIGURE':
				case 'FOOTER':
				case 'FORM':
				case 'H1':
				case 'H2':
				case 'H3':
				case 'H4':
				case 'H5':
				case 'H6':
				case 'HEADER':
				case 'HR':
				case 'MAIN':
				case 'NAV':
				case 'OL':
				case 'P':
				case 'PRE':
				case 'SECTION':
				case 'TABLE':
				case 'UL':
					if (para.hasChildNodes()) {
						output.appendChild(para);
						para = document.createElement('p');
					}

					output.appendChild(node);
					continue;
				}
			}

			para.appendChild(node);
		}

		if (para.hasChildNodes()) {
			output.appendChild(para);
		}

		source.appendChild(output);
	}

	/*
		Returns `document.activeElement` or `null`.
	*/
	function safeActiveElement() {
		/*
			IE9 contains a bug where trying to access the active element of an iframe's
			parent document (i.e. `window.parent.document.activeElement`) will throw an
			exception, so we must allow for an exception to be thrown.

			We could simply return `undefined` here, but since the API's default behavior
			should be to return `document.body` or `null` when there is no selection, we
			choose to return `null` in all non-element cases (i.e. whether it returns
			`null` or throws an exception).  Just a bit of normalization.
		*/
		try {
			return document.activeElement || null;
		}
		catch (ex) {
			return null;
		}
	}

	/*
		Sets the display title.
	*/
	function setDisplayTitle(title) {
		if (typeof title !== 'string') {
			throw new TypeError(`story display title must be a string (received: ${Util.getType(title)})`);
		}

		const render = document.createDocumentFragment();
		new Wikifier(render, title);

		const text = _getTextContent(render).trim();

		// if (text === '') {
		// 	throw new Error('story display title must not render to an empty string or consist solely of whitespace');
		// }

		document.title = Config.passages.displayTitles && State.passage !== '' && State.passage !== Config.passages.start
			? `${State.passage} | ${text}`
			: text;

		const storyTitle = document.getElementById('story-title');

		if (storyTitle !== null) {
			jQuery(storyTitle).empty().append(render);
		}
	}

	/*
		Wikifies a passage into a DOM element corresponding to the passed ID and returns the element.
	*/
	function setPageElement(idOrElement, titles, defaultText) {
		const el = typeof idOrElement === 'object'
			? idOrElement
			: document.getElementById(idOrElement);

		if (el == null) { // lazy equality for null
			return null;
		}

		const ids = Array.isArray(titles) ? titles : [titles];

		jQuery(el).empty();

		for (let i = 0, iend = ids.length; i < iend; ++i) {
			if (Story.has(ids[i])) {
				new Wikifier(el, Story.get(ids[i]).processText().trim());
				return el;
			}
		}

		if (defaultText != null) { // lazy equality for null
			const text = String(defaultText).trim();

			if (text !== '') {
				new Wikifier(el, text);
			}
		}

		return el;
	}

	/*
		Appends an error view to the passed DOM element.
	*/
	function throwError(place, message, source, metadata, logged = false) {
		const $wrapper = jQuery(document.createElement('div'));
		const $toggle  = jQuery(document.createElement('button'));
		const $source  = jQuery(document.createElement('pre'));

		const digest = message.replace(/\n/g, ' ').slice(0, 80);
		const version = Config.saves.version ? ` (${Config.saves.version})` : '';
		const mesg     = `${L10n.get('errorTitle')}: ${message || 'unknown error'}${version}`;

		console.warn(`${mesg}\n\t${source.replace(/\n/g, '\n\t')}`, metadata);

		if (logged) {
			Errors.report(message, source, metadata);
			jQuery(document.createElement('span'))
				.addClass('error')
				.text(`Error: ${digest}${version}`)
				.appendTo($wrapper);

			$wrapper
				.addClass('error-view')
				.appendTo(place);
	
			return false;
		}

		$toggle
			.addClass('error-toggle')
			.ariaClick({
				label : L10n.get('errorToggle')
			}, () => {
				if ($toggle.hasClass('enabled')) {
					$toggle.removeClass('enabled');
					$source.attr({
						'aria-hidden' : true,
						hidden        : 'hidden'
					});
				}
				else {
					$toggle.addClass('enabled');
					$source.removeAttr('aria-hidden hidden');
				}
			})
			.appendTo($wrapper);
		jQuery(document.createElement('span'))
			.addClass('error')
			.text(`${mesg}(:: ${Stacks.passage.last()})`)
			.appendTo($wrapper);
		jQuery(document.createElement('code'))
			.text(source)
			.appendTo($source);
		$source
			.addClass('error-source')
			.attr({
				'aria-hidden' : true,
				hidden        : 'hidden'
			})
			.appendTo($wrapper);
		$wrapper
			.addClass('error-view')
			.appendTo(place);

		return false;
	}

	/*
		Returns the simple string representation of the given value or, if there is
		none, a square bracketed representation.
	*/
	function stringFrom(value) {
		switch (typeof value) {
		case 'function':
			return '[function]';

		case 'number':
			if (Number.isNaN(value)) {
				return '[number NaN]';
			}

			break;

		case 'object':
			if (value === null) {
				return '[null]';
			}
			else if (value instanceof Array) {
				return value.map(val => stringFrom(val)).join(', ');
			}
			else if (value instanceof Set) {
				return Array.from(value).map(val => stringFrom(val)).join(', ');
			}
			else if (value instanceof Map) {
				const result = Array.from(value).map(([key, val]) => `${stringFrom(key)} \u2192 ${stringFrom(val)}`);
				return `{\u202F${result.join(', ')}\u202F}`;
			}
			else if (value instanceof Date) {
				return value.toLocaleString();
			}
			else if (value instanceof Element) {
				if (
					value === document.documentElement
					|| value === document.head
					|| value === document.body
				) {
					throw new Error('illegal operation; attempting to convert the <html>, <head>, or <body> tags to string is not allowed');
				}

				return value.outerHTML;
			}
			else if (value instanceof Node) {
				return value.textContent;
			}
			else if (typeof value.toString === 'function') {
				return value.toString();
			}

			return Object.prototype.toString.call(value);

		case 'symbol': {
			const desc = typeof value.description !== 'undefined' ? ` "${value.description}"` : '';
			return `[symbol${desc}]`;
		}

		case 'undefined':
			return '[undefined]';
		}

		return String(value);
	}


	/*******************************************************************************************************************
		Module Exports.
	*******************************************************************************************************************/
	return Object.freeze(Object.defineProperties({}, {
		convertBreaks     : { value : convertBreaks },
		safeActiveElement : { value : safeActiveElement },
		setDisplayTitle   : { value : setDisplayTitle },
		setPageElement    : { value : setPageElement },
		throwError        : { value : throwError },
		stringFrom        : { value : stringFrom }
	}));
})();
