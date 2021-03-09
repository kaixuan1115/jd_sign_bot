'use strict';

module.exports.sendNotify = function () {
	const args = Array.prototype.slice.call(arguments, 0);
	args.unshift('sendNotify:');
	return console.log.apply(console, args);
};

