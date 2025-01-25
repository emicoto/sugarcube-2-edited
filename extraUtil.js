/* eslint-disable linebreak-style */
/* eslint-disable no-var */
/* eslint-disable no-fallthrough */
/* eslint-disable no-param-reassign */
/* eslint-disable id-length */
/* eslint-disable no-use-before-define */
/* eslint-disable no-throw-literal */
/* eslint-disable no-undef */
/* eslint-disable strict */
/* eslint-disable linebreak-style */
/* eslint-disable no-restricted-globals */
/* eslint-disable no-unused-vars */

function clearCommentFromArray(array) {
	return array.filter(
	   item => item[0] !== '/' && item[1] !== '*' || item[0] !== ';'
	);
}
 
function trimArray(array) {
	return array.map(item => item.trim());
}
 
function cleanArray(array) {
	array = clearCommentFromArray(array);
	return trimArray(array);
}
 
function loadCSV(filedata) {
	const _raw = filedata;
	const raw = _raw.split('\n');
 
	let data = {};
 
	// conver general csv file to object
	if (
	   raw[0].count(',') > 1 &&
	   raw[0].has('Id', 'id', 'ID', 'No', 'no', 'NO', 'Name', 'name', 'NAME')
	) {
	   // get the header
	   let header = raw[0].split(',');
	   header = cleanArray(header);
	   data = [];
 
	   for (const _row of raw) {
		  const obj = {};
 
		  // clear comment
		  if (_row[0] === '/' && _row[1] === '*' || _row[0] === ';') continue;
		  // clear empty row and skip the header
		  if (!_row.length || _row === raw[0]) continue;
 
		  let row = _row.split(',');
		  row = cleanArray(row);
 
		  // create the object
		  for (let j = 0; j < header.length; j++) {
			 if (header[j]) obj[header[j]] = row[j];
			 else obj[j] = row[j];
		  }
 
		  data.push(obj);
	   }
	}
 
	// conver era type csv file to object
	else {
	   for (const _row of raw) {
		  // clear comment
		  if (
			 _row[0] === '/' && _row[1] === '*' ||
			 _row[0] === ';' ||
			 !_row.length
		  ) continue;
 
		  let row = _row.split(',');
		  // init the path
		  const path = row[0];
 
		  row = cleanArray(row);
		  // the duplicate path is array
		  const times = _raw.split(`\n${path},`).length - 1;
 
		  // get the value
		  let value = row.splice(1);
		  // console.log(_row, row, value);
		  convertArrayValues(value);
 
		  // if just one value, convert it
		  if (value.length === 1) value = value[0];
 
		  // if has multiple path, convert it to array
		  if (times > 1) {
			 setVbyPathAndType(data, path, value, 'array');
		  }
 
		  // otherwise, just set the value
		  else {
			 setVbyPathAndType(data, path, value);
		  }
	   }
	}
	return data;
}
 
function convertArrayValues(array) {
	// check the array values, if is number, convert to number
	for (let i = 0; i < array.length; i++) {
	   if (!isNaN(array[i])) {
		  array[i] = Number(array[i]);
	   }
	}
}
 
function setVbyPathAndType(obj, _path, value, type) {
	if (!Array.isArray(_path) && typeof _path !== 'string') {
	   slog('error', 'The path is not a string or array.', _path);
	   return;
	}
 
	const path = typeof _path === 'string' ? _path.split('.') : _path;
	const last = path.pop();
 
	for (let i = 0; i < path.length; i++) {
	   if (!obj[path[i]]) {
		  obj[path[i]] = {};
	   }
	   obj = obj[path[i]];
	}
 
	switch (type) {
	   case 'array':
		  if (obj[last] === undefined || !Array.isArray(obj[last])) {
			 obj[last] = [];
		  }
		  obj[last].push(value);
		  break;
	   case 'object':
		  if (
			 typeof value === 'string' &&
			 value[0] === '{' &&
			 value[value.length - 1] === '}'
		  ) obj[last] = JSON.parse(value);
	   default:
		  obj[last] = value;
	}
}
 
// load excel table string
function parseTable(table) {
	// split table to lines.
	const raw = table.split('\n');
 
	// convert table to object
	const convert = function (raw, arr) {
	   const v = cleanArray(raw.split(','));
	   const keys = Object.keys(obj);
	   const newobj = {};
 
	   keys.forEach((key, i) => {
		  newobj[key] = v[i];
	   });
	   newobj.type = id;
	   arr.push(newobj);
	};
 
	// make a temporary object
	const makeObj = function (line) {
	   const keys = cleanArray(line.split(','));
	   keys[0] = keys[0].replace('#', '');
 
	   id = tablename ? tablename : `table${count}`;
	   obj = {};
	   keys.forEach(key => {
		  obj[key] = null;
	   });
	   count++;
	   tablename = '';
	};
 
	let obj;
	   var id = 'table';
	   var count = 0;
	   var tablename = '';
	const data = {};
 
	// loop the raw data
	for (let line of raw) {
	   line = line.trim();
	   // if the line is empty or comment, skip it.
	   if (
		  !line.length ||
		  line[0] === '/' && line[1] === '*' ||
		  line[0] === ';'
	   ) continue;
 
	   // if start with @, that's mean this a name of table
	   if (line[0] === '@') {
		  // some people will comment after the table name, so we need to remove it.
		  tablename = line
			 .slice(1)
			 .replace(/,$|;$/, '')
			 .replace(/;\S+$/, '')
			 .trim();
	   }
 
	   // if start with #, that's mean this a header of an object
	   else if (line[0] === '#') {
		  makeObj(line);
	   }
 
	   // otherwise, that's mean this is a value of an object
	   else {
		  if (!data[id]) data[id] = [];
		  convert(line, data[id]);
	   }
	}
 
	return data;
}
 
// load xml string
function parseXml(xml, arrayTags) {
	let dom = null;
	if (window.DOMParser) dom = new DOMParser().parseFromString(xml, 'text/xml');
	else if (window.ActiveXObject) {
		dom = new ActiveXObject('Microsoft.XMLDOM');
		dom.async = false;
		if (!dom.loadXML(xml)) {
			throw new Error(`${dom.parseError.reason} ${dom.parseError.srcText}`);
		}
	}
	else throw new Error('cannot parse xml string!');

	function parseNode(xmlNode, result) {
		if (xmlnode?.nodeName === '#text') {
			const v = xmlNode.nodeValue;
			if (v.trim()) result['#text'] = v;
			return;
		}

		if (xmlNode.nodeType === Node.CDATA_SECTION_NODE) {
			result['#cdata'] = xmlNode.nodeValue;
			return;
		}

		const jsonNode = {};
		const existing = result[xmlnode?.nodeName];

		if (existing) {
			if (!Array.isArray(existing)) result[xmlnode?.nodeName] = [existing, jsonNode];
			else result[xmlnode?.nodeName].push(jsonNode);
		}
		else {
			if (arrayTags && arrayTags.indexOf(xmlnode?.nodeName) !== -1) result[xmlnode?.nodeName] = [jsonNode];
			else result[xmlnode?.nodeName] = jsonNode;
		}

		if (xmlNode.attributes) {
			for (const attribute of xmlNode.attributes) {
				jsonNode[attribute.nodeName] = attribute.nodeValue;
			}
		}

		for (const childNode of xmlNode.childNodes) {
			parseNode(childNode, jsonNode);
		}
	}

	const result = {};
	for (const node of dom.childNodes) {
		parseNode(node, result);
	}

	return result;
}
 
function getByPath(obj, path) {
	if (!path) {
	   console.error(`[error] ${now()} | invalid path`);
	   return;
	}
 
	path = path.split('.');
 
	for (let i = 0; i < path.length; i++) {
	   if (!obj[path[i]]) {
		  slog('error', 'cannot find path: ', path.join('.'),' in object',obj);
		  return;
	   }
	   obj = obj[path[i]];
	}
 
	return obj;
}
 
function setByPath(obj, path, value) {
	if (!path) {
	   slog('error', 'invalid path');
	   return;
	}
 
	path = path.split('.');
	const last = path.pop();
 
	for (let i = 0; i < path.length; i++) {
	   if (!obj[path[i]]) {
		  obj[path[i]] = {};
	   }
	   obj = obj[path[i]];
	}
 
	obj[last] = value;
	return obj;
}
 
function defineGlobal(namespaces) {
	Object.entries(namespaces).forEach(([name, obj]) => {
	   try {
		  if (window[name] && window[name] !== obj) {
			 slog(
					'warn',
					'The global variable',
					name,
					'is already defined. Skip the definition.'
			 );
		  }
			else {
			 Object.defineProperty(window, name, {
					value    : obj,
					writable : false
			 });
		  }
	   }
		catch (e) {
		  slog('error', 'The global variable', name, 'can not be defined.', e);
	   }
	});
}
 
function globalShortcut(shortcuts) {
	Object.entries(shortcuts).forEach(([name, shortcutObject]) => {
	   try {
		  if (window[name] && window[name] !== shortcutObject) {
			 slog(
					'warn',
					'The global variable',
					name,
					'is already defined. Skip the definition.'
			 );
		  }
			else {
			 /* make a short cut getter for the object */
			 Object.defineProperty(window, name, {
					get       : () => shortcutObject,
					writeable : false
			 });
		  }
	   }
		catch (e) {
		  if (window[name] !== shortcutObject) {
			 slog(
					'error',
					'The global variable',
					name,
					'can not be defined.',
					e
			 );
		  }
	   }
	});
}
 
const now = () => new Date().toLocaleTimeString();

const slog = function (type = 'log', ...args) {
	if (!['log', 'warn', 'error'].includes(type)) {
	   args.unshift(type);
	   type = 'log';
	}
	console[type](`[${type}] ${now()} |`, ...args);
};

const dlog = function (type = 'log', ...args) {
	if (!['log', 'warn', 'error'].includes(type)) {
	   args.unshift(type);
	   type = 'log';
	}
	if (Config.debug) console[type](`[${type}] ${now()} |`, ...args);
};

 
function createPassage(title, text) {
	const element = document.createElement('tw-passagedata');
	element.innerText = text;
	const passage = new Passage(title, element);
	Story.add(passage);
	return passage;
}

function printTemplate(sourceText, ...args) {
	let txt = sourceText;

	// if no arguments, return the template text
	if (!args.length) return txt;

	// convert {0} to arg[0], {1} to arg[1], and so on.
	for (let i = 0; i < args.length; i++) {
	   txt = txt.replace(new RegExp(`\\{${i}\\}`, 'g'), args[i]);
	}

	return txt;
}

Object.defineProperties(window, {
	setByPath         : { value : setByPath },
	getByPath         : { value : getByPath },
	setVbyPathAndType : { value : setVbyPathAndType },
	defineGlobal      : { value : defineGlobal },
	globalShortcut    : { value : globalShortcut },
	loadCSV           : { value : loadCSV },
	parseXML          : { value : parseXML },
	parseTable        : { value : parseTable },
	printTemplate     : { value : printTemplate },
	createPassage     : { value : createPassage },
	now               : { value : now },
	dlog              : { value : dlog },
	slog              : { value : slog }
});
