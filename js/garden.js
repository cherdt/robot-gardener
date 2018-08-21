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
        val;
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

sleep = function (ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
};

log = function (str) {
	"use strict";
    var logElement = document.getElementById("log");
	logElement.innerHTML += "<br>" + str;
    logElement.scrollTop = logElement.scrollHeight;
};

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

function Node (displayValue, description, x, y, stepsFromRobot) {
	"use strict";
	this.displayValue = displayValue;
	this.description = description;
	this.x = x;
	this.y = y;
	this.adjacentNodes = [];
	this.immediatePredecessors = [];
	if (stepsFromRobot === undefined) {
    	this.stepsFromRobot = Number.POSITIVE_INFINITY;
	} else {
		this.stepsFromRobot = stepsFromRobot;
	}
	this.isTarget = function () {
		return this.description !== "dirt" && 
               this.description !== "happy flower" && 
               this.stepsFromRobot !== 0;
	};
    this.isBlocked = function () {
        return this.description === "wall" || 
               this.description === "happy flower" || 
               this.stepsFromRobot === 0;
    };
	this.addImmediatePredecessor = function (node) {
		if (!this.immediatePredecessors.includes(node)) {
    		this.immediatePredecessors.push(node);
		}
	};
	this.resetImmediatePredecessors = function () {
		this.immediatePredecessors = [];
	};
	this.getRandomPredecessor = function () {
		var randomPredecessor = Math.floor(Math.random() * this.immediatePredecessors.length);
		return this.immediatePredecessors[randomPredecessor];
	}
	this.getAdacentNodes = function () {

		return [];
	}
};

function Flower(x, y) {
    Node.call(this, "<span class='flower'>f</span>", "flower", x, y);
};

function Weed(x, y) {
    Node.call(this, "<span class='weed'>w</span>", "weed", x, y);
};

var garden = {
	debug: false,
	char: "",
	node: [],
	width: 0,
	height: 0,
	points: 0,
	container: document.getElementById("garden"),
	robot: new Node("<span class='robot'>@</span>","robot",0,0,0),
	flower: {}, //new Node("<span class='flower'>f</span>","flower",18,3),
	weed: {}, //new Node("<span class='weed'>w</span>","weed",19,5),
	lastTarget: "",

    // returns a matrix of zeroes
	getFlagMatrix: function (initialVal) {
		"use strict";
		var matrix = [];
		var i, j;

		for (i = 0; i < this.height; i = i + 1) {
			matrix.push([]);
    		for (j = 0; j < this.width; j = j + 1) {
                matrix[i].push(initialVal);
    		}
		}

		return matrix;
	},

    getDirtNode: function (x, y) {
    	"use strict";
    	return new Node(".","dirt",x,y);
    },

    getHappyFlowerNode: function (x, y) {
    	"use strict";
    	return new Node("<span class='happyflower'>F</span>","happy flower",x,y);
    },

    getWeedNode: function (x, y) {
    	"use strict";
    	return new Weed(x, y);
    },

    // I dislike this function, it suggests the design is seriously flawed?
    resetSteps: function () {
    	"use strict";
    	var i, j;
    	for (i = 0; i < this.height; i++) {
    		for (j = 0; j < this.width; j++) {
    			if (this.node[i][j].description === "robot") {
    				this.node[i][j].stepsFromRobot = 0;
    			} else {
        			this.node[i][j].stepsFromRobot = Number.POSITIVE_INFINITY;
    			}
    		}
    	}
    },

    // clear list of immediate predecessors from all nodes
    resetPredecessors: function () {
    	"use strict";
    	var i, j;
    	for (i = 0; i < this.height; i++) {
    		for (j = 0; j < this.width; j++) {
    			this.node[i][j].resetImmediatePredecessors();
    		}
    	}
    },

    // Find the next closest target plant
	acquireTarget: function () {
        "use strict";
        var isTargetAcquired = false;
        var targetNode;
        var queue = [this.robot];
        var currentNode;
        var node;
        var queuedMatrix = this.getFlagMatrix(0);
        var stepsMatrix = this.getFlagMatrix(Number.POSITIVE_INFINITY);

        //this.resetSteps();
        stepsMatrix[this.robot.y][this.robot.x] = 0;

        this.resetPredecessors();

        log("Finding a plant...");
        while (!isTargetAcquired && queue.length > 0) {
            currentNode = queue.shift();
            for (node of this.getAdacentNodes(currentNode)) {
            	if (node.isTarget()) {
            		node.addImmediatePredecessor(currentNode);
            		log("Plant found: " + node.description + " at " + node.x + "," + node.y);
            		targetNode = node;
            		isTargetAcquired = true;
            		break;
            	}
                if (node.isBlocked()) {
                    continue;
                }
            	if (stepsMatrix[node.y][node.x] > stepsMatrix[currentNode.y][currentNode.x] && queuedMatrix[node.y][node.x] === 0) {
            		stepsMatrix[node.y][node.x] = stepsMatrix[currentNode.y][currentNode.x] + 1;
            		// show the number of steps from the robot
            		if (this.debug) {
            			node.displayValue = stepsMatrix[node.y][node.x];
            		}
            		node.addImmediatePredecessor(currentNode);
            		queuedMatrix[node.y][node.x] = 1;
            		queue.push(node);
            	}
            }
        }

        if (!isTargetAcquired) {
        	log("There are currently no plants that need attention.");
        	log("You win!");
        }

        this.lastTarget = targetNode;
        return targetNode;
	},

    removeWeed: function (targetNode) {
    	"use strict";
    	var node = targetNode;

    	if (node === undefined) {
    		node = this.lastTarget;
    	}

    	if (node.description === "weed") {
    		this.node[node.y][node.x] = this.getDirtNode(node.x, node.y);
    		//this.lastTarget = this.node[node.y][node.x];
    		this.addToScore(15);
    		log("Weed exterminated!");
    		this.draw();
    	} else {
    		log("There's no weed here.");
    	}
    },

    waterFlower: function (targetNode) {
    	"use strict";
    	var node = targetNode;

    	if (node === undefined) {
    		node = this.lastTarget;
    	}

    	if (node.description === "flower") {
    		this.node[node.y][node.x] = this.getHappyFlowerNode(node.x, node.y);
    		this.addToScore(25);
    		log("Watered flower. Look, it grew!");
    		this.draw();
    	} else {
    		log("There's no flower here.");
    	}
    },

    // Move the robot closer to the target plant, one step at a time
    approachTarget: async function (targetNode) {
    	"use strict";
    	var path = [];
    	var node = targetNode;
    	var predecessor;
    	
    	if (node === undefined) {
    		node = this.lastTarget;
    		if (node === undefined) {
    			return;
    		}
    	}

    	while (node !== this.robot) {
    		predecessor = node.getRandomPredecessor();
    		path.push(predecessor);
    		node = predecessor;
    	}
        
        while (path.length > 0) {
        	await sleep(500);
        	this.node[this.robot.y][this.robot.x] = this.getDirtNode(this.robot.x, this.robot.y)
        	node = path.pop();
        	node.displayValue = '<span class="robot">@</span>';
        	node.description = "robot";
        	node.stepsFromRobot = 0;
        	this.robot = node;
        	this.node[node.y][node.x] = this.robot;
        	this.draw();
        }

        log("Arrived at target plant");

    },

    getAdacentNodes: function (node) {
        "use strict";
        var adjacentNodes = [];
        // we need to check 8 directions: NW, N, NE, W, E, SW, S, SE
        // up
        if (node.y - 1 >= 0) {
        	// left
            if (node.x - 1 >= 0) {
            	adjacentNodes.push(this.node[node.y - 1][node.x - 1]);
            }
        	// center
			adjacentNodes.push(this.node[node.y - 1][node.x]);
        	// right
        	if (node.x + 1 < this.width) {
            adjacentNodes.push(this.node[node.y - 1][node.x + 1]);
            }
        }
        // left
        if (node.x - 1 >= 0) {
        	adjacentNodes.push(this.node[node.y][node.x - 1]);
        }
        // right
        if (node.x + 1 < this.width) {
        	adjacentNodes.push(this.node[node.y][node.x + 1]);
        }
        // down
        if (node.y + 1 < this.height) {
        	// left
            if (node.x - 1 >= 0) {
            	adjacentNodes.push(this.node[node.y + 1][node.x - 1]);
            }
        	// center
			adjacentNodes.push(this.node[node.y + 1][node.x]);
        	// right
        	if (node.x + 1 < this.width) {
                adjacentNodes.push(this.node[node.y + 1][node.x + 1]);
            }
        }
        return adjacentNodes;
    },

    addToScore: function (n) {
    	"use strict";
    	document.getElementById("points").textContent = parseInt(document.getElementById("points").textContent, 10) + n;
    },

    generateRandomPlants: function () {
    	"use strict";
    	var num = Math.floor(Math.random() * 10) + 1;
    	var threshhold = .5;
    	var pct;
    	var i;
    	var x;
    	var y;
    	var plants = [];

    	for (i = 0; i <= num; i = i + 1) {
    		pct = Math.random();
    		x = Math.floor(Math.random() * (this.width - 1)) + 1;
    		y = Math.floor(Math.random() * (this.height - 1)) + 1;
    		if (pct > threshhold) {
    			plants.push(new Flower(x, y));
    		} else {
    			plants.push(new Weed(x, y));
    		}
    	}

    	return plants;
    },


    create: function (w, h, str) {
		"use strict";
		var content = "";
	    var i = 0;
	    var j = 0;
	    var plant;
	    this.width = w;
	    this.height = h;
	    this.char = str.split("");
	    for (i = 0; i < this.height; i += 1) {
	    	this.node.push([]);
	    	for (j = 0; j < this.width; j += 1) {
	    		if (this.robot.x === j && this.robot.y === i) {
	    			this.node[i].push(this.robot);
	    		} else if (this.flower.x === j && this.flower.y === i) {
	    			this.node[i].push(this.flower);
	    		} else if (this.weed.x === j && this.weed.y === i) {
	    			this.node[i].push(this.weed);
	    		} else {
	    			this.node[i].push(new Node(".", "dirt", j, i));
	    		}

	    	}
	    }

        // replace dirt with random plants
	    for (plant of this.generateRandomPlants()) {
	    	this.node[plant.y][plant.x] = plant;
	    }

	    this.draw();
	},

	draw: function () {
		"use strict";
		var content = "";
	    var i = 0;
	    var j = 0;
	    for (i = 0; i < this.height; i += 1) {
	    	for (j = 0; j < this.width; j += 1) {
	    		content += this.node[i][j].displayValue;
	    	}
	    	content += "<br>";
	    }
	    this.container.innerHTML = content;
	}
}

garden.create(state.w, state.h, state.str);