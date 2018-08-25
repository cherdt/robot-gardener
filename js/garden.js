/*jshint esversion: 6 */
/* jshint unused: false */
/* globals log, addToScore, shuffle */

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
        var nextStep;
        var node;
        var queuedMatrix = this.getFlagMatrix(0);
        var stepsMatrix = this.getFlagMatrix(Number.POSITIVE_INFINITY);

        // The robot's current position is 0 steps from the robot
        stepsMatrix[this.robot.y][this.robot.x] = 0;

        // Clear the cache of path predecessors from each node
        this.resetPredecessors();

        log("Finding a plant...");
        while (!isTargetAcquired && queue.length > 0) {
            currentNode = queue.shift();
            nextStep = stepsMatrix[currentNode.y][currentNode.x] + 1;

            for (node of shuffleArray(this.getAdacentNodes(currentNode))) {
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
                if (stepsMatrix[node.y][node.x] > stepsMatrix[currentNode.y][currentNode.x]) {
                    stepsMatrix[node.y][node.x] = nextStep;
                    // show the number of steps from the robot
                    if (this.debug) {
                        node.displayValue = stepsMatrix[node.y][node.x];
                    }
                    node.addImmediatePredecessor(currentNode);
                    // if this node is not already queued, add it to the queue
                    if (queuedMatrix[node.y][node.x] === 0) {
                        queuedMatrix[node.y][node.x] = 1;
                        queue.push(node);
                    }
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
            this.lastTarget = this.node[node.y][node.x];
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
            this.lastTarget = this.node[node.y][node.x];
            addToScore(this.flowerScore);
            log("Watered flower. Look, it grew!");
            this.draw();
        } else if (node.description === "happy flower") {
            log("This flower has already been watered.");
        } else {
            log("There's no flower here.");
        }
    },

    // Find path to target
    getPathToTarget: function (targetNode) {
        "use strict";
        var path = [];
        var node = targetNode;
        var predecessor;

        if (node === undefined) {
            node = this.lastTarget;
            if (node === undefined) {
                return path;
            }
        }

        while (node !== this.robot) {
            predecessor = node.getRandomPredecessor();
            path.push(predecessor);
            node = predecessor;
        }

        return path;
    },

    // Move the robot closer to the target plant, one step at a time
    /* jshint ignore:start */
    approachTarget: async function (targetNode) {
        "use strict";
        var path = this.getPathToTarget(targetNode);
        var node = targetNode;
        
        while (path.length > 0) {
            await this.sleep(500);
            // Replace current robot with dirt
            this.node[this.robot.y][this.robot.x] = new Dirt(this.robot.x, this.robot.y)
            // Get the next step in the path
            node = path.pop();
            // Place the robot on the next step
            node.displayValue = '<span class="robot">@</span>';
            node.description = "robot";
            node.stepsFromRobot = 0;
            this.robot = node;
            this.node[node.y][node.x] = this.robot;
            // Re-draw garden
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
        var node;
        this.container = gardenElement;
        this.width = w;
        this.height = h;
        this.char = str.split("");
        for (i = 0; i < this.height; i += 1) {
            this.node.push([]);
            for (j = 0; j < this.width; j += 1) {
                char = this.char[i * this.width + j];
                if (this.robot.x === j && this.robot.y === i) {
                    node = this.robot;
                } else if (char === "#") {
                    node = new Wall(j, i);
                } else if (char === "f") {
                    node = new Flower(j, i);
                } else if (char === "w") {
                    node = new Weed(j, i);
                } else {
                    node = new Dirt(j, i);
                }
                this.node[i].push(node);

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