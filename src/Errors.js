/* eslint-disable linebreak-style */
/* eslint-disable no-unused-vars */

/***********************************************************************************************************************

	Errors.js

	Copyright © 2024-2025 Lunefox All rights reserved.
	Use of this source code is governed by a BSD 2-clause "Simplified" License, which may be found in the LICENSE file.

***********************************************************************************************************************/
/*
	global Config, Stacks
*/

// eslint-disable-next-line no-var
var Errors = (() => {
	'use strict';

	let _footertext = 'Please report the errors to the devs.';

	const reporter = {
		logs     : [],
		onExport : [],

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
			return text;
		},

		print() {
			// print all logs to console
			const text = this.copyAll();
			console.log(text);
		},

		export() {
			// export all logs to a file
			const text = this.copyAll();
			const content = [text];

			// add any additional export data
			if (this.onExport.length > 0) {
				this.onExport.forEach(fn => {
					content.push(fn());
				});
			}

			const blob = new Blob(content, { type : 'text/plain' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = 'error-report.txt';
			a.click();
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
			const $el = document.getElementById('error-report-box');
			$el.querySelector('.error-report-logs').innerHTML = '';
			this.logs.forEach(logdata => {
				drawLog($el, logdata);
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

	function destroyErrorBox() {
		const el = document.getElementById('error-report-box');
		if (el) {
			el.parentNode.removeChild(el);
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
			</div>
			<div class="error-button-list">
				<div class="error-button" onClick="Errors.reporter.clear()">Clear</div>
				<div class="error-button" onClick="Errors.reporter.export()">Export</div>
				<div class="error-button" onClick="Errors.reporter.print()">Print</div>
				<div class="error-button" onClick="Errors.reporter.copyAll()">Copy</div>
			</div>
		`;
		document.body.appendChild(elment);
		$(elment).draggable({ handle : '#error-report-title' });
		$(elment).resizable({ handles : 'e, s, es', maxHeight : 600, maxWidth : 500 });
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

	function drawLog(el, logdata) {
		const $log = jQuery(document.createElement('div'));
		// excape all < > to prevent html injection
		const content = logdata.message.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace('/n', '<br>');
		const digest = content.replace(/\n/g, ' ').slice(0, 80);
		const details = [
			`${content}`,
			`${Stacks.listup()}`
		];

		if (logdata.source) {
			const source = logdata.source.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace('/n', '<br>');
			details.push(`[source]\n${source}`);
		}

		if (logdata.data) {
			details.push(`[metadata]\n${formatErrorObj(logdata.data)}`);
		}

		$log.addClass('error-report-log');
		$log.html(`
		<div class="error-log-banner">	
			<div class="error-log-message" onClick="Errors.reporter.show(this)" title="click to show detials"><span class="error-log-showdetail">▶</span>${digest}</div>
		</div>
		<div class="error-log-detail hidden">
			<textarea class="error-log-entry" readonly onClick="Errors.reporter.copy(this)">${details.join('\n')}</textarea>
		</div>
		`);

		jQuery(el).find('.error-report-logs').append($log);
	}


	function record(message, source, data) {
		while (reporter.logs.length >= Config.maxErrorLogs) {
			reporter.logs.shift();
		}

		const error = { message, source, data };
		reporter.logs.push(error);

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
		pop     : popErrorBox,
		hide    : hideErrorBox,
		destroy : destroyErrorBox,

		onExport(fn) {
			reporter.onExport.push(fn);
		}
	});
})();
