shuffleArray = function (arr) {
    "use strict";
    var i;
    var copy = [];
	var shuffled = [];

    // copy the input array
    for (i = 0; i < arr.length; i = i + 1) {
        copy[i] = arr[i];
    }

    // randomly fill the shuffled array with items from the copy
	while (copy.length > 0) {
		shuffled.push(copy.splice(Math.floor(Math.random() * copy.length),1)[0]);
	}

	return shuffled;
};