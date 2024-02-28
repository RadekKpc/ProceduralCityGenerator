(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CanvasDrawingEngine = void 0;
class CanvasDrawingEngine {
    constructor(context) {
        this.context = context;
        this.offsetX = 1920 / 2;
        this.offsetY = 1080 / 2;
    }
    drawStreets(streetGraph) {
        this.context.clearRect(0, 0, 1920, 1080);
        for (let edge of streetGraph.edges) {
            this.context.lineWidth = edge.width;
            this.context.beginPath();
            this.context.moveTo(edge.startNode.position.x + this.offsetX, edge.startNode.position.y * (-1) + this.offsetY);
            this.context.lineTo(edge.endNode.position.x + this.offsetX, edge.endNode.position.y * (-1) + this.offsetY);
            this.context.stroke();
        }
    }
}
exports.CanvasDrawingEngine = CanvasDrawingEngine;

},{}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CityGenerator = void 0;
const StreetGraph_1 = require("../types/StreetGraph");
const NormalStreetsPattern_1 = require("./cityStyles/NormalStreetsPattern");
const utils_1 = require("./utils");
class CityGenerator {
    constructor(configuration) {
        this.configuration = configuration;
        this.numberOfStreets = 0;
        this.streetGraph = configuration.initialStreetGraph;
        this.currentTime = 0;
    }
    calucateGrowthCandidateProbablity(node) {
        // console.log(node.position.distance(this.configuration.cityCenterPoint), this.streetGraph.getNodeValence(node), this.configuration.valenceRatio[this.streetGraph.getNodeValence(node) - 1])
        return node.position.distance(this.configuration.cityCenterPoint) * this.configuration.valenceRatio[this.streetGraph.getNodeValence(node) - 1];
    }
    normalizeNumbers(numbers) {
        const sum = numbers.reduce((a, b) => a + b, 0);
        return numbers.map(n => n / sum);
    }
    randomlySelectElementFromProbabilityDistribution(distribution) {
        for (let i = 1; i < distribution.length; i++) {
            distribution[i] += distribution[i - 1];
        }
        const randomNumber = Math.random();
        return distribution.findIndex(e => e >= randomNumber);
    }
    generateNewStreet(direction, strategy, startNode) {
        const newNodePosition = new NormalStreetsPattern_1.NormalStreetsPattern().getNewNodeLocation(direction, startNode, this.configuration);
        const newNode = new StreetGraph_1.StreetNode(this.streetGraph.nodes.length, newNodePosition, StreetGraph_1.Hierarchy.Major);
        const newStreet = new StreetGraph_1.StreetEdge(startNode, newNode, StreetGraph_1.Hierarchy.Major, 1, StreetGraph_1.StreetStatus.Build);
        // check for intersection
        let closestInetrsectionPoint = null;
        let intersectionStreet = null;
        for (let edge of this.streetGraph.edges) {
            if (edge.startNode.id != startNode.id && edge.endNode.id != startNode.id) {
                const intersectionPoint = (0, utils_1.calculateIntersection)(edge.startNode.position, edge.endNode.position, newStreet.startNode.position, newStreet.endNode.position);
                if (intersectionPoint) {
                    if (closestInetrsectionPoint && closestInetrsectionPoint.distance(edge.startNode.position) <= intersectionPoint.distance(edge.startNode.position)) {
                        continue;
                    }
                    intersectionStreet = edge;
                    closestInetrsectionPoint = intersectionPoint;
                    console.log(intersectionPoint, edge.startNode.position, edge.endNode.position, newStreet.startNode.position, newStreet.endNode.position);
                }
            }
        }
        // cut graph
        if (closestInetrsectionPoint && intersectionStreet) {
            newNode.setPosition(closestInetrsectionPoint);
            // they should inherit all proeprties
            const part1Street = new StreetGraph_1.StreetEdge(intersectionStreet.startNode, newNode, intersectionStreet.hierarchy, 3, intersectionStreet.status);
            const part2Street = new StreetGraph_1.StreetEdge(intersectionStreet.endNode, newNode, intersectionStreet.hierarchy, 3, intersectionStreet.status);
            const newStreet = new StreetGraph_1.StreetEdge(startNode, newNode, StreetGraph_1.Hierarchy.Major, 3, StreetGraph_1.StreetStatus.Build);
            return {
                newStreets: [part1Street, part2Street, newStreet],
                streetsToRemove: [intersectionStreet]
            };
        }
        return {
            newStreets: [newStreet],
            streetsToRemove: []
        };
    }
    expandNode(node) {
        const nodeValence = this.streetGraph.getNodeValence(node);
        if (nodeValence == 1) {
            node.hasFront = true;
            return this.generateNewStreet(node.direction, null, node);
        }
        if (nodeValence == 2) {
            if (Math.random() < 0.5) {
                node.hasLeft = true;
                return this.generateNewStreet(node.leftDirection, null, node);
            }
            else {
                node.hasRight = true;
                return this.generateNewStreet(node.rightDirection, null, node);
            }
        }
        if (nodeValence == 3) {
            node.isGrowthing = false;
            if (node.hasLeft) {
                node.hasRight = true;
                return this.generateNewStreet(node.rightDirection, null, node);
            }
            node.hasLeft = true;
            return this.generateNewStreet(node.leftDirection, null, node);
        }
        console.log("nothing gerated");
        return {
            newStreets: [],
            streetsToRemove: []
        };
    }
    next() {
        this.currentTime += 1;
        const growthCandidates = this.streetGraph.nodes.filter(node => node.isGrowthing);
        const candidatesProbabilites = growthCandidates.map(candidate => this.calucateGrowthCandidateProbablity(candidate));
        const normalizedCandidatesProbabilities = this.normalizeNumbers(candidatesProbabilites);
        const randomNodeIndex = this.randomlySelectElementFromProbabilityDistribution(normalizedCandidatesProbabilities);
        const randomNode = growthCandidates[randomNodeIndex];
        console.log(this.streetGraph.edges);
        const expansionResult = this.expandNode(randomNode);
        for (let newStreet of expansionResult.newStreets) {
            this.streetGraph.addStreet(newStreet); // check it twice
        }
        for (let streetToRemove of expansionResult.streetsToRemove) {
            this.streetGraph.removeStreet(streetToRemove); // check it twice
        }
        return {
            done: this.currentTime == this.configuration.numberOfYears,
            value: this.streetGraph
        };
    }
}
exports.CityGenerator = CityGenerator;

},{"../types/StreetGraph":7,"./cityStyles/NormalStreetsPattern":3,"./utils":4}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NormalStreetsPattern = void 0;
class NormalStreetsPattern {
    getNewNodeLocation(direction, startNode, configuration) {
        const newLength = Math.random() * configuration.streetsLength + configuration.streetsLength;
        const newAngle = (Math.random() - 0.5) * configuration.generationAngle;
        const newNodePosition = startNode.position.vectorAdd(direction.rotate(newAngle).scalarMultiply(newLength));
        return newNodePosition;
    }
}
exports.NormalStreetsPattern = NormalStreetsPattern;

},{}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateIntersection = exports.gaussianRandom = void 0;
const StreetGraph_1 = require("../types/StreetGraph");
// Standard Normal variate using Box-Muller transform.
const gaussianRandom = (mean = 0, stdev = 1) => {
    const u = 1 - Math.random(); // Converting [0,1) to (0,1]
    const v = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    // Transform to the desired mean and standard deviation:
    return z * stdev + mean;
};
exports.gaussianRandom = gaussianRandom;
const calculateIntersection = (p1, p2, p3, p4) => {
    const d1 = (p1.x - p2.x) * (p3.y - p4.y); // (x1 - x2) * (y3 - y4)
    const d2 = (p1.y - p2.y) * (p3.x - p4.x); // (y1 - y2) * (x3 - x4)
    const d = d1 - d2;
    if (d == 0) {
        return null;
    }
    const u1 = (p1.x * p2.y - p1.y * p2.x); // (x1 * y2 - y1 * x2)
    const u4 = (p3.x * p4.y - p3.y * p4.x); // (x3 * y4 - y3 * x4)
    const u2x = p3.x - p4.x; // (x3 - x4)
    const u3x = p1.x - p2.x; // (x1 - x2)
    const u2y = p3.y - p4.y; // (y3 - y4)
    const u3y = p1.y - p2.y; // (y1 - y2)
    const px = (u1 * u2x - u3x * u4) / d;
    const py = (u1 * u2y - u3y * u4) / d;
    // check if streets are crossing
    if (!(Math.min(p1.x, p2.x) <= px && px <= Math.max(p1.x, p2.x) &&
        Math.min(p3.x, p4.x) <= px && px <= Math.max(p3.x, p4.x) &&
        Math.min(p1.y, p2.y) <= py && py <= Math.max(p1.y, p2.y) &&
        Math.min(p3.y, p4.y) <= py && py <= Math.max(p3.y, p4.y)))
        return null;
    return new StreetGraph_1.Point(px, py);
};
exports.calculateIntersection = calculateIntersection;

},{"../types/StreetGraph":7}],5:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const CanvasDrawingEngine_1 = require("./drawingEngine/CanvasDrawingEngine");
const CityGenerator_1 = require("./generator/CityGenerator");
const simulationConfiguration_1 = __importDefault(require("./simulationConfiguration"));
const init = () => {
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx)
        return;
    const canvansDrawingEngine = new CanvasDrawingEngine_1.CanvasDrawingEngine(ctx);
    const cityGenerator = new CityGenerator_1.CityGenerator(simulationConfiguration_1.default);
    const nextTick = () => {
        const { value: streetGraph, done } = cityGenerator.next();
        if (done) {
            alert('Generation done!');
            return;
        }
        canvansDrawingEngine.drawStreets(streetGraph);
    };
    const nextTickButton = document.getElementById("nextTickButton");
    if (nextTickButton) {
        nextTickButton.onclick = nextTick;
    }
    const interval = setInterval(nextTick, 0);
    const stopButton = document.getElementById("stop");
    if (stopButton) {
        stopButton.onclick = () => clearInterval(interval);
    }
    canvansDrawingEngine.drawStreets(cityGenerator.streetGraph);
};
init();

},{"./drawingEngine/CanvasDrawingEngine":1,"./generator/CityGenerator":2,"./simulationConfiguration":6}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const StreetGraph_1 = require("./types/StreetGraph");
const initialStreetGraph = new StreetGraph_1.StreetGraph();
const StreetNode1 = new StreetGraph_1.StreetNode(0, new StreetGraph_1.Point(0, 0), StreetGraph_1.Hierarchy.Major);
const StreetNode2 = new StreetGraph_1.StreetNode(1, new StreetGraph_1.Point(50, 0), StreetGraph_1.Hierarchy.Major);
const street1 = new StreetGraph_1.StreetEdge(StreetNode1, StreetNode2, StreetGraph_1.Hierarchy.Major, 1, StreetGraph_1.StreetStatus.Build);
initialStreetGraph.addStreet(street1);
const SimulationConfiguration = {
    initialStreetGraph: initialStreetGraph,
    cityCenterPoint: new StreetGraph_1.Point(400, 400),
    numberOfYears: 10000000,
    timeStep: 1,
    valenceRatio: [0.1, 0.6, 0.1, 0.3],
    streetsLength: 30,
    generationAngle: Math.PI / 3
};
exports.default = SimulationConfiguration;

},{"./types/StreetGraph":7}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreetGraph = exports.StreetEdge = exports.StreetNode = exports.Point = exports.StreetStatus = exports.Hierarchy = void 0;
var Hierarchy;
(function (Hierarchy) {
    Hierarchy[Hierarchy["Minor"] = 0] = "Minor";
    Hierarchy[Hierarchy["Major"] = 1] = "Major";
})(Hierarchy || (exports.Hierarchy = Hierarchy = {}));
var StreetStatus;
(function (StreetStatus) {
    StreetStatus[StreetStatus["Build"] = 0] = "Build";
    StreetStatus[StreetStatus["Planned"] = 1] = "Planned";
})(StreetStatus || (exports.StreetStatus = StreetStatus = {}));
class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    distance(a) {
        return Math.sqrt(Math.pow(this.x - a.x, 2) + Math.pow(this.y - a.y, 2));
    }
    normalize() {
        const vectorLength = Math.sqrt(this.x * this.x + this.y * this.y);
        this.x = this.x / vectorLength;
        this.y = this.y / vectorLength;
    }
    vectorMultiply(vector) {
        return new Point(this.x * vector.x, this.y * vector.y);
    }
    vectorAdd(vector) {
        return new Point(this.x + vector.x, this.y + vector.y);
    }
    scalarMultiply(a) {
        return new Point(this.x * a, this.y * a);
    }
    turnLeft() {
        return new Point(this.y * (-1), this.x);
    }
    turnRight() {
        return new Point(this.y, this.x * (-1));
    }
    rotate(angleInRadian) {
        const x2 = Math.cos(angleInRadian) * this.x - Math.sin(angleInRadian) * this.y;
        const y2 = Math.sin(angleInRadian) * this.x + Math.cos(angleInRadian) * this.y;
        return new Point(x2, y2);
    }
}
exports.Point = Point;
class StreetNode {
    constructor(id, position, hierarchy) {
        this.id = id;
        this.position = position;
        this.hierarchy = hierarchy;
        this.isGrowthing = true;
        this.traffic = 0;
        this.hasFront = false;
        this.hasRight = false;
        this.hasLeft = false;
        this.direction = new Point(0, 0);
        this.leftDirection = new Point(0, 0);
        this.rightDirection = new Point(0, 0);
    }
    setTraffic(traffic) {
        this.traffic = traffic;
    }
    setDirection(directionVector) {
        this.direction = directionVector;
        this.direction.normalize();
        this.leftDirection = this.direction.turnLeft();
        this.rightDirection = this.direction.turnRight();
    }
    setPosition(newPosition) {
        this.position = newPosition;
    }
}
exports.StreetNode = StreetNode;
class StreetEdge {
    constructor(startNode, endNode, hierarchy, width, status) {
        this.startNode = startNode;
        this.endNode = endNode;
        this.hierarchy = hierarchy;
        this.width = width;
        this.status = status;
    }
}
exports.StreetEdge = StreetEdge;
class StreetGraph {
    constructor() {
        this.edges = [];
        this.nodes = [];
        this.graph = {};
    }
    addStreet(street) {
        const startNodeId = street.startNode.id;
        const endNodeId = street.endNode.id;
        if (!this.graph[startNodeId]) {
            this.nodes.push(street.startNode);
            this.graph[startNodeId] = {};
            const nodeDirection = new Point(street.startNode.position.x - street.endNode.position.x, street.startNode.position.y - street.endNode.position.y);
            street.startNode.setDirection(nodeDirection);
        }
        if (!this.graph[endNodeId]) {
            this.graph[endNodeId] = {};
            this.nodes.push(street.endNode);
            const nodeDirection = new Point(street.endNode.position.x - street.startNode.position.x, street.endNode.position.y - street.startNode.position.y);
            street.endNode.setDirection(nodeDirection);
        }
        this.graph[startNodeId][endNodeId] = street;
        this.graph[endNodeId][startNodeId] = street;
        this.edges.push(street);
    }
    removeStreet(street) {
        const startNodeId = street.startNode.id;
        const endNodeId = street.endNode.id;
        delete this.graph[startNodeId][endNodeId];
        delete this.graph[endNodeId][startNodeId];
        const index = this.edges.indexOf(street);
        if (index > -1) {
            this.edges.splice(index, 1);
        }
    }
    getNodeValence(node) {
        if (!this.graph[node.id])
            throw new Error('Node do not belongs to street graph');
        return Object.values(this.graph[node.id]).length;
    }
}
exports.StreetGraph = StreetGraph;

},{}]},{},[5]);
