//global.lib = require('./parseqs.js');
//global.lib = require('../js/garden.js');
global.lib = require('../js/shuffle.js');

QUnit.test("vacuous test", function(assert) {
	"use strict";
	assert.equal(1, 1, "1 should equal 1")
    assert.ok(1 === 1, "1 should equal 1");
});

QUnit.test("test shuffle", function(assert) {
	"use strict";
	var arr = [1,2,3];
	assert.equal(shuffleArray(arr).length, arr.length, "Input array and shuffled array should be same length");
	assert.ok(shuffleArray(arr).indexOf(1) >= 0 &&
		      shuffleArray(arr).indexOf(2) >= 0 &&
		      shuffleArray(arr).indexOf(3) >= 0, "Input array should contain every element of the input array");
});