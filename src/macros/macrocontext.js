/***********************************************************************************************************************

	macros/macrocontext.js

	Copyright © 2013–2021 Thomas Michael Edwards <thomasmedwards@gmail.com>. All rights reserved.
	Use of this source code is governed by a BSD 2-clause "Simplified" License, which may be found in the LICENSE file.

***********************************************************************************************************************/
/* global Config, DebugView, Patterns, State, Wikifier, throwError */

var MacroContext = (() => { // eslint-disable-line no-unused-vars, no-var
	'use strict';

	/*******************************************************************************************************************
		MacroContext Class.
	*******************************************************************************************************************/
	class MacroContext {
		constructor(contextData) {
			const context = Object.assign({
				passageObj  : null,
				parent      : null,
				macro       : null,
				name        : '',
				displayName : '',
				args        : null,
				payload     : null,
				parser      : null,
				source      : ''
			}, contextData);

			if (context.macro === null || context.name === '' || context.parser === null) {
				throw new TypeError('context object missing required properties');
			}

			Object.defineProperties(this, {
				self : {
					value : context.macro
				},

				passageObj : {
					value : context.passageObj
				},

				name : {
					value : typeof context.macro._ALIAS_OF === 'undefined' ? context.name : context.macro._ALIAS_OF
				},

				displayName : {
					value : context.name
				},

				args : {
					value : context.args
				},

				payload : {
					value : context.payload
				},

				source : {
					value : context.source
				},

				parent : {
					value : context.parent
				},

				parser : {
					value : context.parser
				},

				_output : {
					value : context.parser.output
				},

				_shadows : {
					writable : true,
					value    : null
				},

				_debugView : {
					writable : true,
					value    : null
				},

				_debugViewEnabled : {
					writable : true,
					value    : Config.debug
				}
			});
		}

		get output() {
			return this._debugViewEnabled ? this.debugView.output : this._output;
		}

		get shadows() {
			return Array.from(this._shadows);
		}

		get shadowView() {
			const view = new Set();

			for (let context = this; context !== null; context = context.parent) {
				if (context._shadows) {
					context._shadows.forEach(name => view.add(name));
				}
			}

			return Array.from(view);
		}

		get debugView() {
			if (this._debugViewEnabled) {
				return this._debugView !== null ? this._debugView : this.createDebugView();
			}

			return null;
		}

		contextHas(filter) {
			let context = this;

			while ((context = context.parent) !== null) {
				if (filter(context)) {
					return true;
				}
			}

			return false;
		}

		contextSelect(filter) {
			let context = this;

			while ((context = context.parent) !== null) {
				if (filter(context)) {
					return context;
				}
			}

			return null;
		}

		contextSelectAll(filter) {
			const result = [];
			let context = this;

			while ((context = context.parent) !== null) {
				if (filter(context)) {
					result.push(context);
				}
			}

			return result;
		}

		addShadow(...names) {
			if (!this._shadows) {
				this._shadows = new Set();
			}

			const varRe = new RegExp(`^${Patterns.variable}$`);

			names
				.flat(Infinity)
				.forEach(name => {
					if (typeof name !== 'string') {
						throw new TypeError(`variable name must be a string; type: ${typeof name}`);
					}

					if (!varRe.test(name)) {
						throw new Error(`invalid variable name "${name}"`);
					}

					this._shadows.add(name);
				});
		}

		createShadowWrapper(callback, doneCallback, startCallback) {
			/*
			if (!this.passageObj) {
				console.error('createShadowWrapper(): No passageObj.', this, this.passageObj);
			}
			*/
			const shadowContext = this;
			let shadowStore;

			if (typeof callback === 'function') {
				shadowStore = {};
				this.shadowView.forEach(varName => {
					const varKey = varName.slice(1);
					const store  = varName[0] === '$' ? State.variables : State.temporary;
					shadowStore[varName] = store[varKey];
				});
			}

			return function (...args) {
				if (typeof startCallback === 'function') {
					startCallback.apply(this, args);
				}

				if (typeof callback === 'function') {
					const shadowNames = Object.keys(shadowStore);
					const valueCache  = shadowNames.length > 0 ? {} : null;
					const macroParser = Wikifier.Parser.get('macro');
					let contextCache;

					/*
						There's no catch clause because this try/finally is here simply to ensure that
						proper cleanup is done in the event that an exception is thrown during the
						callback.
					*/
					try {
						/*
							Cache the existing values of the variables to be shadowed and assign the
							shadow values.
						*/
						shadowNames.forEach(varName => {
							const varKey = varName.slice(1);
							const store  = varName[0] === '$' ? State.variables : State.temporary;

							if (Object.hasOwn(store, varKey)) {
								valueCache[varKey] = store[varKey];
							}

							store[varKey] = shadowStore[varName];
						});

						// Cache the existing macro execution context and assign the shadow context.
						contextCache = macroParser.context;
						macroParser.context = shadowContext;

						// Call the callback function.
						callback.apply(this, args);
					}
					finally {
						// Revert the macro execution context shadowing.
						if (contextCache !== undefined) {
							macroParser.context = contextCache;
						}

						// Revert the variable shadowing.
						shadowNames.forEach(varName => {
							const varKey = varName.slice(1);
							const store  = varName[0] === '$' ? State.variables : State.temporary;

							/*
								Update the shadow store with the variable's current value, in case it
								was modified during the callback.
							*/
							shadowStore[varName] = store[varKey];

							if (Object.hasOwn(valueCache, varKey)) {
								store[varKey] = valueCache[varKey];
							}
							else {
								delete store[varKey];
							}
						});
					}
				}

				if (typeof doneCallback === 'function') {
					doneCallback.apply(this, args);
				}
			};
		}

		createDebugView(name, title) {
			this._debugView = new DebugView(
				this._output,
				'macro',
				name ? name : this.displayName,
				title ? title : this.source
			);

			if (this.payload !== null && this.payload.length > 0) {
				this._debugView.modes({ nonvoid : true });
			}

			this._debugViewEnabled = true;
			return this._debugView;
		}

		removeDebugView() {
			if (this._debugView !== null) {
				this._debugView.remove();
				this._debugView = null;
			}

			this._debugViewEnabled = false;
		}

		error(message, source, metadata, logged = true) {
			return throwError(this._output, `<<${this.displayName}>> ${message}`, source ? source : this.source, metadata ? metadata : null, logged);
		}

		log(...args) {
			const text = [];
			const metadata = [];

			args.forEach(arg => {
				if (typeof arg === 'string' || typeof arg === 'number') {
					text.push(arg);
				}
				else {
					metadata.push(arg);
				}
			});

			args.reduce((res, arg) => {
				if (!res.textEnd && (typeof arg === 'string' || typeof arg === 'number')) {
					res.text.push(arg);
				}
				else {
					res.metadata.push(arg);
					// eslint-disable-next-line no-param-reassign
					res.textEnd = true;
				}
				return res;
			}, { text, metadata, textEnd : false });

			return [`'[widget/${this.displayName}] ${text.join(' ')}`, this.source, metadata];
		}
	}


	/*******************************************************************************************************************
		Module Exports.
	*******************************************************************************************************************/
	return MacroContext;
})();
