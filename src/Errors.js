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
			const el = selector.parentElement;
			const detail = el.nextElementSibling;
			if (detail.classList.contains('hidden')) {
				detail.classList.remove('hidden');
				// eslint-disable-next-line no-param-reassign
				selector.innerHTML = '▼';
			}
			else {
				detail.classList.add('hidden');
				// eslint-disable-next-line no-param-reassign
				selector.innerHTML = '▶';
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
			<div id="error-report-panel">
				<h3>Error Report</h3>
				<div class="error-report-logs"></div>
				<div class="error-close-button" onClick="Errors.Reporter.close()">X</div>
				<div class="error-clear-button" onClick="Errors.Reporter.clear()">Clear</div>
				<div class="error-copy-button" onClick="Errors.Reporter.copyAll()">Copy</div>
			</div>
		`;
		document.getElementById('main').appendChild(elment);
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
			<div class="error-log-showdetail" onClick="Errors.Reporter.show(this)" title="show details">▶</div>
			<div class="error-log-message">${logdata.message}</div>
		</div>
		<div class="error-log-detail hidden">
			<textarea class="error-log-entry" readonly onClick="Errors.Reporter.copy(this)">${logdata.message}\nsources:\n${logdata.source}\n\nstackdata:\n${formatErrorObj(logdata.data)}</textarea>
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
