(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CanvasDrawingEngine = void 0;
class CanvasDrawingEngine {
    constructor(context) {
        this.context = context;
        this.offsetX = 1920 / 2;
        this.offsetY = 1080 / 2;
        this.SCALE = 1;
    }
    setScale(scale) {
        this.SCALE = scale;
    }
    drawStreets(streetGraph) {
        this.context.clearRect(0, 0, 1920, 1080);
        this.context.fillStyle = "black";
        for (let edge of streetGraph.edges) {
            this.context.lineWidth = edge.width;
            this.context.beginPath();
            this.context.moveTo((edge.startNode.position.x * this.SCALE) + this.offsetX, (edge.startNode.position.y * (-1) * this.SCALE + this.offsetY));
            this.context.lineTo((edge.endNode.position.x * this.SCALE) + this.offsetX, (edge.endNode.position.y * (-1) * this.SCALE + this.offsetY));
            this.context.stroke();
        }
        this.context.fillStyle = "red";
        for (let newPoint of streetGraph.newPoints) {
            this.context.fillRect(newPoint.x * this.SCALE + this.offsetX, newPoint.y * (-1) * this.SCALE + this.offsetY, 5, 5);
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
    scanAround(scanPosition) {
        for (let node of this.streetGraph.nodes) {
            if (node.position.distance(scanPosition) < this.configuration.nodeCricusScanningR) {
                return node;
            }
        }
        return null;
    }
    generateNewStreet(direction, strategy, startNode) {
        const [newNodePosition, futureIntersectionScanPosition] = new NormalStreetsPattern_1.NormalStreetsPattern().getNewNodeLocation(direction, startNode, this.configuration);
        const newNode = new StreetGraph_1.StreetNode(this.streetGraph.nodes.length, newNodePosition, StreetGraph_1.Hierarchy.Major);
        const newStreet = new StreetGraph_1.StreetEdge(startNode, newNode, StreetGraph_1.Hierarchy.Major, 1, StreetGraph_1.StreetStatus.Build);
        // check for intersection or future intersection
        let closestInetrsectionPoint = null;
        let intersectionStreet = null;
        for (let edge of this.streetGraph.edges) {
            if (edge.startNode.id != startNode.id && edge.endNode.id != startNode.id) {
                const intersectionPoint = (0, utils_1.calculateIntersection)(edge.startNode.position, edge.endNode.position, newStreet.startNode.position, futureIntersectionScanPosition);
                if (intersectionPoint) {
                    if (closestInetrsectionPoint && closestInetrsectionPoint.distance(newStreet.startNode.position) <= intersectionPoint.distance(newStreet.startNode.position)) {
                        continue;
                    }
                    intersectionStreet = edge;
                    closestInetrsectionPoint = intersectionPoint;
                }
            }
        }
        if (closestInetrsectionPoint && intersectionStreet) {
            // if intersection is close ot existing point we do not need cut edge
            const nodeInCircle = this.scanAround(closestInetrsectionPoint);
            if (nodeInCircle) {
                newStreet.endNode = nodeInCircle;
                return {
                    newStreets: [newStreet],
                    streetsToRemove: []
                };
            }
            // cut graph
            newNode.setPosition(closestInetrsectionPoint);
            // they should inherit all proeprties
            const part1Street = new StreetGraph_1.StreetEdge(intersectionStreet.startNode, newNode, intersectionStreet.hierarchy, 3, intersectionStreet.status);
            const part2Street = new StreetGraph_1.StreetEdge(intersectionStreet.endNode, newNode, intersectionStreet.hierarchy, 3, intersectionStreet.status);
            const newStreet2 = new StreetGraph_1.StreetEdge(startNode, newNode, StreetGraph_1.Hierarchy.Major, 3, StreetGraph_1.StreetStatus.Build);
            return {
                newStreets: [part1Street, part2Street, newStreet2],
                streetsToRemove: [intersectionStreet]
            };
        }
        // check for existing nodes in circle
        const nodeInCircle = this.scanAround(newNode.position);
        if (nodeInCircle) {
            newStreet.endNode = nodeInCircle;
            return {
                newStreets: [newStreet],
                streetsToRemove: []
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
        console.log("nothing generated");
        return {
            newStreets: [],
            streetsToRemove: []
        };
    }
    getSearchedValence() {
        const valenceDistributon = this.streetGraph.getValenceDistribution();
        const allNodes = this.streetGraph.nodes.length;
        // check distribution again (for 4 valance nodes)
        // console.log(this.configuration.valenceRatio, Object.entries(valenceDistributon).sort(([key, _v], [key2, _v2]) => Number(key) - Number(key2)).map(([_key, v]) => v / allNodes));
        if (valenceDistributon['2'] / allNodes < this.configuration.valenceRatio[0])
            return 1;
        if (valenceDistributon['3'] / allNodes < this.configuration.valenceRatio[1])
            return 2;
        return 3;
    }
    next() {
        this.currentTime += 1;
        const searchedValence = this.getSearchedValence();
        const growthCandidates = this.streetGraph.nodes.filter(node => node.isGrowthing && this.streetGraph.getNodeValence(node) == searchedValence);
        const candidatesProbabilites = growthCandidates.map(candidate => this.calucateGrowthCandidateProbablity(candidate));
        const normalizedCandidatesProbabilities = this.normalizeNumbers(candidatesProbabilites);
        const randomNodeIndex = this.randomlySelectElementFromProbabilityDistribution(normalizedCandidatesProbabilities);
        const randomNode = growthCandidates[randomNodeIndex];
        const expansionResult = this.expandNode(randomNode);
        this.streetGraph.clearNewPoints();
        for (let newStreet of expansionResult.newStreets) {
            this.streetGraph.addStreet(newStreet); // check it twice
            this.streetGraph.addNewPoint(newStreet.endNode.position);
            this.streetGraph.addNewPoint(newStreet.startNode.position);
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
const utils_1 = require("../utils");
class NormalStreetsPattern {
    getNewNodeLocation(direction, startNode, configuration) {
        const newLength = (0, utils_1.gaussianRandom)(0.16, 0.5, 0, 1) * configuration.streetsLength + configuration.streetsLength;
        const newAngle = (0, utils_1.gaussianRandom)(0.16, 0, -0.5, 0.5) * configuration.generationAngle;
        const newNodePosition = startNode.position.vectorAdd(direction.rotate(newAngle).scalarMultiply(newLength));
        const scanFuturePosition = startNode.position.vectorAdd(direction.rotate(newAngle).scalarMultiply(newLength * configuration.futureIntersectionScanFactor));
        return [newNodePosition, scanFuturePosition];
    }
}
exports.NormalStreetsPattern = NormalStreetsPattern;

},{"../utils":4}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateIntersection = exports.gaussianRandom = void 0;
const StreetGraph_1 = require("../types/StreetGraph");
// Standard Normal variate using Box-Muller transform.
const gaussianRandom = (stdev = 1, mean = 0, min = -5, max = 5) => {
    const u = 1 - Math.random(); // Converting [0,1) to (0,1]
    const v = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    // Transform to the desired mean and standard deviation:
    const result = z * stdev + mean;
    if (result < min || result > max)
        return (0, exports.gaussianRandom)(mean, stdev, min, max);
    return result;
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
    let SCALE = 1;
    let currentStreetGraph = null;
    if (!ctx)
        return;
    const canvansDrawingEngine = new CanvasDrawingEngine_1.CanvasDrawingEngine(ctx);
    const cityGenerator = new CityGenerator_1.CityGenerator(simulationConfiguration_1.default);
    const nextTick = () => {
        const { value: streetGraph, done } = cityGenerator.next();
        currentStreetGraph = streetGraph;
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
    const zoomIn = document.getElementById('zoomIn');
    const zoomOut = document.getElementById('zoomOut');
    zoomIn === null || zoomIn === void 0 ? void 0 : zoomIn.addEventListener("click", () => {
        SCALE *= 1.5;
        canvansDrawingEngine.setScale(SCALE);
        canvansDrawingEngine.drawStreets(currentStreetGraph);
    });
    zoomOut === null || zoomOut === void 0 ? void 0 : zoomOut.addEventListener("click", () => {
        SCALE /= 1.5;
        canvansDrawingEngine.setScale(SCALE);
        canvansDrawingEngine.drawStreets(currentStreetGraph);
    });
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
    // initial parameters
    initialStreetGraph: initialStreetGraph,
    cityCenterPoint: new StreetGraph_1.Point(400, 400),
    // simulation
    numberOfYears: 10000000,
    timeStep: 1,
    // new nodes generation
    generationAngle: Math.PI / 2.5,
    streetsLength: 20,
    futureIntersectionScanFactor: 1.5, // length for node to check future interseciton
    nodeCricusScanningR: 7,
    // streets
    valenceRatio: [0.8, 0.1, 0.1],
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
        this.newPoints = [];
        this.graph = {};
        this.valence2edges = 0;
        this.valence3edges = 0;
        this.valence4edges = 0;
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
    addNewPoint(point) {
        this.newPoints.push(point);
    }
    clearNewPoints() {
        this.newPoints = [];
    }
    getValenceDistribution() {
        const valenceDistributon = {
            '1': 0,
            '2': 0,
            '3': 0,
            '4': 0
        };
        for (const node of this.nodes) {
            const valence = this.getNodeValence(node);
            if (!valenceDistributon[valence]) {
                valenceDistributon[valence] = 0;
            }
            valenceDistributon[valence] += 1;
        }
        return valenceDistributon;
    }
}
exports.StreetGraph = StreetGraph;

},{}]},{},[5]);
