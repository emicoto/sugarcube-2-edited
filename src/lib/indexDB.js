/* eslint-disable linebreak-style */
/* eslint-disable no-param-reassign */
var idb = (() => {// eslint-disable-line no-unused-vars, no-var
	'use strict';
	  
	// if not supported, turn off the feature
	if (window.indexedDB == null) {
		console.log('This browser doesn\'t support IndexedDB');
		return Object.freeze({
			active : false
		});
	}

	//--------------------------------------------------------------------------------
	//
	//  feature variables
	//
	//--------------------------------------------------------------------------------

	const defaultDBName = 'SugarCube'; // the default database name

	let db;  // database
	let _setting = {
		database  : defaultDBName,
		storeList : [{ name : 'savedata', key : 'id' }]
	}; // store setting

	let database = {};

	//--------------------------------------------------------------------------------
	//
	//  feature methods
	//
	//--------------------------------------------------------------------------------

	function checkType(database, storeList) {
		if (typeof database !== 'string' || database === '') {
			throw new TypeError('The database name must be a non-empty string');
		}
		if (!Array.isArray(storeList) || storeList.length === 0) {
			throw new TypeError('The store list must be a non-empty array');
		}
		if (storeList.some(store => typeof store.name !== 'string' || store.name === '' || typeof store.key !== 'string' || store.key === '')) {
			throw new TypeError('Each store must have a non-empty name and key');
		}

		return true;
	}

	/**
	 * @param {string} name
	 * @param {Array<{ name:string, key:string }>} storelist
	 */
	async function openDB(name, storelist) {
		if (name && storelist) {
			checkType(name, storelist);
		}
		
		if (!name) {
			name = _setting.database;
		}
		else {
			_setting.database = name;
		}

		if (!storelist) {
			storelist = _setting.storeList;
		}
		else {
			_setting.storeList = storelist;
		}
		
		const request = window.indexedDB.open(name);

		request.onerror = function (event) {
			console.error(`Database error: ${event.target.errorCode}`);
		};

		request.onupgradeneeded = function (event) {
			storelist.forEach(store => {
				if (!event.target.result.objectStoreNames.contains(store.name)) {
					event.target.result.createObjectStore(store.name, { keyPath : store.key });
				}
			});

			console.log('Database setup complete');
			db = event.target.result;
		};

		request.onsuccess = function (event) {
			db = event.target.result;
			console.log('Database opened successfully');
		};

		request.onblocked = function () {
			console.log('Something went wrong, the indexedDB has been blocked.');
		};

		await delay(100);
	}

	// eslint-disable-next-line require-await
	async function delay(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	/**
	 * turn a request into a promise
	 * @param {Request} request
	 * @returns {Promise}
	 */
	function makePromise(request) {
		return new Promise((resolve, reject) => {
			request.onsuccess = function (event) {
				resolve(event.target.result);
			};

			request.onerror = function (event) {
				reject(event.target.errorCode);
			};
		});
	}

	function loadStore(storeName, mode) {
		mode ??= 'readonly';

		const store = db.transaction([storeName], mode).objectStore(storeName);
		return makePromise(store.getAll()).then(result => {
			const res = new Map();
			result.forEach(item => {
				res.set(item.id, item.data);
			});
			return res;
		});
	}

	async function loadDB() {
		const result = {};
		await _setting.storeList.forEach(async store => {
			result[store.name] = await loadStore(store.name);
		});
		database = await result;
	}

	/**
	 * @param {string} database
	 * @param {Array<{name: string, key: string}>} storeList
	 */
	async function init(database, storeList) {
		checkType(database, storeList);

		_setting.database = database;
		_setting.storeList = storeList;

		await openDB();
		await loadDB();
	}

	async function update() {
		await loadDB();
	}


	/**
	 * @param {string} storeName
	 * @returns {number}
	 */
	function getCount(storeName) {
		const quest = database[storeName].size;
		return quest;
	}

	/**
	 * @param {string} storeName
	 * @returns {number}
	 * @description auto generate new key for the store
	 */
	function autoNewKey(storeName) {
		let key = 0;
		const count = getCount(storeName);
		const id = Array.from(database[storeName].keys())[count - 1];

		if (Number(id)) {
			key = id + 1;
		}
		else if (id) {
			key = `${storeName}_${count}`;
		}
		else {
			key = count;
		}

		return key;
	}

	/**
	 * @param {string} storeName
	 * @param {object} data
	 * @param {string | number} key
	 * @description save data to the store
	 */
	function setItem(storeName, data, key) {
		key ??= autoNewKey(storeName);

		const request = db.transaction([storeName], 'readwrite').objectStore(storeName).put({ id : key, data });
		request.onsuccess = function () {
			console.log(`data saved to slot ${key}`);
			idb.update();
		};

		request.onerror = function (event) {
			console.error(`Error saving data to slot ${key}`, event.target.errorCode);
		};
	}

	/**
	 * @param {string} storeName
	 * @param {string | number} key
	 * @returns {object}
	 */
	function getItem(storeName, key) {
		const data = database[storeName].find(item => item.id === key);
		return data;
	}


	function deleteItem(storeName, key) {
		const request = db.transaction([storeName], 'readwrite').objectStore(storeName).delete(key);

		request.onsuccess = function () {
			console.log(`data deleted from slot ${key}`);
			idb.update();
		};

		request.onerror = function (event) {
			console.error(`Error deleting data from slot ${key}`, event.target.errorCode);
		};
	}

	function clearStore(storeName) {
		const request = db.transaction([storeName], 'readwrite').objectStore(storeName).clear();

		request.onsuccess = function () {
			console.log(`store ${storeName} cleared`);
			idb.update();
		};

		request.onerror = function (event) {
			console.error(`Error clearing store ${storeName}`, event.target.errorCode);
		};
	}

	function clearDatabase() {
		_setting.storeList.forEach(store => {
			clearStore(store.name);
		});
	}

	return Object.freeze({
		get active() {
			return true;
		},

		get db() {
			return db;
		},

		get setting() {
			return _setting;
		},

		/**
		 * @param {{
		 * 	database : string,
		 * 	storeList : Array.<{ name : string, key : string }>
		 * }} object
		 */
		set setting(object) {
			checkType(object.database, object.storeList);
			_setting = object;
		},

		get database() {
			return database;
		},

		init,
		update,

		open : openDB,
		load : loadDB,
		loadStore,

		setItem,
		getItem,
		deleteItem,
		clearStore,

		getCount,
		autoNewKey,
		clearDb : clearDatabase
	});
})();
