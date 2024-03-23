(()=>{
	/*
		Returns a deep copy of the given object.

		NOTE:
			1. `clone()` does not clone functions, however, since function definitions
			   are immutable, the only issues are with expando properties and scope.
			   The former really should not be done.  The latter is problematic either
			   way—damned if you do, damned if you don't.
			2. `clone()` does not maintain referential relationships—e.g. multiple
			   references to the same object will, post-cloning, refer to different
			   equivalent objects; i.e. each reference will receive its own clone
			   of the original object.
	*/
	function clone(orig) {
		/*
			Immediately return the primitives and functions.
		*/
		if (typeof orig !== 'object' || orig === null) {
			return orig;
		}

		/*
			Unbox instances of the primitive exemplar objects.
		*/
		if (orig instanceof String) {
			return String(orig);
		}
		if (orig instanceof Number) {
			return Number(orig);
		}
		if (orig instanceof Boolean) {
			return Boolean(orig);
		}

		/*
			Honor native clone methods.
		*/
		if (typeof orig.clone === 'function') {
			return orig.clone(true);
		}
		if (orig.nodeType && typeof orig.cloneNode === 'function') {
			return orig.cloneNode(true);
		}

		/**
		 *  handle function
		 */
		if (orig instanceof Function) {
			const copy = function() {
				return orig.apply(this, arguments);
			};
			copy.prototype = orig.prototype;
			return copy;
		}

		/*
			Create a copy of the original object.

			NOTE: Each non-generic object that we wish to support must be
			explicitly handled below.
		*/
		let copy;

		// Handle instances of the core supported object types.
		if (orig instanceof Array) {
			copy = new Array(orig.length);
		}
		else if (orig instanceof Date) {
			copy = new Date(orig.getTime());
		}
		else if (orig instanceof Map) {
			copy = new Map();
			orig.forEach((val, key) => copy.set(key, clone(val)));
		}
		else if (orig instanceof RegExp) {
			copy = new RegExp(orig);
		}
		else if (orig instanceof Set) {
			copy = new Set();
			orig.forEach(val => copy.add(clone(val)));
		}

		// Handle instances of unknown or generic objects.
		else {
			// We try to ensure that the returned copy has the same prototype as
			// the original, but this will probably produce less than satisfactory
			// results on non-generics.
			copy = Object.create(Object.getPrototypeOf(orig));
		}

		/*
			Duplicate the original object's own enumerable properties, which will
			include expando properties on non-generic objects.

			NOTE: This preserves neither symbol properties nor ES5 property attributes.
			Neither does the delta coding or serialization code, however, so it's not
			really an issue at the moment.
		*/
		Object.keys(orig).forEach(name => copy[name] = clone(orig[name]));

		return copy;
	}

	/*
		Returns a random value from its given arguments.
	*/
	function either(/* variadic */) {
		if (arguments.length === 0) {
			return;
		}

		return Array.prototype.concat.apply([], arguments).random();
	}

    // return a random element from an array by rate
    function maybe(arr) {
        let txt;
        arr.forEach((v, i) => {
            if (random(100) < v[1]) txt = v[0];
        });

        if (!txt) {
            return arr[0][0];
        }
        return txt;
    }
    // swap two elements in an array
    function swap(arr, a, b) {
        const c = arr[a];
        const d = arr[b];
        arr[b] = c;
        arr[a] = d;
        return arr;
    }

    // get and set object by path
    function setPath(obj, path, value) {
        const pathArray = path.split('.');
        const last = pathArray.pop();
        for (const p of pathArray) {
            if (!obj[p]) obj[p] = {};
            obj = obj[p];
        }
        if (value) {
            obj[last] = value;
        }
        return obj[last];
    }

    function getPath(obj, path) {
        const pathArray = path.split('.');
        let res = obj;
        for (const p of pathArray) {
            if (!res[p]) return undefined;
            res = res[p];
        }
        return res;
    }
	/*
		Returns a pseudo-random whole number (integer) within the range of the given bounds.
	*/
	function random(/* [min ,] max */) {
		let min;
		let max;

		switch (arguments.length) {
		case 0:
			throw new Error('random called with insufficient parameters');
		case 1:
			min = 0;
			max = Math.trunc(arguments[0]);
			break;
		default:
			min = Math.trunc(arguments[0]);
			max = Math.trunc(arguments[1]);
			break;
		}

		if (!Number.isInteger(min)) {
			throw new Error('random min parameter must be an integer');
		}
		if (!Number.isInteger(max)) {
			throw new Error('random max parameter must be an integer');
		}

		if (min > max) {
			[min, max] = [max, min];
		}

		return Math.floor(State.random() * (max - min + 1)) + min;
	}


	/*
		Returns a pseudo-random real number (floating-point) within the range of the given bounds.

		NOTE: Unlike with its sibling function `random()`, the `max` parameter
		is exclusive, not inclusive—i.e. the range goes to, but does not include,
		the given value.
	*/
	function randomFloat(/* [min ,] max */) {
		let min;
		let max;

		switch (arguments.length) {
		case 0:
			throw new Error('randomFloat called with insufficient parameters');
		case 1:
			min = 0.0;
			max = Number(arguments[0]);
			break;
		default:
			min = Number(arguments[0]);
			max = Number(arguments[1]);
			break;
		}

		if (Number.isNaN(min) || !Number.isFinite(min)) {
			throw new Error('randomFloat min parameter must be a number');
		}
		if (Number.isNaN(max) || !Number.isFinite(max)) {
			throw new Error('randomFloat max parameter must be a number');
		}

		if (min > max) {
			[min, max] = [max, min];
		}

		return State.random() * (max - min) + min;
	}

	/**
	 * Checks if x is higher than min and lower to max
	 *
	 * @param {number} x
	 * @param {any} min
	 * @param {any} max
	 * @returns {boolean}
	 */
	function between(x, min, max) {
		return typeof x === "number" && x > min && x < max;
	}

	/**
	 * Checks if x is equal or higher than min and lower or equal to max
	 *
	 * @param {number} x
	 * @param {any} min
	 * @param {any} max
	 * @returns {boolean}
	 */
	function inrange(x, min, max) {
		return typeof x === "number" && x >= min && x <= max;
	}

    // make sure the props is valid variables (not null, undefined, empty array, empty object, empty string, NaN)

    function isValid(props) {
        const type = typeof props;
        const isArray = Array.isArray(props);

        if (props === undefined || props === null) return false;

        if (isArray || type == 'string') {
            return props.length > 0;
        }

		if (type == 'number') {
			return !isNaN(props);
		}

        if (type == 'object') {
            return JSON.stringify(props) !== '{}';
        }

        return true;
    }

    // check if the value is in the given array
    function groupmatch(value, ...table) {
        return table.includes(value);
    }

	// get key by value
    function getKeyByValue(object, value) {
        const findArray = (arr, val) => arr.find(item => typeof item.includes === 'function' && item.includes(val));
        return Object.keys(object).find(
            key =>
                object[key] === value ||
				object[key].includes(value) ||
				Array.isArray(object[key]) && (object[key].includes(value) || findArray(object[key], value))
        );
    }

    // compare two elements in an object
    function compares(key) {
        return function (m, n) {
            const a = m[key];
            const b = n[key];
            return b - a;
        };
    }

    // sum all the values in a simple object
    function sumObj(obj) {
        let sum = 0;
        for (const key in obj) {
            if (isNaN(Number(obj[key])) === false) {
                sum += Number(obj[key]);
            }
        }
		return sum;
    }

	Object.defineProperties(window, {
		clone       : { value : clone },
		either      : { value : either },
		random      : { value : random },
		randomFloat : { value : randomFloat },
		between     : { value : between },
		inrange     : { value : inrange },
		isValid     : { value : isValid },
		groupmatch  : { value : groupmatch },
        swap          : { value : swap },
        setPath       : { value : setPath },
        getPath       : { value : getPath },
        maybe         : { value : maybe },
        getKeyByValue : { value : getKeyByValue },
        compares      : { value : compares },
        sumObj        : { value : sumObj },
	});

})()