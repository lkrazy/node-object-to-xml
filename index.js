var sanitizer = require('sanitizer');
var map = require('dank-map');
var each = require('dank-each');
;

module.exports = function objectToXML(obj, namespace, depth, ignoreNull = true) {
	var xml = [];
	depth = depth || 0;

	each(obj, function (key, value) {
		var attributes = '';

		if (key === '@') {
			return;
		}

		if (value && (value.hasOwnProperty('@') || value.hasOwnProperty('#'))) {
			attributes = map(value['@'], function (key, value) {
				if (value && value.constructor.name == 'Date') {
					return key + '="' + fixupDate(value) + '"';
				}
				else if (value || value === 0) {
					return key + '="' + sanitizer.escape(value) + '"';
				}
			}, true).join(' ');

			if (value['#']) {
				value = value['#'];
			}
			else if (Object.keys(value).length === 1 && value.hasOwnProperty('@')) {
				//if the only property this object has is '@', then set value to null
				//so it will generate <key prop="" prop2="" />
				value = null;
			}
		}

		if (Array.isArray(value)) {
			each(value, function (ix, value) {
				var tmp = {};

				tmp[key] = value;

				xml.push(objectToXML(tmp, namespace, depth));
			});
		}
		else if (value === null || value === undefined || (typeof(value) == 'string' && value.trim() === '')) {
			if (!ignoreNull) {
				for (var x = 0; x < depth; x++) {
					xml.push('  ');
				}

				xml.push('<' + ((namespace) ? namespace + ':' : '') + key + ((attributes) ? ' ' + attributes : ''))

				//check to see if key is a ?something?
				if (/^\?.*\?$/.test(key)) {
					xml.push('>\n');
				}
				else {
					xml.push(' />\n');
				}
			}
		}
		else {
			let isNull = false;
			let openTag = '<' + ((namespace) ? namespace + ':' : '') + key + ((attributes) ? ' ' + attributes : '') + '>';
			let indent = ''
			for (var x = 0; x < depth; x++) {
				indent += '  ';
			}
			openTag = indent + openTag;

			if (!(typeof (value) == 'object')) {
				xml.push(openTag)
			}

			if (value && value.constructor.name == 'Date') {
				xml.push(fixupDate(value));
			}
			else if (typeof (value) == 'object') {
				const content = objectToXML(value, namespace, depth + 1);
				isNull = content.trim() == '';
				if (!isNull || !ignoreNull) {
					xml.push(openTag);
					xml.push('\n');
					xml.push(content);
					for (var x = 0; x < depth; x++) {
						xml.push('  ');
					}
				}


			}
			else {
				if (value && typeof(value) == 'string') {
					//avoid sanitizing CDATA sections.
					if (value.substr(0,9) !== '<![CDATA[' && value.substr(-3) !== ']]>') {
						value = sanitizer.escape(value);
					}
				}

				xml.push(value);
			}
			if (!isNull || !ignoreNull) {
				xml.push('</' + ((namespace) ? namespace + ':' : '') + key.split(/\ /)[0] + '>\n');
			}
		}
	});

	return xml.join('');
}

function fixupDate(date) {
	var newDate = new Date(date).toISOString();
	//strip off the milisecconds and the Z
	return newDate.substr(0, newDate.length -5);
}
