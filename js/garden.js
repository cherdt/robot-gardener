/*jshint esversion: 6 */
/* jshint unused: false */
/* globals log, addToScore */

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
               this.description !== "wall" && 
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
    };
}

function Dirt(x, y) {
    Node.call(this, ".", "dirt", x, y);
}

function Flower(x, y) {
    Node.call(this, "<span class='flower'>f</span>", "flower", x, y);
}

function HappyFlower(x, y) {
    Node.call(this, "<span class='happyflower'>F</span>", "happy flower", x, y);
}

function Wall(x, y) {
    Node.call(this, "#", "wall", x, y);
}

function Weed(x, y) {
    Node.call(this, "<span class='weed'>w</span>", "weed", x, y);
}

var garden = {
    debug: false,
    char: "",
    node: [],
    width: 0,
    height: 0,
    points: 0,
    container: {},
    robot: new Node("<span class='robot'>@</span>","robot",0,0,0),
    flower: {}, //new Node("<span class='flower'>f</span>","flower",18,3),
    weed: {}, //new Node("<span class='weed'>w</span>","weed",19,5),
    flowerScore: 25,
    weedScore: 15,
    lastTarget: "",

    sleep: function (ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

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
            this.node[node.y][node.x] = new Dirt(node.x, node.y);
            //this.lastTarget = this.node[node.y][node.x];
            addToScore(this.weedScore);
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
            this.node[node.y][node.x] = new HappyFlower(node.x, node.y);
            addToScore(this.flowerScore);
            log("Watered flower. Look, it grew!");
            this.draw();
        } else {
            log("There's no flower here.");
        }
    },

    // Move the robot closer to the target plant, one step at a time
    /* jshint ignore:start */
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
            await this.sleep(500);
            this.node[this.robot.y][this.robot.x] = new Dirt(this.robot.x, this.robot.y)
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
    /* jshint ignore:end */

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

    generateRandomPlants: function () {
        "use strict";
        var num = Math.floor(Math.random() * 10) + 1;
        var threshhold = 0.5;
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

    create: function (gardenElement, w, h, str) {
        "use strict";
        var i = 0;
        var j = 0;
        var plant;
        var char;
        this.container = gardenElement;
        this.width = w;
        this.height = h;
        this.char = str.split("");
        console.log(str);
        for (i = 0; i < this.height; i += 1) {
            this.node.push([]);
            for (j = 0; j < this.width; j += 1) {
                char = this.char[j * this.width + i];
                if (this.robot.x === j && this.robot.y === i) {
                    this.node[i].push(this.robot);
                } else if (char === "#") {
                    this.node[i].push(new Wall(j, i));
                } else if (char === "f") {
                    this.node[i].push(new Flower(j, i));
                } else if (char === "w") {
                    this.node[i].push(new Weed(j, i));
                } else {
                    this.node[i].push(new Dirt(j, i));
                }

            }
        }

        // if no string was specified, replace dirt with random plants
        if (str.indexOf("f") === -1 && str.indexOf("w") === -1) {
            for (plant of this.generateRandomPlants()) {
                this.node[plant.y][plant.x] = plant;
            }
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
};