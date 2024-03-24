/* eslint-disable linebreak-style */
/* eslint-disable no-unused-vars */

/***********************************************************************************************************************

	engine.js

	Copyright © 2013–2021 Thomas Michael Edwards <thomasmedwards@gmail.com>. All rights reserved.
	Use of this source code is governed by a BSD 2-clause "Simplified" License, which may be found in the LICENSE file.

***********************************************************************************************************************/
/*
	global Config
*/

// eslint-disable-next-line no-var
var Errors = (() => {
	'use strict';

	let _footertext = 'Please report any errors to the devs.';

	const reporter = {
		logs : [],

		copy(selector) {
			selector.select();
			document.execCommand('copy');
		},

		copyAll() {
			const entries = document.querySelectorAll('.error-log-entry');
			let text = '';
			entries.forEach(log => {
				text += `${log.value}\n\n`;
			});
			const el = document.createElement('textarea');
			el.value = text;
			document.body.appendChild(el);
			el.select();
			document.execCommand('copy');
			document.body.removeChild(el);
		},

		show(selector) {
			const el = selector.parentNode.nextElementSibling;
			if (el.classList.contains('hidden')) {
				el.classList.remove('hidden');
				// eslint-disable-next-line no-param-reassign
				selector.querySelector('.error-log-showdetail').innerHTML = '▼';
			}
			else {
				el.classList.add('hidden');
				// eslint-disable-next-line no-param-reassign
				selector.querySelector('.error-log-showdetail').innerHTML = '▶';
			}
		},

		close() {
			const el = document.getElementById('error-report-box');
			el.parentNode.removeChild(el);
		},

		clear() {
			this.logs = [];
			this.update();
		},

		update() {
			const el = document.getElementById('error-report-box');
			el.querySelector('.error-report-logs').innerHTML = '';
			this.logs.forEach(logdata => {
				drawLog(logdata);
			});
		}
	};

	function popErrorBox() {
		const el = document.getElementById('error-report-box');
		if (el && el.classList.contains('hidden')) {
			el.classList.remove('hidden');
		}
		else if (el) {
			reporter.update();
		}
		else {
			drawView();
			reporter.update();
		}
	}

	function hideErrorBox() {
		const el = document.getElementById('error-report-box');
		if (el && !el.classList.contains('hidden')) {
			el.classList.add('hidden');
		}
	}

	function drawView() {
		const elment = document.createElement('div');
		elment.id = 'error-report-box';
		elment.className = 'error-report';
		elment.innerHTML = `
			<div id="error-report-title">
				<h3>Errors</h3>
				<div class="error-close-button" onClick="Errors.reporter.close()">X</div>
			</div>
			<div id="error-report-panel">
				<div class="error-report-logs"></div>
			</div>
			<div id="error-report-footer">
				<div class="error-report-footer-text">${_footertext}</div>
				<div class="error-clear-button" onClick="Errors.reporter.clear()">Clear</div>
				<div class="error-copy-button" onClick="Errors.reporter.copyAll()">Copy</div>
			</div>
		`;
		document.getElementById('story-main').appendChild(elment);
		$(elment).draggable({ handle : '#error-report-title' });
	}
	
	function formatErrorObj(obj) {
		/* turns object into a prettified JSON string for display */
		return JSON.stringify(obj, (key, value) => {
			/* custom replacer function to keep stuff from turning into null */
			if (Number.isNaN(value)) return 'NaN';
			else if (value === undefined) return 'Undefined';
			else if (value === Infinity) return 'Infinity';
			return value;
		}).replace(/([,:;])/g, '$1 '); // add spaces after commas, colons, and semicolons
	}

	function drawLog(logdata) {
		const log = document.createElement('div');
		log.className = 'error-report-log';
		log.innerHTML = `
		<div class="error-log-banner">	
			<div class="error-log-message" onClick="Errors.reporter.show(this)" title="click to show detials"><span class="error-log-showdetail">▶</span>${logdata.message}</div>
		</div>
		<div class="error-log-detail hidden">
			<textarea class="error-log-entry" readonly onClick="Errors.reporter.copy(this)">${logdata.message}\nsources:\n${logdata.source}\n\nstackdata:\n${formatErrorObj(logdata.data)}</textarea>
		</div>
		`;

		document.querySelector('.error-report-logs').appendChild(log);
	}


	function record(message, source, data) {
		while (reporter.logs.length >= Config.debug.maxLogEntries) {
			reporter.logs.shift();
		}

		const error = { message, source, data };
		reporter.logs.push(JSON.parse(JSON.stringify(error)));

		return error;
	}

	function report(message, source, data, autoPop = true) {
		let error;
		try {
			// eslint-disable-next-line no-unused-vars
			error = record(message, source, data);
		}
		catch (er) {
			console.error('Failed to append an error log. Something went really wrong:', message, source, data, er);
			// eslint-disable-next-line no-alert
			alert('A critical error occurred. Please report this issue to the devs. [Errors.report/registerMessage]');
		}

		try {
			if (!autoPop) return;
			popErrorBox();
		}
		catch (er) {
			console.error('Failed to draw the error report. Something went really wrong:', message, source, data, reporter.logs, er);
			// eslint-disable-next-line no-alert
			alert('A critical error occurred. Please report this issue to the devs. [Errors.report/registerMessage]');
		}
	}

	return Object.seal({
		get text() {
			return _footertext;
		},

		set text(value) {
			_footertext = value;
		},

		get logs() {
			return reporter.logs;
		},

		get reporter() {
			return reporter;
		},

		record,
		report,
		drawView,
		drawLog,
		pop  : popErrorBox,
		hide : hideErrorBox
	});
})();
