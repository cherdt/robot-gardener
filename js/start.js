addToScore = function (n) {
    "use strict";
    var scoreboard = document.getElementById("points");
    scoreboard.textContent = parseInt(scoreboard.textContent, 10) + n;
};

log = function (str) {
    "use strict";
    var logElement = document.getElementById("log");
    logElement.innerHTML += "<br>" + str;
    logElement.scrollTop = logElement.scrollHeight;
};

// This default state can be overwritten by the URL
var state = {
    "w": "20",
    "h": "10",
    "str": "...................." +
           "...................." +
           "...................." +
           "...................." +
           "...................." +
           "...................." +
           "...................." +
           "...................." +
           "...................." +
           "...................."
};

// Is a location parameter "str" specified?
var json = parseQS();
if (json.w !== undefined && json.h !== undefined && json.str !== undefined) {
    state.w = json.w;
    state.h = json.h;
    state.str = decodeURIComponent(json.str);
}

// start
garden.create(document.getElementById("garden"), state.w, state.h, state.str);