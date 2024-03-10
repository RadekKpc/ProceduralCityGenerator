(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CanvasDrawingEngine = void 0;
const StreetGraph_1 = require("../types/StreetGraph");
class CanvasDrawingEngine {
    constructor(context, simulationCofiguration, width, height, drawingConfiguration) {
        this.context = context;
        this.offsetX = width / 2;
        this.offsetY = height / 2;
        this.width = width;
        this.height = height;
        this.scale = 1;
        this.userOffsetX = 0;
        this.userOffsetY = 0;
        this.tmpUserOffsetX = 0;
        this.tmpUserOffsetY = 0;
        this.simulationCofiguration = simulationCofiguration;
        this.drawingConfiguration = drawingConfiguration;
        this.streetGraph = null;
        this.pointsSizes = 5;
    }
    resetScale() {
        this.scale = 1;
        this.userOffsetX = 0;
        this.userOffsetY = 0;
        this.tmpUserOffsetX = 0;
        this.tmpUserOffsetY = 0;
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
    changeDrawingConiguration(drawingConfiguration) {
        this.drawingConfiguration = Object.assign(Object.assign({}, this.drawingConfiguration), drawingConfiguration);
    }
    redrawStreetGraph() {
        if (this.streetGraph)
            this.drawStreets(this.streetGraph);
    }
    drawStreets(streetGraph) {
        this.context.clearRect(0, 0, this.width, this.height);
        this.streetGraph = streetGraph;
        if (this.drawingConfiguration.fillFaces) {
            for (let face of streetGraph.facesList) {
                this.context.beginPath();
                this.context.moveTo(this.getX(face.boundaryNodes[0].position.x), this.getY(face.boundaryNodes[0].position.y));
                for (let node of face.boundaryNodes) {
                    this.context.lineTo(this.getX(node.position.x), this.getY(node.position.y));
                }
                this.context.closePath();
                this.context.fillStyle = face.color;
                this.context.fill();
            }
        }
        this.context.strokeStyle = "black";
        this.context.fillStyle = "black";
        for (let edge of streetGraph.getEdges()) {
            this.context.lineWidth = edge.width;
            this.context.beginPath();
            this.context.moveTo(this.getX(edge.startNode.position.x), this.getY(edge.startNode.position.y));
            this.context.lineTo(this.getX(edge.endNode.position.x), this.getY(edge.endNode.position.y));
            this.context.stroke();
        }
        if (this.drawingConfiguration.drawGrowthCenters) {
            this.context.fillStyle = "orange";
            for (let growthPoint of this.simulationCofiguration.growthPoints) {
                this.context.fillRect(this.getX(growthPoint.x) - this.pointsSizes, this.getY(growthPoint.y) - this.pointsSizes, 2 * this.pointsSizes, 2 * this.pointsSizes);
            }
        }
        if (this.drawingConfiguration.drawMajorNodes) {
            this.context.fillStyle = "red";
            for (let point of streetGraph.nodes.filter(n => n.hierarchy == StreetGraph_1.Hierarchy.Major)) {
                this.context.fillRect(this.getX(point.position.x) - (this.pointsSizes / 2), this.getY(point.position.y) - (this.pointsSizes / 2), this.pointsSizes, this.pointsSizes);
            }
        }
        if (this.drawingConfiguration.drawMinorNodes) {
            this.context.fillStyle = "blue";
            for (let point of streetGraph.nodes.filter(n => n.hierarchy == StreetGraph_1.Hierarchy.Minor)) {
                this.context.fillRect(this.getX(point.position.x) - (this.pointsSizes / 2), this.getY(point.position.y) - (this.pointsSizes / 2), this.pointsSizes, this.pointsSizes);
            }
        }
        if (this.drawingConfiguration.drawNewPoints) {
            this.context.fillStyle = "green";
            for (let newPoint of streetGraph.newPoints) {
                this.context.fillRect(this.getX(newPoint.x) - (this.pointsSizes / 2), this.getY(newPoint.y) - (this.pointsSizes / 2), this.pointsSizes, this.pointsSizes);
            }
        }
        // trainglesToDraw
        for (const traingle of streetGraph.trainglesToDraw) {
            this.context.beginPath();
            this.context.moveTo(this.getX(traingle[0].position.x), this.getY(traingle[0].position.y));
            for (let node of traingle) {
                this.context.lineTo(this.getX(node.position.x), this.getY(node.position.y));
            }
            this.context.closePath();
            const randomColor = Math.floor(Math.random() * 128 + 128).toString(16);
            this.context.fillStyle = "#0000" + randomColor;
            this.context.fill();
        }
        // point to draw
        for (let ponint of streetGraph.pointsToDraw) {
            const randomColor = Math.floor(Math.random() * 128 + 128).toString(16);
            this.context.fillStyle = "#" + randomColor + '0000';
            this.context.fillRect(this.getX(ponint.x), this.getY(ponint.y), 5, 5);
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

},{"../types/StreetGraph":7}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CityGenerator = void 0;
const StreetGraph_1 = require("../types/StreetGraph");
const NormalStreetsPattern_1 = require("./cityStyles/NormalStreetsPattern");
const utils_1 = require("./utils");
class CityGenerator {
    constructor(configuration) {
        this.nextFace = 0;
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
        if (node.hierarchy == StreetGraph_1.Hierarchy.Major)
            return Math.pow(Math.E, (-1) * Math.pow(this.configuration.focusedGrowthFunc(this.getDistanceFromClosesGrowthPoint(node.position)), 2));
        return 1;
    }
    scanAround(scanPosition) {
        for (let node of this.streetGraph.nodes) {
            if (node.position.distance(scanPosition) < this.configuration.nodeCricusScanningR) {
                return node;
            }
        }
        return null;
    }
    generateNewStreet(direction, startNode) {
        const [newNodePosition, futureIntersectionScanPosition] = new NormalStreetsPattern_1.NormalStreetsPattern().getNewNodeLocation(direction, startNode, this.configuration);
        const newNode = new StreetGraph_1.StreetNode(this.streetGraph.getNextNodeId(), newNodePosition, startNode.hierarchy);
        const newStreet = new StreetGraph_1.StreetEdge(startNode, newNode, startNode.hierarchy, startNode.hierarchy == StreetGraph_1.Hierarchy.Major ? 3 : 1, StreetGraph_1.StreetStatus.Build);
        // check for intersection or future intersection
        let closestInetrsectionPoint = null;
        let intersectionStreet = null;
        for (let edge of this.streetGraph.getEdges()) {
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
            newNode.hierarchy = intersectionStreet.hierarchy;
            // they should inherit all proeprties
            const part1Street = new StreetGraph_1.StreetEdge(intersectionStreet.startNode, newNode, intersectionStreet.hierarchy, intersectionStreet.width, intersectionStreet.status);
            const part2Street = new StreetGraph_1.StreetEdge(intersectionStreet.endNode, newNode, intersectionStreet.hierarchy, intersectionStreet.width, intersectionStreet.status);
            const newStreet2 = new StreetGraph_1.StreetEdge(startNode, newNode, startNode.hierarchy, startNode.hierarchy == StreetGraph_1.Hierarchy.Major ? 3 : 1, StreetGraph_1.StreetStatus.Build);
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
            return this.generateNewStreet(node.direction, node);
        }
        if (nodeValence == 2) {
            if (Math.random() < 0.5) {
                node.hasLeft = true;
                return this.generateNewStreet(node.leftDirection, node);
            }
            else {
                node.hasRight = true;
                return this.generateNewStreet(node.rightDirection, node);
            }
        }
        if (nodeValence == 3) {
            node.isGrowthing = false;
            if (node.hasLeft) {
                node.hasRight = true;
                return this.generateNewStreet(node.rightDirection, node);
            }
            node.hasLeft = true;
            return this.generateNewStreet(node.leftDirection, node);
        }
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
    splitNextFace() {
        this.streetGraph.pointsToDraw = [];
        this.streetGraph.trainglesToDraw = [];
        const face = this.streetGraph.facesList[this.nextFace % this.streetGraph.facesList.length];
        for (let i = 0; i < 10; i++) {
            const point = face.getRandomPointFromFace();
            this.streetGraph.pointsToDraw.push(point);
        }
        for (let traingle of face.traingles) {
            this.streetGraph.trainglesToDraw.push(traingle);
        }
        this.nextFace += 1;
    }
    splitFaces() {
        for (let face of this.streetGraph.facesList) {
            for (let traingle of face.traingles) {
                this.streetGraph.trainglesToDraw.push(traingle);
            }
            for (let i = 0; i < 10; i++) {
                const point = face.getRandomPointFromFace();
                this.streetGraph.pointsToDraw.push(point);
            }
        }
    }
    generateSecondaryRoads() {
        console.log('this.streetGraph.facesList', this.streetGraph.facesList);
        for (let face of this.streetGraph.facesList) {
            this.fillFaceWithRoads(face);
        }
    }
    expandMinorStreets() {
        for (let face of this.streetGraph.facesList) {
            for (let i = 0; i < 30; i++) {
                this.expandMinorStreet(face);
            }
        }
    }
    fillFaceWithRoads(face) {
        let isProperLength = false;
        let newEdge;
        for (let i = 0; i < 10; i++) {
            const [startPoint1, startPoint2] = face.getRandomTwoPoinsInTraingle();
            const node1 = new StreetGraph_1.StreetNode(this.streetGraph.getNextNodeId(), startPoint1, StreetGraph_1.Hierarchy.Minor);
            const node2 = new StreetGraph_1.StreetNode(this.streetGraph.getNextNodeId(), startPoint2, StreetGraph_1.Hierarchy.Minor);
            newEdge = new StreetGraph_1.StreetEdge(node1, node2, StreetGraph_1.Hierarchy.Minor, 1, StreetGraph_1.StreetStatus.Planned);
            if (newEdge.length() >= this.configuration.minimumInitialStreetLength) {
                isProperLength = true;
                break;
            }
        }
        if (!isProperLength || !newEdge) {
            console.log('could not find proper new street for face');
            return;
        }
        this.streetGraph.addMinorStreet(newEdge, face);
        // while(!face.isExpansionFinished) {
        // }
        // for (let i = 0; i < 30; i++) {
        //     this.expandMinorStreet(face);
        // }
    }
    expandMinorStreet(face) {
        let growthCandidates = face.nodes.filter(node => node.isGrowthing && node.hierarchy == StreetGraph_1.Hierarchy.Minor);
        const candidatesProbabilites = growthCandidates.map(candidate => this.calucateGrowthCandidateProbablity(candidate));
        const normalizedCandidatesProbabilities = (0, utils_1.normalizeNumbers)(candidatesProbabilites);
        const randomNodeIndex = (0, utils_1.randomlySelectElementFromProbabilityDistribution)(normalizedCandidatesProbabilities);
        if (randomNodeIndex == -1) {
            // console.log("coud not find candidate");
            return {
                done: this.currentTime == this.configuration.numberOfYears,
                value: this.streetGraph
            };
        }
        const randomNode = growthCandidates[randomNodeIndex];
        const expansionResult = this.expandNode(randomNode);
        // console.log('expansionResult', expansionResult)
        this.streetGraph.clearNewPoints();
        for (let newStreet of expansionResult.newStreets) {
            this.streetGraph.addMinorStreet(newStreet, face); // check it twice
            // below 2 lines are tmp
            this.streetGraph.addNewPoint(newStreet.endNode.position);
            this.streetGraph.addNewPoint(newStreet.startNode.position);
        }
        for (let streetToRemove of expansionResult.streetsToRemove) {
            this.streetGraph.removeStreet(streetToRemove); // to be done
        }
    }
    next() {
        this.currentTime += 1;
        const searchedValences = this.getSearchedValence();
        let growthCandidates = this.streetGraph.nodes.filter(node => node.isGrowthing && searchedValences[0].includes(this.streetGraph.getNodeValence(node)));
        if (growthCandidates.length == 0) {
            growthCandidates = this.streetGraph.nodes.filter(node => node.isGrowthing && searchedValences[1].includes(this.streetGraph.getNodeValence(node)));
        }
        const candidatesProbabilites = growthCandidates.map(candidate => this.calucateGrowthCandidateProbablity(candidate));
        const normalizedCandidatesProbabilities = (0, utils_1.normalizeNumbers)(candidatesProbabilites);
        // console.log('normalizedCandidatesProbabilities', normalizedCandidatesProbabilities)
        // console.log(normalizedCandidatesProbabilities.reduce((a, b) => a + b, 0))
        const randomNodeIndex = (0, utils_1.randomlySelectElementFromProbabilityDistribution)(normalizedCandidatesProbabilities);
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
            // below 2 lines are tmp
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
exports.randomlySelectElementFromProbabilityDistribution = exports.normalizeNumbers = exports.calculateIntersection = exports.gaussianRandom = void 0;
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
const normalizeNumbers = (numbers) => {
    const sum = numbers.reduce((a, b) => a + b, 0);
    return numbers.map(n => n / sum);
};
exports.normalizeNumbers = normalizeNumbers;
const randomlySelectElementFromProbabilityDistribution = (distribution) => {
    for (let i = 1; i < distribution.length; i++) {
        distribution[i] += distribution[i - 1];
    }
    const randomNumber = Math.random();
    return distribution.findIndex(e => e >= randomNumber);
};
exports.randomlySelectElementFromProbabilityDistribution = randomlySelectElementFromProbabilityDistribution;

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
    const drawingConfiguration = {
        fillFaces: true,
        drawMajorNodes: true,
        drawMinorNodes: true,
        drawNewPoints: false,
        drawGrowthCenters: false
    };
    const canvansDrawingEngine = new CanvasDrawingEngine_1.CanvasDrawingEngine(ctx, simulationConfiguration_1.default, canvas.width, canvas.height, drawingConfiguration);
    const cityGenerator = new CityGenerator_1.CityGenerator(simulationConfiguration_1.default);
    canvansDrawingEngine.drawStreets(cityGenerator.streetGraph);
    // view configuration settings
    const fillFaces = document.getElementById("fillFaces");
    const drawMajorNodes = document.getElementById("drawMajorNodes");
    const drawMinorNodes = document.getElementById("drawMinorNodes");
    const showNewNodes = document.getElementById("showNewNodes");
    const showGrowthCenters = document.getElementById("showGrowthCenters");
    fillFaces.onclick = () => {
        canvansDrawingEngine.changeDrawingConiguration({ fillFaces: fillFaces.checked });
        canvansDrawingEngine.redrawStreetGraph();
    };
    drawMajorNodes.onclick = () => {
        canvansDrawingEngine.changeDrawingConiguration({ drawMajorNodes: drawMajorNodes.checked });
        canvansDrawingEngine.redrawStreetGraph();
    };
    drawMinorNodes.onclick = () => {
        canvansDrawingEngine.changeDrawingConiguration({ drawMinorNodes: drawMinorNodes.checked });
        canvansDrawingEngine.redrawStreetGraph();
    };
    showNewNodes.onclick = () => {
        canvansDrawingEngine.changeDrawingConiguration({ drawNewPoints: showNewNodes.checked });
        canvansDrawingEngine.redrawStreetGraph();
    };
    showGrowthCenters.onclick = () => {
        canvansDrawingEngine.changeDrawingConiguration({ drawGrowthCenters: showGrowthCenters.checked });
        canvansDrawingEngine.redrawStreetGraph();
    };
    const centerView = document.getElementById("centerView");
    if (centerView)
        centerView.onclick = () => {
            canvansDrawingEngine.resetScale();
            canvansDrawingEngine.redrawStreetGraph();
        };
    // simulaton control
    const stopButton = document.getElementById("stop");
    const startButton = document.getElementById("start");
    const nextTickButton = document.getElementById("nextTickButton");
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
    if (nextTickButton)
        nextTickButton.onclick = nextTick;
    if (stopButton)
        stopButton.style.display = 'none';
    if (startButton)
        startButton.onclick = () => {
            const interval = setInterval(nextTick, 0);
            if (stopButton) {
                stopButton.onclick = () => {
                    clearInterval(interval);
                    startButton.style.display = 'inline-block';
                    stopButton.style.display = 'none';
                };
                startButton.style.display = 'none';
                stopButton.style.display = 'inline-block';
            }
        };
    // action buttons
    const calcualteFaces = document.getElementById("calcualteFaces");
    if (calcualteFaces)
        calcualteFaces.onclick = () => {
            if (currentStreetGraph)
                currentStreetGraph.calcualteFaces();
            canvansDrawingEngine.redrawStreetGraph();
        };
    const splitFaces = document.getElementById("splitFaces");
    if (splitFaces)
        splitFaces.onclick = () => {
            if (currentStreetGraph)
                cityGenerator.splitFaces();
            canvansDrawingEngine.redrawStreetGraph();
        };
    const generateSecondaryRoads = document.getElementById("generateSecondaryRoads");
    if (generateSecondaryRoads)
        generateSecondaryRoads.onclick = () => {
            if (currentStreetGraph)
                cityGenerator.generateSecondaryRoads();
            canvansDrawingEngine.redrawStreetGraph();
        };
    const expandMinorStreets = document.getElementById("expandMinorStreets");
    if (expandMinorStreets)
        expandMinorStreets.onclick = () => {
            if (currentStreetGraph)
                cityGenerator.expandMinorStreets();
            canvansDrawingEngine.redrawStreetGraph();
        };
    // ZOOMING
    const zoomInCallback = () => {
        SCALE *= 1.5;
        canvansDrawingEngine.setScale(SCALE);
        canvansDrawingEngine.redrawStreetGraph();
    };
    const zoomOutCallback = () => {
        SCALE /= 1.5;
        canvansDrawingEngine.setScale(SCALE);
        canvansDrawingEngine.redrawStreetGraph();
    };
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
        const edge = currentStreetGraph === null || currentStreetGraph === void 0 ? void 0 : currentStreetGraph.edges[edgeId];
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
const street1 = new StreetGraph_1.StreetEdge(StreetNode1, StreetNode2, StreetGraph_1.Hierarchy.Major, 3, StreetGraph_1.StreetStatus.Build);
const StreetNode3 = new StreetGraph_1.StreetNode(3, new StreetGraph_1.Point(100, 0), StreetGraph_1.Hierarchy.Major);
const street2 = new StreetGraph_1.StreetEdge(StreetNode2, StreetNode3, StreetGraph_1.Hierarchy.Major, 3, StreetGraph_1.StreetStatus.Build);
const StreetNode4 = new StreetGraph_1.StreetNode(4, new StreetGraph_1.Point(150, 0), StreetGraph_1.Hierarchy.Major);
const street3 = new StreetGraph_1.StreetEdge(StreetNode3, StreetNode4, StreetGraph_1.Hierarchy.Major, 3, StreetGraph_1.StreetStatus.Build);
const StreetNode5 = new StreetGraph_1.StreetNode(5, new StreetGraph_1.Point(150, 200), StreetGraph_1.Hierarchy.Major);
const street4 = new StreetGraph_1.StreetEdge(StreetNode4, StreetNode5, StreetGraph_1.Hierarchy.Major, 3, StreetGraph_1.StreetStatus.Build);
const StreetNode6 = new StreetGraph_1.StreetNode(6, new StreetGraph_1.Point(120, 200), StreetGraph_1.Hierarchy.Major);
const street5 = new StreetGraph_1.StreetEdge(StreetNode5, StreetNode6, StreetGraph_1.Hierarchy.Major, 3, StreetGraph_1.StreetStatus.Build);
const StreetNode7 = new StreetGraph_1.StreetNode(7, new StreetGraph_1.Point(0, 200), StreetGraph_1.Hierarchy.Major);
const street6 = new StreetGraph_1.StreetEdge(StreetNode6, StreetNode7, StreetGraph_1.Hierarchy.Major, 3, StreetGraph_1.StreetStatus.Build);
const street7 = new StreetGraph_1.StreetEdge(StreetNode7, StreetNode1, StreetGraph_1.Hierarchy.Major, 3, StreetGraph_1.StreetStatus.Build);
const StreetNode8 = new StreetGraph_1.StreetNode(8, new StreetGraph_1.Point(100, 100), StreetGraph_1.Hierarchy.Major);
const street8 = new StreetGraph_1.StreetEdge(StreetNode3, StreetNode8, StreetGraph_1.Hierarchy.Major, 3, StreetGraph_1.StreetStatus.Build);
const StreetNode9 = new StreetGraph_1.StreetNode(9, new StreetGraph_1.Point(120, 100), StreetGraph_1.Hierarchy.Major);
const street9 = new StreetGraph_1.StreetEdge(StreetNode6, StreetNode9, StreetGraph_1.Hierarchy.Major, 3, StreetGraph_1.StreetStatus.Build);
const street10 = new StreetGraph_1.StreetEdge(StreetNode8, StreetNode9, StreetGraph_1.Hierarchy.Major, 3, StreetGraph_1.StreetStatus.Build);
initialStreetGraph.addStreet(street1);
// initialStreetGraph.addStreet(street2);
// initialStreetGraph.addStreet(street3);
// initialStreetGraph.addStreet(street4);
// initialStreetGraph.addStreet(street5);
// initialStreetGraph.addStreet(street6);
// initialStreetGraph.addStreet(street7);
// initialStreetGraph.addStreet(street8);
// initialStreetGraph.addStreet(street9);
// initialStreetGraph.addStreet(street10);
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
    nodeCricusScanningR: 0, // causes minor streets to go out of face (if another node is found)
    // streets
    valence2to3or4Ratio: 0.99,
    // secondary roads
    minimumInitialStreetLength: 10
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreetGraph = exports.Face = exports.StreetEdge = exports.StreetNode = exports.Point = exports.StreetStatus = exports.StreetPattern = exports.Hierarchy = void 0;
const earcut_1 = __importDefault(require("earcut"));
const utils_1 = require("../generator/utils");
var Hierarchy;
(function (Hierarchy) {
    Hierarchy[Hierarchy["Minor"] = 0] = "Minor";
    Hierarchy[Hierarchy["Major"] = 1] = "Major";
})(Hierarchy || (exports.Hierarchy = Hierarchy = {}));
var StreetPattern;
(function (StreetPattern) {
    StreetPattern[StreetPattern["Normal"] = 0] = "Normal";
    StreetPattern[StreetPattern["Grid"] = 1] = "Grid";
    StreetPattern[StreetPattern["Round"] = 2] = "Round";
})(StreetPattern || (exports.StreetPattern = StreetPattern = {}));
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
    // traffic: number;
    constructor(id, position, hierarchy) {
        this.id = id;
        this.position = position;
        this.hierarchy = hierarchy;
        this.isGrowthing = true;
        // this.traffic = 0;
        this.hasFront = false;
        this.hasRight = false;
        this.hasLeft = false;
        this.direction = new Point(0, 0);
        this.leftDirection = new Point(0, 0);
        this.rightDirection = new Point(0, 0);
    }
    // setTraffic(traffic: number) {
    //     this.traffic = traffic;
    // }
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
class PlanarGraph {
}
class Face {
    constructor(boundaryNodes, boundaryStreets) {
        this.nodes = [];
        this.streets = [];
        this.traingles = [];
        this.trainglesSurface = [];
        this.totalSurface = 0;
        this.isExpansionFinished = false;
        this.areaStreetPattern = StreetPattern.Normal;
        this.id = boundaryNodes.map(n => n.id).sort((id1, id2) => id1 - id2).join(':');
        this.boundaryNodes = boundaryNodes;
        this.boundaryStreets = boundaryStreets;
        this.nodes = [...boundaryNodes];
        this.streets = [...boundaryStreets];
        const traingles = (0, earcut_1.default)(boundaryNodes.flatMap(node => [node.position.x, node.position.y]));
        for (let i = 0; i < traingles.length; i += 3) {
            const p1 = boundaryNodes[traingles[i]];
            const p2 = boundaryNodes[traingles[i + 1]];
            const p3 = boundaryNodes[traingles[i + 2]];
            this.traingles.push([p1, p2, p3]);
        }
        this.trainglesSurface = this.traingles.map(([p1, p2, p3]) => {
            const a = p1.position.distance(p2.position);
            const b = p1.position.distance(p3.position);
            const c = p2.position.distance(p3.position);
            return 0.25 * Math.sqrt((a + b + c) * ((-1) * a + b + c) * ((-1) * b + a + c) * ((-1) * c + a + b)); // Heron's formula
        });
        this.totalSurface = this.trainglesSurface.reduce((a, b) => a + b, 0);
        const randomColor = Math.floor(Math.random() * 256 + 0).toString(16);
        const randomColor2 = Math.floor(Math.random() * 256 + 0).toString(16);
        this.color = "#00" + randomColor + randomColor2;
    }
    getRandomPointInTriangle(selectedTraingle) {
        const r1 = Math.random();
        const r2 = Math.random();
        const sqrt_r1 = Math.sqrt(r1);
        const A = selectedTraingle[0].position.scalarMultiply(1 - sqrt_r1);
        const B = selectedTraingle[1].position.scalarMultiply(sqrt_r1 * (1 - r2));
        const C = selectedTraingle[2].position.scalarMultiply(r2 * sqrt_r1);
        return A.vectorAdd(B).vectorAdd(C);
    }
    getRandomPointFromFace() {
        // select random traingle from face weighted by surface
        const normalizedSurfaceRations = (0, utils_1.normalizeNumbers)(this.trainglesSurface.map(surface => surface / this.totalSurface));
        let traingleIndex = (0, utils_1.randomlySelectElementFromProbabilityDistribution)(normalizedSurfaceRations);
        traingleIndex = traingleIndex == -1 ? 0 : traingleIndex;
        const selectedTraingle = this.traingles[traingleIndex];
        // find random point in the selected traingle
        // https://math.stackexchange.com/questions/18686/uniform-random-point-in-triangle-in-3d
        return this.getRandomPointInTriangle(selectedTraingle);
    }
    getRandomTwoPoinsInTraingle() {
        // select random traingle from face weighted by surface
        const normalizedSurfaceRations = (0, utils_1.normalizeNumbers)(this.trainglesSurface.map(surface => surface / this.totalSurface));
        let traingleIndex = (0, utils_1.randomlySelectElementFromProbabilityDistribution)(normalizedSurfaceRations);
        traingleIndex = traingleIndex == -1 ? 0 : traingleIndex;
        const selectedTraingle = this.traingles[traingleIndex];
        // find random  two points in the selected traingle
        // https://math.stackexchange.com/questions/18686/uniform-random-point-in-triangle-in-3d
        const p1 = this.getRandomPointInTriangle(selectedTraingle);
        const p2 = this.getRandomPointInTriangle(selectedTraingle);
        return [p1, p2];
    }
    addStreet(street) {
        if (!this.streets.some(s => s.id == street.id)) {
            this.streets.push(street);
        }
        ;
        if (!this.boundaryNodes.some(n => n.id == street.startNode.id)) {
            this.nodes.push(street.startNode);
        }
        ;
        if (!this.boundaryNodes.some(n => n.id == street.endNode.id)) {
            this.nodes.push(street.endNode);
        }
        ;
    }
}
exports.Face = Face;
class StreetGraph {
    getEdges() {
        return Object.values(this.edges);
    }
    constructor() {
        this.nodesIds = 100;
        this.trainglesToDraw = [];
        this.pointsToDraw = [];
        this.nodes = [];
        this.newPoints = [];
        this.graph = {};
        this.valence2edges = 0;
        this.valence3edges = 0;
        this.valence4edges = 0;
        this.facesDict = {};
        this.clockwiseEdgesOrder = {};
        this.edges = {};
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
        if (this.edges[street.id]) {
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
        this.edges[street.id] = street;
        // update clockwiseEdgesOrder
        if (!this.clockwiseEdgesOrder[startNodeId])
            this.clockwiseEdgesOrder[startNodeId] = [];
        if (!this.clockwiseEdgesOrder[endNodeId])
            this.clockwiseEdgesOrder[endNodeId] = [];
        this.updateCloskwiseEdgesOrder(startNodeId);
        this.updateCloskwiseEdgesOrder(endNodeId);
    }
    addMinorStreet(street, face) {
        this.addStreet(street);
        face.addStreet(street);
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
        delete this.edges[street.id];
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
            for (let edge of this.getEdges()) {
                let nextNode = edge.endNode;
                let currEdge = edge;
                const path = [edge];
                const pathNodes = [edge.startNode, edge.endNode];
                // this.canvansDrawingEngine?.drawEdge(edge, "blue");
                while (true) {
                    // await this.wait(100);
                    const nextEdgeId = this.getClockwiseMostNode(currEdge, nextNode);
                    if (!nextEdgeId)
                        break;
                    currEdge = this.edges[nextEdgeId];
                    // const randomColor = Math.floor(Math.random() * 16777215).toString(16);
                    // this.canvansDrawingEngine?.drawEdge(currEdge, "#" + randomColor);
                    nextNode = currEdge.startNode.id == nextNode.id ? currEdge.endNode : currEdge.startNode;
                    if (nextNode.id != edge.startNode.id) {
                        pathNodes.push(nextNode);
                    }
                    path.push(currEdge);
                    // cycle found
                    if (nextNode.id == edge.startNode.id) {
                        const face = new Face(pathNodes, path);
                        if (!this.facesDict[face.id]) {
                            this.facesDict[face.id] = face;
                            this.facesList.push(face);
                        }
                        // this.canvansDrawingEngine?.fillCircle(pathNodes, 'orange');
                        break;
                    }
                }
            }
            // for (let edge of this.getEdges()) {
            //     // await this.wait(100);
            //     let nextNode = edge.endNode;
            //     let currEdge = edge;
            //     const path = [edge];
            //     const pathNodes = [edge.startNode, edge.endNode];
            //     // this.canvansDrawingEngine?.drawEdge(edge, "blue");
            //     while (true) {
            //         const nextEdgeId = this.getCounterclockwiseMostNode(currEdge, nextNode);
            //         if (!nextEdgeId) break;
            //         currEdge = this.edges[nextEdgeId];
            //         // const randomColor = Math.floor(Math.random() * 16777215).toString(16);
            //         // this.canvansDrawingEngine?.drawEdge(currEdge, "#" + randomColor);
            //         nextNode = currEdge.startNode.id == nextNode.id ? currEdge.endNode : currEdge.startNode;
            //         if (nextNode.id != edge.startNode.id) {
            //             pathNodes.push(nextNode);
            //         }
            //         path.push(currEdge);
            //         // cycle found
            //         if (nextNode.id == edge.startNode.id) {
            //             const face = new Face(pathNodes);
            //             if (!this.facesDict[face.id]) {
            //                 this.facesDict[face.id] = face;
            //                 this.facesList.push(face);
            //             }
            //             // this.canvansDrawingEngine?.fillCircle(pathNodes, 'orange');
            //             break;
            //         }
            //     }
            // }
        });
    }
    calcualteFace(edgeId) {
        var _a, _b, _c, _d, _e;
        return __awaiter(this, void 0, void 0, function* () {
            const edge = this.edges[edgeId];
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
                currEdge = this.edges[nextEdgeId];
                const randomColor = Math.floor(Math.random() * 16777215).toString(16);
                (_b = this.canvansDrawingEngine) === null || _b === void 0 ? void 0 : _b.drawEdge(currEdge, "#" + randomColor);
                nextNode = currEdge.startNode.id == nextNode.id ? currEdge.endNode : currEdge.startNode;
                pathNodes.push(nextNode);
                path.push(currEdge);
                if (nextNode.id == edge.startNode.id) {
                    const face = new Face(pathNodes, path);
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
                currEdge = this.edges[nextEdgeId];
                const randomColor = Math.floor(Math.random() * 16777215).toString(16);
                (_d = this.canvansDrawingEngine) === null || _d === void 0 ? void 0 : _d.drawEdge(currEdge, "#" + randomColor);
                nextNode = currEdge.startNode.id == nextNode.id ? currEdge.endNode : currEdge.startNode;
                pathNodes.push(nextNode);
                path.push(currEdge);
                if (nextNode.id == edge.startNode.id) {
                    const face = new Face(pathNodes, path);
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

},{"../generator/utils":4,"earcut":8}],8:[function(require,module,exports){
'use strict';

module.exports = earcut;
module.exports.default = earcut;

function earcut(data, holeIndices, dim) {

    dim = dim || 2;

    var hasHoles = holeIndices && holeIndices.length,
        outerLen = hasHoles ? holeIndices[0] * dim : data.length,
        outerNode = linkedList(data, 0, outerLen, dim, true),
        triangles = [];

    if (!outerNode || outerNode.next === outerNode.prev) return triangles;

    var minX, minY, maxX, maxY, x, y, invSize;

    if (hasHoles) outerNode = eliminateHoles(data, holeIndices, outerNode, dim);

    // if the shape is not too simple, we'll use z-order curve hash later; calculate polygon bbox
    if (data.length > 80 * dim) {
        minX = maxX = data[0];
        minY = maxY = data[1];

        for (var i = dim; i < outerLen; i += dim) {
            x = data[i];
            y = data[i + 1];
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
        }

        // minX, minY and invSize are later used to transform coords into integers for z-order calculation
        invSize = Math.max(maxX - minX, maxY - minY);
        invSize = invSize !== 0 ? 32767 / invSize : 0;
    }

    earcutLinked(outerNode, triangles, dim, minX, minY, invSize, 0);

    return triangles;
}

// create a circular doubly linked list from polygon points in the specified winding order
function linkedList(data, start, end, dim, clockwise) {
    var i, last;

    if (clockwise === (signedArea(data, start, end, dim) > 0)) {
        for (i = start; i < end; i += dim) last = insertNode(i, data[i], data[i + 1], last);
    } else {
        for (i = end - dim; i >= start; i -= dim) last = insertNode(i, data[i], data[i + 1], last);
    }

    if (last && equals(last, last.next)) {
        removeNode(last);
        last = last.next;
    }

    return last;
}

// eliminate colinear or duplicate points
function filterPoints(start, end) {
    if (!start) return start;
    if (!end) end = start;

    var p = start,
        again;
    do {
        again = false;

        if (!p.steiner && (equals(p, p.next) || area(p.prev, p, p.next) === 0)) {
            removeNode(p);
            p = end = p.prev;
            if (p === p.next) break;
            again = true;

        } else {
            p = p.next;
        }
    } while (again || p !== end);

    return end;
}

// main ear slicing loop which triangulates a polygon (given as a linked list)
function earcutLinked(ear, triangles, dim, minX, minY, invSize, pass) {
    if (!ear) return;

    // interlink polygon nodes in z-order
    if (!pass && invSize) indexCurve(ear, minX, minY, invSize);

    var stop = ear,
        prev, next;

    // iterate through ears, slicing them one by one
    while (ear.prev !== ear.next) {
        prev = ear.prev;
        next = ear.next;

        if (invSize ? isEarHashed(ear, minX, minY, invSize) : isEar(ear)) {
            // cut off the triangle
            triangles.push(prev.i / dim | 0);
            triangles.push(ear.i / dim | 0);
            triangles.push(next.i / dim | 0);

            removeNode(ear);

            // skipping the next vertex leads to less sliver triangles
            ear = next.next;
            stop = next.next;

            continue;
        }

        ear = next;

        // if we looped through the whole remaining polygon and can't find any more ears
        if (ear === stop) {
            // try filtering points and slicing again
            if (!pass) {
                earcutLinked(filterPoints(ear), triangles, dim, minX, minY, invSize, 1);

            // if this didn't work, try curing all small self-intersections locally
            } else if (pass === 1) {
                ear = cureLocalIntersections(filterPoints(ear), triangles, dim);
                earcutLinked(ear, triangles, dim, minX, minY, invSize, 2);

            // as a last resort, try splitting the remaining polygon into two
            } else if (pass === 2) {
                splitEarcut(ear, triangles, dim, minX, minY, invSize);
            }

            break;
        }
    }
}

// check whether a polygon node forms a valid ear with adjacent nodes
function isEar(ear) {
    var a = ear.prev,
        b = ear,
        c = ear.next;

    if (area(a, b, c) >= 0) return false; // reflex, can't be an ear

    // now make sure we don't have other points inside the potential ear
    var ax = a.x, bx = b.x, cx = c.x, ay = a.y, by = b.y, cy = c.y;

    // triangle bbox; min & max are calculated like this for speed
    var x0 = ax < bx ? (ax < cx ? ax : cx) : (bx < cx ? bx : cx),
        y0 = ay < by ? (ay < cy ? ay : cy) : (by < cy ? by : cy),
        x1 = ax > bx ? (ax > cx ? ax : cx) : (bx > cx ? bx : cx),
        y1 = ay > by ? (ay > cy ? ay : cy) : (by > cy ? by : cy);

    var p = c.next;
    while (p !== a) {
        if (p.x >= x0 && p.x <= x1 && p.y >= y0 && p.y <= y1 &&
            pointInTriangle(ax, ay, bx, by, cx, cy, p.x, p.y) &&
            area(p.prev, p, p.next) >= 0) return false;
        p = p.next;
    }

    return true;
}

function isEarHashed(ear, minX, minY, invSize) {
    var a = ear.prev,
        b = ear,
        c = ear.next;

    if (area(a, b, c) >= 0) return false; // reflex, can't be an ear

    var ax = a.x, bx = b.x, cx = c.x, ay = a.y, by = b.y, cy = c.y;

    // triangle bbox; min & max are calculated like this for speed
    var x0 = ax < bx ? (ax < cx ? ax : cx) : (bx < cx ? bx : cx),
        y0 = ay < by ? (ay < cy ? ay : cy) : (by < cy ? by : cy),
        x1 = ax > bx ? (ax > cx ? ax : cx) : (bx > cx ? bx : cx),
        y1 = ay > by ? (ay > cy ? ay : cy) : (by > cy ? by : cy);

    // z-order range for the current triangle bbox;
    var minZ = zOrder(x0, y0, minX, minY, invSize),
        maxZ = zOrder(x1, y1, minX, minY, invSize);

    var p = ear.prevZ,
        n = ear.nextZ;

    // look for points inside the triangle in both directions
    while (p && p.z >= minZ && n && n.z <= maxZ) {
        if (p.x >= x0 && p.x <= x1 && p.y >= y0 && p.y <= y1 && p !== a && p !== c &&
            pointInTriangle(ax, ay, bx, by, cx, cy, p.x, p.y) && area(p.prev, p, p.next) >= 0) return false;
        p = p.prevZ;

        if (n.x >= x0 && n.x <= x1 && n.y >= y0 && n.y <= y1 && n !== a && n !== c &&
            pointInTriangle(ax, ay, bx, by, cx, cy, n.x, n.y) && area(n.prev, n, n.next) >= 0) return false;
        n = n.nextZ;
    }

    // look for remaining points in decreasing z-order
    while (p && p.z >= minZ) {
        if (p.x >= x0 && p.x <= x1 && p.y >= y0 && p.y <= y1 && p !== a && p !== c &&
            pointInTriangle(ax, ay, bx, by, cx, cy, p.x, p.y) && area(p.prev, p, p.next) >= 0) return false;
        p = p.prevZ;
    }

    // look for remaining points in increasing z-order
    while (n && n.z <= maxZ) {
        if (n.x >= x0 && n.x <= x1 && n.y >= y0 && n.y <= y1 && n !== a && n !== c &&
            pointInTriangle(ax, ay, bx, by, cx, cy, n.x, n.y) && area(n.prev, n, n.next) >= 0) return false;
        n = n.nextZ;
    }

    return true;
}

// go through all polygon nodes and cure small local self-intersections
function cureLocalIntersections(start, triangles, dim) {
    var p = start;
    do {
        var a = p.prev,
            b = p.next.next;

        if (!equals(a, b) && intersects(a, p, p.next, b) && locallyInside(a, b) && locallyInside(b, a)) {

            triangles.push(a.i / dim | 0);
            triangles.push(p.i / dim | 0);
            triangles.push(b.i / dim | 0);

            // remove two nodes involved
            removeNode(p);
            removeNode(p.next);

            p = start = b;
        }
        p = p.next;
    } while (p !== start);

    return filterPoints(p);
}

// try splitting polygon into two and triangulate them independently
function splitEarcut(start, triangles, dim, minX, minY, invSize) {
    // look for a valid diagonal that divides the polygon into two
    var a = start;
    do {
        var b = a.next.next;
        while (b !== a.prev) {
            if (a.i !== b.i && isValidDiagonal(a, b)) {
                // split the polygon in two by the diagonal
                var c = splitPolygon(a, b);

                // filter colinear points around the cuts
                a = filterPoints(a, a.next);
                c = filterPoints(c, c.next);

                // run earcut on each half
                earcutLinked(a, triangles, dim, minX, minY, invSize, 0);
                earcutLinked(c, triangles, dim, minX, minY, invSize, 0);
                return;
            }
            b = b.next;
        }
        a = a.next;
    } while (a !== start);
}

// link every hole into the outer loop, producing a single-ring polygon without holes
function eliminateHoles(data, holeIndices, outerNode, dim) {
    var queue = [],
        i, len, start, end, list;

    for (i = 0, len = holeIndices.length; i < len; i++) {
        start = holeIndices[i] * dim;
        end = i < len - 1 ? holeIndices[i + 1] * dim : data.length;
        list = linkedList(data, start, end, dim, false);
        if (list === list.next) list.steiner = true;
        queue.push(getLeftmost(list));
    }

    queue.sort(compareX);

    // process holes from left to right
    for (i = 0; i < queue.length; i++) {
        outerNode = eliminateHole(queue[i], outerNode);
    }

    return outerNode;
}

function compareX(a, b) {
    return a.x - b.x;
}

// find a bridge between vertices that connects hole with an outer ring and and link it
function eliminateHole(hole, outerNode) {
    var bridge = findHoleBridge(hole, outerNode);
    if (!bridge) {
        return outerNode;
    }

    var bridgeReverse = splitPolygon(bridge, hole);

    // filter collinear points around the cuts
    filterPoints(bridgeReverse, bridgeReverse.next);
    return filterPoints(bridge, bridge.next);
}

// David Eberly's algorithm for finding a bridge between hole and outer polygon
function findHoleBridge(hole, outerNode) {
    var p = outerNode,
        hx = hole.x,
        hy = hole.y,
        qx = -Infinity,
        m;

    // find a segment intersected by a ray from the hole's leftmost point to the left;
    // segment's endpoint with lesser x will be potential connection point
    do {
        if (hy <= p.y && hy >= p.next.y && p.next.y !== p.y) {
            var x = p.x + (hy - p.y) * (p.next.x - p.x) / (p.next.y - p.y);
            if (x <= hx && x > qx) {
                qx = x;
                m = p.x < p.next.x ? p : p.next;
                if (x === hx) return m; // hole touches outer segment; pick leftmost endpoint
            }
        }
        p = p.next;
    } while (p !== outerNode);

    if (!m) return null;

    // look for points inside the triangle of hole point, segment intersection and endpoint;
    // if there are no points found, we have a valid connection;
    // otherwise choose the point of the minimum angle with the ray as connection point

    var stop = m,
        mx = m.x,
        my = m.y,
        tanMin = Infinity,
        tan;

    p = m;

    do {
        if (hx >= p.x && p.x >= mx && hx !== p.x &&
                pointInTriangle(hy < my ? hx : qx, hy, mx, my, hy < my ? qx : hx, hy, p.x, p.y)) {

            tan = Math.abs(hy - p.y) / (hx - p.x); // tangential

            if (locallyInside(p, hole) &&
                (tan < tanMin || (tan === tanMin && (p.x > m.x || (p.x === m.x && sectorContainsSector(m, p)))))) {
                m = p;
                tanMin = tan;
            }
        }

        p = p.next;
    } while (p !== stop);

    return m;
}

// whether sector in vertex m contains sector in vertex p in the same coordinates
function sectorContainsSector(m, p) {
    return area(m.prev, m, p.prev) < 0 && area(p.next, m, m.next) < 0;
}

// interlink polygon nodes in z-order
function indexCurve(start, minX, minY, invSize) {
    var p = start;
    do {
        if (p.z === 0) p.z = zOrder(p.x, p.y, minX, minY, invSize);
        p.prevZ = p.prev;
        p.nextZ = p.next;
        p = p.next;
    } while (p !== start);

    p.prevZ.nextZ = null;
    p.prevZ = null;

    sortLinked(p);
}

// Simon Tatham's linked list merge sort algorithm
// http://www.chiark.greenend.org.uk/~sgtatham/algorithms/listsort.html
function sortLinked(list) {
    var i, p, q, e, tail, numMerges, pSize, qSize,
        inSize = 1;

    do {
        p = list;
        list = null;
        tail = null;
        numMerges = 0;

        while (p) {
            numMerges++;
            q = p;
            pSize = 0;
            for (i = 0; i < inSize; i++) {
                pSize++;
                q = q.nextZ;
                if (!q) break;
            }
            qSize = inSize;

            while (pSize > 0 || (qSize > 0 && q)) {

                if (pSize !== 0 && (qSize === 0 || !q || p.z <= q.z)) {
                    e = p;
                    p = p.nextZ;
                    pSize--;
                } else {
                    e = q;
                    q = q.nextZ;
                    qSize--;
                }

                if (tail) tail.nextZ = e;
                else list = e;

                e.prevZ = tail;
                tail = e;
            }

            p = q;
        }

        tail.nextZ = null;
        inSize *= 2;

    } while (numMerges > 1);

    return list;
}

// z-order of a point given coords and inverse of the longer side of data bbox
function zOrder(x, y, minX, minY, invSize) {
    // coords are transformed into non-negative 15-bit integer range
    x = (x - minX) * invSize | 0;
    y = (y - minY) * invSize | 0;

    x = (x | (x << 8)) & 0x00FF00FF;
    x = (x | (x << 4)) & 0x0F0F0F0F;
    x = (x | (x << 2)) & 0x33333333;
    x = (x | (x << 1)) & 0x55555555;

    y = (y | (y << 8)) & 0x00FF00FF;
    y = (y | (y << 4)) & 0x0F0F0F0F;
    y = (y | (y << 2)) & 0x33333333;
    y = (y | (y << 1)) & 0x55555555;

    return x | (y << 1);
}

// find the leftmost node of a polygon ring
function getLeftmost(start) {
    var p = start,
        leftmost = start;
    do {
        if (p.x < leftmost.x || (p.x === leftmost.x && p.y < leftmost.y)) leftmost = p;
        p = p.next;
    } while (p !== start);

    return leftmost;
}

// check if a point lies within a convex triangle
function pointInTriangle(ax, ay, bx, by, cx, cy, px, py) {
    return (cx - px) * (ay - py) >= (ax - px) * (cy - py) &&
           (ax - px) * (by - py) >= (bx - px) * (ay - py) &&
           (bx - px) * (cy - py) >= (cx - px) * (by - py);
}

// check if a diagonal between two polygon nodes is valid (lies in polygon interior)
function isValidDiagonal(a, b) {
    return a.next.i !== b.i && a.prev.i !== b.i && !intersectsPolygon(a, b) && // dones't intersect other edges
           (locallyInside(a, b) && locallyInside(b, a) && middleInside(a, b) && // locally visible
            (area(a.prev, a, b.prev) || area(a, b.prev, b)) || // does not create opposite-facing sectors
            equals(a, b) && area(a.prev, a, a.next) > 0 && area(b.prev, b, b.next) > 0); // special zero-length case
}

// signed area of a triangle
function area(p, q, r) {
    return (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
}

// check if two points are equal
function equals(p1, p2) {
    return p1.x === p2.x && p1.y === p2.y;
}

// check if two segments intersect
function intersects(p1, q1, p2, q2) {
    var o1 = sign(area(p1, q1, p2));
    var o2 = sign(area(p1, q1, q2));
    var o3 = sign(area(p2, q2, p1));
    var o4 = sign(area(p2, q2, q1));

    if (o1 !== o2 && o3 !== o4) return true; // general case

    if (o1 === 0 && onSegment(p1, p2, q1)) return true; // p1, q1 and p2 are collinear and p2 lies on p1q1
    if (o2 === 0 && onSegment(p1, q2, q1)) return true; // p1, q1 and q2 are collinear and q2 lies on p1q1
    if (o3 === 0 && onSegment(p2, p1, q2)) return true; // p2, q2 and p1 are collinear and p1 lies on p2q2
    if (o4 === 0 && onSegment(p2, q1, q2)) return true; // p2, q2 and q1 are collinear and q1 lies on p2q2

    return false;
}

// for collinear points p, q, r, check if point q lies on segment pr
function onSegment(p, q, r) {
    return q.x <= Math.max(p.x, r.x) && q.x >= Math.min(p.x, r.x) && q.y <= Math.max(p.y, r.y) && q.y >= Math.min(p.y, r.y);
}

function sign(num) {
    return num > 0 ? 1 : num < 0 ? -1 : 0;
}

// check if a polygon diagonal intersects any polygon segments
function intersectsPolygon(a, b) {
    var p = a;
    do {
        if (p.i !== a.i && p.next.i !== a.i && p.i !== b.i && p.next.i !== b.i &&
                intersects(p, p.next, a, b)) return true;
        p = p.next;
    } while (p !== a);

    return false;
}

// check if a polygon diagonal is locally inside the polygon
function locallyInside(a, b) {
    return area(a.prev, a, a.next) < 0 ?
        area(a, b, a.next) >= 0 && area(a, a.prev, b) >= 0 :
        area(a, b, a.prev) < 0 || area(a, a.next, b) < 0;
}

// check if the middle point of a polygon diagonal is inside the polygon
function middleInside(a, b) {
    var p = a,
        inside = false,
        px = (a.x + b.x) / 2,
        py = (a.y + b.y) / 2;
    do {
        if (((p.y > py) !== (p.next.y > py)) && p.next.y !== p.y &&
                (px < (p.next.x - p.x) * (py - p.y) / (p.next.y - p.y) + p.x))
            inside = !inside;
        p = p.next;
    } while (p !== a);

    return inside;
}

// link two polygon vertices with a bridge; if the vertices belong to the same ring, it splits polygon into two;
// if one belongs to the outer ring and another to a hole, it merges it into a single ring
function splitPolygon(a, b) {
    var a2 = new Node(a.i, a.x, a.y),
        b2 = new Node(b.i, b.x, b.y),
        an = a.next,
        bp = b.prev;

    a.next = b;
    b.prev = a;

    a2.next = an;
    an.prev = a2;

    b2.next = a2;
    a2.prev = b2;

    bp.next = b2;
    b2.prev = bp;

    return b2;
}

// create a node and optionally link it with previous one (in a circular doubly linked list)
function insertNode(i, x, y, last) {
    var p = new Node(i, x, y);

    if (!last) {
        p.prev = p;
        p.next = p;

    } else {
        p.next = last.next;
        p.prev = last;
        last.next.prev = p;
        last.next = p;
    }
    return p;
}

function removeNode(p) {
    p.next.prev = p.prev;
    p.prev.next = p.next;

    if (p.prevZ) p.prevZ.nextZ = p.nextZ;
    if (p.nextZ) p.nextZ.prevZ = p.prevZ;
}

function Node(i, x, y) {
    // vertex index in coordinates array
    this.i = i;

    // vertex coordinates
    this.x = x;
    this.y = y;

    // previous and next vertex nodes in a polygon ring
    this.prev = null;
    this.next = null;

    // z-order curve value
    this.z = 0;

    // previous and next nodes in z-order
    this.prevZ = null;
    this.nextZ = null;

    // indicates whether this is a steiner point
    this.steiner = false;
}

// return a percentage difference between the polygon area and its triangulation area;
// used to verify correctness of triangulation
earcut.deviation = function (data, holeIndices, dim, triangles) {
    var hasHoles = holeIndices && holeIndices.length;
    var outerLen = hasHoles ? holeIndices[0] * dim : data.length;

    var polygonArea = Math.abs(signedArea(data, 0, outerLen, dim));
    if (hasHoles) {
        for (var i = 0, len = holeIndices.length; i < len; i++) {
            var start = holeIndices[i] * dim;
            var end = i < len - 1 ? holeIndices[i + 1] * dim : data.length;
            polygonArea -= Math.abs(signedArea(data, start, end, dim));
        }
    }

    var trianglesArea = 0;
    for (i = 0; i < triangles.length; i += 3) {
        var a = triangles[i] * dim;
        var b = triangles[i + 1] * dim;
        var c = triangles[i + 2] * dim;
        trianglesArea += Math.abs(
            (data[a] - data[c]) * (data[b + 1] - data[a + 1]) -
            (data[a] - data[b]) * (data[c + 1] - data[a + 1]));
    }

    return polygonArea === 0 && trianglesArea === 0 ? 0 :
        Math.abs((trianglesArea - polygonArea) / polygonArea);
};

function signedArea(data, start, end, dim) {
    var sum = 0;
    for (var i = start, j = end - dim; i < end; i += dim) {
        sum += (data[j] - data[i]) * (data[i + 1] + data[j + 1]);
        j = i;
    }
    return sum;
}

// turn a polygon in a multi-dimensional array form (e.g. as in GeoJSON) into a form Earcut accepts
earcut.flatten = function (data) {
    var dim = data[0][0].length,
        result = {vertices: [], holes: [], dimensions: dim},
        holeIndex = 0;

    for (var i = 0; i < data.length; i++) {
        for (var j = 0; j < data[i].length; j++) {
            for (var d = 0; d < dim; d++) result.vertices.push(data[i][j][d]);
        }
        if (i > 0) {
            holeIndex += data[i - 1].length;
            result.holes.push(holeIndex);
        }
    }
    return result;
};

},{}]},{},[5]);
