parseQS = function () {
	"use strict";
	var i, kv, key, val, json, qsArray;
    // Remove leading question mark ("?") and split into array of key/value pairs
    qsArray = location.search.slice(1).split("&");
    // Initialize object to store key/value pairs
    json = {};
    // Loop through key/value pairs and separate into keys and values
    for (i = 0; i < qsArray.length; i++) {
        kv = qsArray[i].split("=");
        key = kv[0];
        if (kv.length === 1) {
        	val = key;
        } else {
            // A key may be present without a value, so set a placeholder value
            val = kv[1];            	
        }
        json[key] = val;
    }
    return json;
};