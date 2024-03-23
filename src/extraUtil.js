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

function clearComment(array) {
	array = array.filter(
		item => item[0] !== '/' && item[1] !== '*' || item[0] !== ';'
	);

	array = array.map(item => {
		// remove the comment after ;
		if (item.indexOf(';') !== -1) {
			item = item.split(';')[0];
		}
		return item;
	});

	return array;
}

function formatCSVValues(values) {
	return values.map(item => {
		item = item.trim();
		if (isNaN(Number(item)) === false) {
			item = Number(item);
		}
		return item;
	});
}

// load general csv table string
function parseCSV(csv) {
	let src = csv.split('\n');

	// before get the content, we need to clear the comment first
	src = clearComment(src);

	// get the header
	const header = src[0].split(',');
	const data = [];

	for (let i = 1; i < src.length; i++) {
		const obj = {};
		let values;

		if (src[i].trim() === '') continue;
		
		if (src[i].indexOf('\t') !== -1) {
			values = src[i].split('\t');
		}
		else {
			values = src[i].split(',');
		}

		values = formatCSVValues(values);

		for (let k = 0; k < header.length; k++) {
			obj[header[k]] = values[k];
		}

		data.push(obj);
	}
	return data;
}

// load list of csv string
function parseListCSV(csv) {
	let src = csv.split('\n');

	// before get the content, we need to clear the comment first
	src = clearComment(src);

	const data = {};

	for (let i = 0; i < src.length; i++) {
		// split the string
		let values;
		if (src[i].trim() === '') continue;

		// if the string contains tab, split by tab otherwise split by comma
		if (src[i].indexOf('\t') !== -1) {
			values = src[i].split('\t');
		}
		else {
			values = src[i].split(',');
		}

		values = formatCSVValues(values);

		// the first value is the key
		const key = values.shift();

		data[key] = values;
	}

	return data;
}
 
// load xml string
function parseXML(xml, arrayTags) {
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
		if (xmlNode.nodeName === '#text') {
			const v = xmlNode.nodeValue;
			if (v.trim()) result['#text'] = v;
			return;
		}

		if (xmlNode.nodeType === Node.CDATA_SECTION_NODE) {
			result['#cdata'] = xmlNode.nodeValue;
			return;
		}

		const jsonNode = {};
		const existing = result[xmlNode.nodeName];

		if (existing) {
			if (!Array.isArray(existing)) result[xmlNode.nodeName] = [existing, jsonNode];
			else result[xmlNode.nodeName].push(jsonNode);
		}
		else {
			if (arrayTags && arrayTags.indexOf(xmlNode.nodeName) !== -1) result[xmlNode.nodeName] = [jsonNode];
			else result[xmlNode.nodeName] = jsonNode;
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
	parseCSV      : { value : parseCSV },
	parseList     : { value : parseListCSV },
	parseXML      : { value : parseXML },
	printTemplate : { value : printTemplate }
});
