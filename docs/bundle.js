(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CanvasDrawingEngine = void 0;
class CanvasDrawingEngine {
    constructor(context, simulationCofiguration) {
        this.context = context;
        this.offsetX = 1920 / 2;
        this.offsetY = 1080 / 2;
        this.scale = 1;
        this.userOffsetX = 0;
        this.userOffsetY = 0;
        this.tmpUserOffsetX = 0;
        this.tmpUserOffsetY = 0;
        this.simulationCofiguration = simulationCofiguration;
    }
    setScale(scale) {
        this.scale = scale;
    }
    addUserOffsetX(offset) {
        this.userOffsetX += offset;
    }
    addUserOffsetY(offset) {
        this.userOffsetY += offset;
    }
    setTmpUserOffsetX(offset) {
        this.tmpUserOffsetX = offset;
    }
    setTmpUserOffsetY(offset) {
        this.tmpUserOffsetY = offset;
    }
    getX(position) {
        return (position * this.scale) + this.offsetX + this.userOffsetX + this.tmpUserOffsetX;
    }
    getY(position) {
        return (position * (-1) * this.scale + this.offsetY + this.userOffsetY + this.tmpUserOffsetY);
    }
    drawStreets(streetGraph) {
        this.context.clearRect(0, 0, 1920, 1080);
        this.context.strokeStyle = "black";
        this.context.fillStyle = "black";
        for (let edge of streetGraph.edges) {
            this.context.lineWidth = edge.width;
            this.context.beginPath();
            this.context.moveTo(this.getX(edge.startNode.position.x), this.getY(edge.startNode.position.y));
            this.context.lineTo(this.getX(edge.endNode.position.x), this.getY(edge.endNode.position.y));
            this.context.stroke();
        }
        this.context.fillStyle = "red";
        for (let newPoint of streetGraph.newPoints) {
            this.context.fillRect(this.getX(newPoint.x), this.getY(newPoint.y), 5, 5);
        }
        this.context.fillStyle = "blue";
        for (let growthPoint of this.simulationCofiguration.growthPoints) {
            this.context.fillRect(this.getX(growthPoint.x), this.getY(growthPoint.y), 10, 10);
        }
        this.context.fillStyle = "green";
        for (let face of streetGraph.facesList) {
            this.context.beginPath();
            this.context.moveTo(this.getX(face.nodes[0].position.x), this.getY(face.nodes[0].position.y));
            for (let node of face.nodes) {
                this.context.lineTo(this.getX(node.position.x), this.getY(node.position.y));
            }
            this.context.closePath();
            this.context.fill();
        }
    }
    fillCircle(path, color) {
        this.context.fillStyle = color;
        this.context.beginPath();
        this.context.moveTo(this.getX(path[0].position.x), this.getY(path[0].position.y));
        for (let node of path) {
            this.context.lineTo(this.getX(node.position.x), this.getY(node.position.y));
        }
        this.context.closePath();
        this.context.fill();
    }
    drawEdge(streetEdge, color) {
        this.context.strokeStyle = color;
        this.context.lineWidth = streetEdge.width + 2;
        this.context.beginPath();
        this.context.moveTo(this.getX(streetEdge.startNode.position.x), this.getY(streetEdge.startNode.position.y));
        this.context.lineTo(this.getX(streetEdge.endNode.position.x), this.getY(streetEdge.endNode.position.y));
        this.context.stroke();
    }
    drawNode(node, color) {
        this.context.fillStyle = color;
        this.context.fillRect(this.getX(node.position.x) - 5, this.getY(node.position.y) - 5, 10, 10);
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
    getDistanceFromClosesGrowthPoint(position) {
        const closestPointDistance = Math.min(...this.configuration.growthPoints.map(p => position.distance(p)));
        return closestPointDistance >= 1 ? closestPointDistance : 1;
    }
    calucateGrowthCandidateProbablity(node) {
        return Math.pow(Math.E, (-1) * Math.pow(this.configuration.focusedGrowthFunc(this.getDistanceFromClosesGrowthPoint(node.position)), 2));
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
        const newNode = new StreetGraph_1.StreetNode(this.streetGraph.getNextNodeId(), newNodePosition, StreetGraph_1.Hierarchy.Major);
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
                newStreet.setEndNode(nodeInCircle);
                if (newStreet.length() < this.configuration.minSteetSegmentLength)
                    return { newStreets: [], streetsToRemove: [] };
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
            if (newStreet2.length() < this.configuration.minSteetSegmentLength)
                return { newStreets: [], streetsToRemove: [] };
            return {
                newStreets: [part1Street, part2Street, newStreet2],
                streetsToRemove: [intersectionStreet]
            };
        }
        // check for existing nodes in circle
        const nodeInCircle = this.scanAround(newNode.position);
        if (nodeInCircle) {
            newStreet.setEndNode(nodeInCircle);
            if (newStreet.length() < this.configuration.minSteetSegmentLength)
                return { newStreets: [], streetsToRemove: [] };
            return {
                newStreets: [newStreet],
                streetsToRemove: []
            };
        }
        if (newStreet.length() < this.configuration.minSteetSegmentLength)
            return { newStreets: [], streetsToRemove: [] };
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
        const current2to4ration = valenceDistributon['2'] / (valenceDistributon['4'] + valenceDistributon['3']);
        // const allNodes = this.streetGraph.nodes.length;
        console.log('current2to4ration', current2to4ration);
        if (current2to4ration < this.configuration.valence2to3or4Ratio) {
            return [[1], [2, 3]];
        }
        return [[2, 3], [1]];
        // check distribution again (for 4 valance nodes)
        // console.log(this.configuration.valenceRatio, Object.entries(valenceDistributon).sort(([key, _v], [key2, _v2]) => Number(key) - Number(key2)).map(([_key, v]) => v / allNodes));
        // if (valenceDistributon['2'] / allNodes < this.configuration.valenceRatio[0]) return 1;
        // if (valenceDistributon['3'] / allNodes < this.configuration.valenceRatio[1]) return 2;
        // return 3;
    }
    next() {
        this.currentTime += 1;
        const searchedValences = this.getSearchedValence();
        let growthCandidates = this.streetGraph.nodes.filter(node => node.isGrowthing && searchedValences[0].includes(this.streetGraph.getNodeValence(node)));
        if (growthCandidates.length == 0) {
            growthCandidates = this.streetGraph.nodes.filter(node => node.isGrowthing && searchedValences[1].includes(this.streetGraph.getNodeValence(node)));
        }
        const candidatesProbabilites = growthCandidates.map(candidate => this.calucateGrowthCandidateProbablity(candidate));
        const normalizedCandidatesProbabilities = this.normalizeNumbers(candidatesProbabilites);
        // console.log('normalizedCandidatesProbabilities', normalizedCandidatesProbabilities)
        // console.log(normalizedCandidatesProbabilities.reduce((a, b) => a + b, 0))
        const randomNodeIndex = this.randomlySelectElementFromProbabilityDistribution(normalizedCandidatesProbabilities);
        if (randomNodeIndex == -1) {
            // console.log("coud not find candidate");
            return {
                done: this.currentTime == this.configuration.numberOfYears,
                value: this.streetGraph
            };
        }
        // console.log('randomNodeIndex', randomNodeIndex)
        const randomNode = growthCandidates[randomNodeIndex];
        const expansionResult = this.expandNode(randomNode);
        // console.log('expansionResult', expansionResult)
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
    let drag = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let currentStreetGraph = null;
    if (!ctx)
        return;
    const canvansDrawingEngine = new CanvasDrawingEngine_1.CanvasDrawingEngine(ctx, simulationConfiguration_1.default);
    const cityGenerator = new CityGenerator_1.CityGenerator(simulationConfiguration_1.default);
    const nextTick = () => {
        const { value: streetGraph, done } = cityGenerator.next();
        currentStreetGraph = streetGraph;
        streetGraph.setCanvansDrawingEngine(canvansDrawingEngine);
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
    // action buttons
    const calcualteFaces = document.getElementById("calcualteFaces");
    if (calcualteFaces)
        calcualteFaces.onclick = () => {
            if (currentStreetGraph)
                currentStreetGraph.calcualteFaces();
        };
    const clearfaces = document.getElementById("clearfaces");
    if (clearfaces)
        clearfaces.onclick = () => {
            if (currentStreetGraph)
                currentStreetGraph.facesList = [];
        };
    // start stop simulation
    const stopButton = document.getElementById("stop");
    const startButton = document.getElementById("start");
    if (stopButton)
        stopButton.style.display = 'none';
    if (startButton) {
        startButton.onclick = () => {
            const interval = setInterval(nextTick, 0);
            if (stopButton) {
                stopButton.onclick = () => {
                    clearInterval(interval);
                    startButton.style.display = 'block';
                    stopButton.style.display = 'none';
                };
                startButton.style.display = 'none';
                stopButton.style.display = 'block';
            }
        };
    }
    canvansDrawingEngine.drawStreets(cityGenerator.streetGraph);
    // UI FUNCTIONS
    // ZOOMING
    const zoomIn = document.getElementById('zoomIn');
    const zoomOut = document.getElementById('zoomOut');
    const zoomInCallback = () => {
        SCALE *= 1.5;
        canvansDrawingEngine.setScale(SCALE);
        canvansDrawingEngine.drawStreets(currentStreetGraph);
    };
    const zoomOutCallback = () => {
        SCALE /= 1.5;
        canvansDrawingEngine.setScale(SCALE);
        canvansDrawingEngine.drawStreets(currentStreetGraph);
    };
    zoomIn === null || zoomIn === void 0 ? void 0 : zoomIn.addEventListener("click", zoomInCallback);
    zoomOut === null || zoomOut === void 0 ? void 0 : zoomOut.addEventListener("click", zoomOutCallback);
    canvas.addEventListener('wheel', (e) => {
        if (e.deltaY > 0) {
            zoomInCallback();
        }
        else {
            zoomOutCallback();
        }
    });
    // MOVING CANVAS POSITION AROUND
    canvas.addEventListener('mousedown', (e) => {
        dragStartX = e.pageX;
        dragStartY = e.pageY;
        drag = true;
    });
    canvas.addEventListener('mouseup', (e) => {
        const diffX = e.pageX - dragStartX;
        const diffY = e.pageY - dragStartY;
        canvansDrawingEngine.addUserOffsetX(diffX);
        canvansDrawingEngine.addUserOffsetY(diffY);
        canvansDrawingEngine.setTmpUserOffsetX(0);
        canvansDrawingEngine.setTmpUserOffsetY(0);
        canvansDrawingEngine.drawStreets(cityGenerator.streetGraph);
        drag = false;
    });
    canvas.addEventListener('mousemove', (e) => {
        if (drag) {
            const diffX = e.pageX - dragStartX;
            const diffY = e.pageY - dragStartY;
            canvansDrawingEngine.setTmpUserOffsetX(diffX);
            canvansDrawingEngine.setTmpUserOffsetY(diffY);
            canvansDrawingEngine.drawStreets(cityGenerator.streetGraph);
        }
    });
    // print node info
    const printNodeinfoButton = document.getElementById('printNodeinfo');
    const printNodeInfo = (nodeId, color) => {
        const node = currentStreetGraph === null || currentStreetGraph === void 0 ? void 0 : currentStreetGraph.nodes.find((n) => n.id == nodeId);
        if (node) {
            canvansDrawingEngine.drawNode(node, color);
            const nodeAngles = currentStreetGraph === null || currentStreetGraph === void 0 ? void 0 : currentStreetGraph.clockwiseEdgesOrder[nodeId];
            console.log(`node ${nodeId}`, node);
            console.log(`nodeAngles ${nodeId}`, nodeAngles);
        }
        else {
            console.log('node do not exists');
        }
    };
    const printNodeinfoCb = () => {
        const nodeId = document.getElementById('nodeid').value;
        printNodeInfo(Number(nodeId), 'blue');
    };
    printNodeinfoButton === null || printNodeinfoButton === void 0 ? void 0 : printNodeinfoButton.addEventListener("click", printNodeinfoCb);
    // print edge info
    const printEdgeinfoButton = document.getElementById('printEdgeinfo');
    const printEdgeinfo = () => {
        const edgeId = document.getElementById('edgeId').value;
        const edge = currentStreetGraph === null || currentStreetGraph === void 0 ? void 0 : currentStreetGraph.edgesDict[edgeId];
        if (edge) {
            canvansDrawingEngine.drawEdge(edge, 'blue');
            printNodeInfo(edge.startNode.id, 'green');
            printNodeInfo(edge.endNode.id, 'red');
        }
        else {
            console.log(`edge ${edgeId} do not exists`);
        }
    };
    printEdgeinfoButton === null || printEdgeinfoButton === void 0 ? void 0 : printEdgeinfoButton.addEventListener("click", printEdgeinfo);
    // cycle find
    const cycleFindButton = document.getElementById('cycleFound');
    const findCycle = () => {
        const edgeId = document.getElementById('edgeId2').value;
        currentStreetGraph === null || currentStreetGraph === void 0 ? void 0 : currentStreetGraph.calcualteFace(edgeId);
    };
    cycleFindButton === null || cycleFindButton === void 0 ? void 0 : cycleFindButton.addEventListener("click", findCycle);
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
    growthPoints: [new StreetGraph_1.Point(0, 0)],
    // growthPoints: [new Point(-400, -400), new Point(400, 400), new Point(1000, 1500)],
    focusedGrowthFunc: (distanceFromNearestGrothwCeter) => 0.01 * distanceFromNearestGrothwCeter,
    // simulation
    numberOfYears: 10000000,
    timeStep: 1,
    // new nodes generation
    minSteetSegmentLength: 0,
    generationAngle: Math.PI / 2,
    streetsLength: 50,
    futureIntersectionScanFactor: 1.5, // length for node to check future interseciton
    nodeCricusScanningR: 25,
    // streets
    valence2to3or4Ratio: 0.99,
};
exports.default = SimulationConfiguration;

},{"./types/StreetGraph":7}],7:[function(require,module,exports){
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreetGraph = exports.Face = exports.StreetEdge = exports.StreetNode = exports.Point = exports.StreetStatus = exports.Hierarchy = void 0;
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
    length() {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
    }
    normalize() {
        const vectorLength = Math.sqrt(this.x * this.x + this.y * this.y);
        this.x = this.x / vectorLength;
        this.y = this.y / vectorLength;
    }
    vectorMultiply(vector) {
        return new Point(this.x * vector.x, this.y * vector.y);
    }
    scalarMultiplyVector(vector) {
        return this.x * vector.x - this.y * vector.y;
    }
    getAngle(vector) {
        const isConvexWithPerpendicularly = this.turnRight().scalarMultiplyVector(vector) >= 0;
        const angle = Math.acos(((this.x * vector.x) + (this.y * vector.y)) / (this.length() * vector.length()));
        if (isConvexWithPerpendicularly)
            return angle;
        return 2 * Math.PI - angle;
    }
    vectorAdd(vector) {
        return new Point(this.x + vector.x, this.y + vector.y);
    }
    vectorSubstract(vector) {
        return new Point(this.x - vector.x, this.y - vector.y);
    }
    reverse() {
        return new Point((-1) * this.x, (-1) * this.y);
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
    transpose() {
        return new Point(this.y, this.x);
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
        this.id = startNode.id < endNode.id ? startNode.id + ":" + endNode.id : endNode.id + ":" + startNode.id;
        this.startNodeAngle = new Point(0, 1).getAngle(endNode.position.vectorSubstract(startNode.position));
        this.endNodeAngle = new Point(0, 1).getAngle(startNode.position.vectorSubstract(endNode.position));
    }
    setStartNode(node) {
        this.startNode = node;
        this.startNodeAngle = new Point(0, 1).getAngle(this.endNode.position.vectorSubstract(this.startNode.position));
        this.endNodeAngle = new Point(0, 1).getAngle(this.startNode.position.vectorSubstract(this.endNode.position));
        this.id = this.startNode.id < this.endNode.id ? this.startNode.id + ":" + this.endNode.id : this.endNode.id + ":" + this.startNode.id;
    }
    setEndNode(node) {
        this.endNode = node;
        this.startNodeAngle = new Point(0, 1).getAngle(this.endNode.position.vectorSubstract(this.startNode.position));
        this.endNodeAngle = new Point(0, 1).getAngle(this.startNode.position.vectorSubstract(this.endNode.position));
        this.id = this.startNode.id < this.endNode.id ? this.startNode.id + ":" + this.endNode.id : this.endNode.id + ":" + this.startNode.id;
    }
    length() {
        return this.endNode.position.distance(this.startNode.position);
    }
}
exports.StreetEdge = StreetEdge;
class Face {
    constructor(nodes) {
        const id = nodes.map(n => n.id).sort((id1, id2) => id1 - id2).join(':');
        this.id = '1';
        this.nodes = nodes;
    }
}
exports.Face = Face;
class StreetGraph {
    constructor() {
        this.nodesIds = 100;
        this.edges = [];
        this.nodes = [];
        this.newPoints = [];
        this.graph = {};
        this.valence2edges = 0;
        this.valence3edges = 0;
        this.valence4edges = 0;
        this.facesDict = {};
        this.clockwiseEdgesOrder = {};
        this.edgesDict = {};
        this.facesList = [];
        this.canvansDrawingEngine = null;
    }
    getNextNodeId() {
        this.nodesIds += 1;
        return this.nodesIds - 1;
    }
    setCanvansDrawingEngine(canvansDrawingEngine) {
        this.canvansDrawingEngine = canvansDrawingEngine;
    }
    addStreet(street) {
        const startNodeId = street.startNode.id;
        const endNodeId = street.endNode.id;
        if (this.edgesDict[street.id]) {
            return;
        }
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
        this.edgesDict[street.id] = street;
        // update clockwiseEdgesOrder
        if (!this.clockwiseEdgesOrder[startNodeId])
            this.clockwiseEdgesOrder[startNodeId] = [];
        if (!this.clockwiseEdgesOrder[endNodeId])
            this.clockwiseEdgesOrder[endNodeId] = [];
        this.updateCloskwiseEdgesOrder(startNodeId);
        this.updateCloskwiseEdgesOrder(endNodeId);
    }
    updateCloskwiseEdgesOrder(nodeId) {
        this.clockwiseEdgesOrder[nodeId] = Object.values(this.graph[nodeId]).sort((street1, street2) => {
            const street1Angle = street1.startNode.id == nodeId ? street1.startNodeAngle : street1.endNodeAngle;
            const street2Angle = street2.startNode.id == nodeId ? street2.startNodeAngle : street2.endNodeAngle;
            return street1Angle - street2Angle;
        }).map(street => street.id);
    }
    // add logic for updateCloskwiseorder
    removeStreet(street) {
        const startNodeId = street.startNode.id;
        const endNodeId = street.endNode.id;
        delete this.graph[startNodeId][endNodeId];
        delete this.graph[endNodeId][startNodeId];
        delete this.edgesDict[street.id];
        const index = this.edges.findIndex(s => s.id == street.id);
        let l = this.edges.length;
        if (index > -1) {
            this.edges.splice(index, 1);
        }
        this.updateCloskwiseEdgesOrder(startNodeId);
        this.updateCloskwiseEdgesOrder(endNodeId);
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
    wait(ms) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((res) => setTimeout(res, ms));
        });
    }
    // clockvice travesal describe algorithm in thesis
    calcualteFaces() {
        return __awaiter(this, void 0, void 0, function* () {
            this.facesList = [];
            for (let edge of this.edges) {
                let nextNode = edge.endNode;
                let currEdge = edge;
                const path = [edge];
                const pathNodes = [edge.startNode, edge.endNode];
                // this.canvansDrawingEngine?.drawEdge(edge, "blue");
                while (true) {
                    const nextEdgeId = this.getClockwiseMostNode(currEdge, nextNode);
                    if (!nextEdgeId)
                        break;
                    currEdge = this.edgesDict[nextEdgeId];
                    // const randomColor = Math.floor(Math.random() * 16777215).toString(16);
                    // this.canvansDrawingEngine?.drawEdge(currEdge, "#" + randomColor);
                    nextNode = currEdge.startNode.id == nextNode.id ? currEdge.endNode : currEdge.startNode;
                    pathNodes.push(nextNode);
                    path.push(currEdge);
                    // cycle found
                    if (nextNode.id == edge.startNode.id) {
                        const face = new Face(pathNodes);
                        this.facesList.push(face);
                        if (!this.facesDict[face.id])
                            this.facesDict[face.id] = face;
                        // this.canvansDrawingEngine?.fillCircle(pathNodes, 'orange');
                        break;
                    }
                }
            }
            for (let edge of this.edges) {
                // if (visitedEdges.has(edge.id)) continue;
                let nextNode = edge.endNode;
                let currEdge = edge;
                const path = [edge];
                const pathNodes = [edge.startNode, edge.endNode];
                // this.canvansDrawingEngine?.drawEdge(edge, "blue");
                while (true) {
                    const nextEdgeId = this.getCounterclockwiseMostNode(currEdge, nextNode);
                    if (!nextEdgeId)
                        break;
                    currEdge = this.edgesDict[nextEdgeId];
                    // const randomColor = Math.floor(Math.random() * 16777215).toString(16);
                    // this.canvansDrawingEngine?.drawEdge(currEdge, "#" + randomColor);
                    nextNode = currEdge.startNode.id == nextNode.id ? currEdge.endNode : currEdge.startNode;
                    pathNodes.push(nextNode);
                    path.push(currEdge);
                    // cycle found
                    if (nextNode.id == edge.startNode.id) {
                        const face = new Face(pathNodes);
                        this.facesList.push(face);
                        if (!this.facesDict[face.id])
                            this.facesDict[face.id] = face;
                        // this.canvansDrawingEngine?.fillCircle(pathNodes, 'orange');
                        break;
                    }
                }
            }
        });
    }
    calcualteFace(edgeId) {
        var _a, _b, _c, _d, _e;
        return __awaiter(this, void 0, void 0, function* () {
            const edge = this.edgesDict[edgeId];
            if (!edge)
                return;
            let nextNode = edge.endNode;
            let currEdge = edge;
            const path = [edge];
            const pathNodes = [edge.startNode, edge.endNode];
            (_a = this.canvansDrawingEngine) === null || _a === void 0 ? void 0 : _a.drawEdge(edge, "blue");
            while (true) {
                yield this.wait(100);
                const nextEdgeId = this.getClockwiseMostNode(currEdge, nextNode);
                if (!nextEdgeId)
                    break;
                currEdge = this.edgesDict[nextEdgeId];
                const randomColor = Math.floor(Math.random() * 16777215).toString(16);
                (_b = this.canvansDrawingEngine) === null || _b === void 0 ? void 0 : _b.drawEdge(currEdge, "#" + randomColor);
                nextNode = currEdge.startNode.id == nextNode.id ? currEdge.endNode : currEdge.startNode;
                pathNodes.push(nextNode);
                path.push(currEdge);
                if (nextNode.id == edge.startNode.id) {
                    const face = new Face(pathNodes);
                    this.facesList.push(face);
                    if (!this.facesDict[face.id])
                        this.facesDict[face.id] = face;
                    (_c = this.canvansDrawingEngine) === null || _c === void 0 ? void 0 : _c.fillCircle(pathNodes, 'orange');
                    break;
                }
            }
            while (true) {
                yield this.wait(100);
                const nextEdgeId = this.getCounterclockwiseMostNode(currEdge, nextNode);
                if (!nextEdgeId)
                    break;
                currEdge = this.edgesDict[nextEdgeId];
                const randomColor = Math.floor(Math.random() * 16777215).toString(16);
                (_d = this.canvansDrawingEngine) === null || _d === void 0 ? void 0 : _d.drawEdge(currEdge, "#" + randomColor);
                nextNode = currEdge.startNode.id == nextNode.id ? currEdge.endNode : currEdge.startNode;
                pathNodes.push(nextNode);
                path.push(currEdge);
                if (nextNode.id == edge.startNode.id) {
                    const face = new Face(pathNodes);
                    this.facesList.push(face);
                    if (!this.facesDict[face.id])
                        this.facesDict[face.id] = face;
                    (_e = this.canvansDrawingEngine) === null || _e === void 0 ? void 0 : _e.fillCircle(pathNodes, 'orange');
                    break;
                }
            }
        });
    }
    getClockwiseMostNode(edge, currentNode) {
        const nodeValence = this.clockwiseEdgesOrder[currentNode.id].length;
        if (nodeValence == 1)
            return null;
        const index = this.clockwiseEdgesOrder[currentNode.id].findIndex((id) => id == edge.id);
        return this.clockwiseEdgesOrder[currentNode.id][index == nodeValence - 1 ? 0 : index + 1];
    }
    getCounterclockwiseMostNode(edge, currentNode) {
        const nodeValence = this.clockwiseEdgesOrder[currentNode.id].length;
        if (nodeValence == 1)
            return null;
        const index = this.clockwiseEdgesOrder[currentNode.id].findIndex((id) => id == edge.id);
        return this.clockwiseEdgesOrder[currentNode.id][index == 0 ? nodeValence - 1 : index - 1];
    }
}
exports.StreetGraph = StreetGraph;

},{}]},{},[5]);
