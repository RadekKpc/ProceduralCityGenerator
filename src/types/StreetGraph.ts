import { CanvasDrawingEngine } from "../drawingEngine/CanvasDrawingEngine";
import earcut from 'earcut';
import { normalizeNumbers, randomlySelectElementFromProbabilityDistribution } from "../generator/utils";

export enum Hierarchy {
    Minor,
    Major,
}

export enum StreetPattern {
    Normal,
    Grid,
    Round,
}

export enum StreetStatus {
    Build,
    Planned
}

export class Point {

    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    distance(a: Point) {
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

    vectorMultiply(vector: Point): Point {
        return new Point(this.x * vector.x, this.y * vector.y);
    }

    scalarMultiplyVector(vector: Point): number {
        return this.x * vector.x - this.y * vector.y;
    }

    getAngle(vector: Point): number {
        const isConvexWithPerpendicularly = this.turnRight().scalarMultiplyVector(vector) >= 0;
        const angle = Math.acos(((this.x * vector.x) + (this.y * vector.y)) / (this.length() * vector.length()));
        if (isConvexWithPerpendicularly) return angle;
        return 2 * Math.PI - angle;
    }

    vectorAdd(vector: Point): Point {
        return new Point(this.x + vector.x, this.y + vector.y)
    }

    vectorSubstract(vector: Point): Point {
        return new Point(this.x - vector.x, this.y - vector.y)
    }

    reverse() {
        return new Point((-1) * this.x, (-1) * this.y);
    }

    scalarMultiply(a: number): Point {
        return new Point(this.x * a, this.y * a)
    }

    turnLeft(): Point {
        return new Point(this.y * (-1), this.x);
    }

    turnRight(): Point {
        return new Point(this.y, this.x * (-1));
    }

    transpose() {
        return new Point(this.y, this.x)
    }
    rotate(angleInRadian: number): Point {
        const x2 = Math.cos(angleInRadian) * this.x - Math.sin(angleInRadian) * this.y;
        const y2 = Math.sin(angleInRadian) * this.x + Math.cos(angleInRadian) * this.y;
        return new Point(x2, y2);
    }
}

export class StreetNode {

    id: number;
    position: Point;
    hierarchy: Hierarchy;
    isGrowthing: boolean;
    direction: Point; // normalized vector
    leftDirection: Point; // normalized vector
    rightDirection: Point; // normalized vector
    hasFront: boolean;
    hasRight: boolean;
    hasLeft: boolean
    // traffic: number;

    constructor(id: number, position: Point, hierarchy: Hierarchy) {
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

    setDirection(directionVector: Point) {
        this.direction = directionVector;
        this.direction.normalize();
        this.leftDirection = this.direction.turnLeft();
        this.rightDirection = this.direction.turnRight();
    }

    setPosition(newPosition: Point) {
        this.position = newPosition;
    }

}

export class StreetEdge {

    id: string;
    startNode: StreetNode;
    endNode: StreetNode;

    width: number;
    status: StreetStatus;
    hierarchy: Hierarchy;

    startNodeAngle: number;
    endNodeAngle: number;

    constructor(startNode: StreetNode, endNode: StreetNode, hierarchy: Hierarchy, width: number, status: StreetStatus) {
        this.startNode = startNode;
        this.endNode = endNode;
        this.hierarchy = hierarchy;
        this.width = width;
        this.status = status;
        this.id = startNode.id < endNode.id ? startNode.id + ":" + endNode.id : endNode.id + ":" + startNode.id;
        this.startNodeAngle = new Point(0, 1).getAngle(endNode.position.vectorSubstract(startNode.position));
        this.endNodeAngle = new Point(0, 1).getAngle(startNode.position.vectorSubstract(endNode.position));
    }

    setStartNode(node: StreetNode) {
        this.startNode = node;
        this.startNodeAngle = new Point(0, 1).getAngle(this.endNode.position.vectorSubstract(this.startNode.position));
        this.endNodeAngle = new Point(0, 1).getAngle(this.startNode.position.vectorSubstract(this.endNode.position));
        this.id = this.startNode.id < this.endNode.id ? this.startNode.id + ":" + this.endNode.id : this.endNode.id + ":" + this.startNode.id;
    }

    setEndNode(node: StreetNode) {
        this.endNode = node;
        this.startNodeAngle = new Point(0, 1).getAngle(this.endNode.position.vectorSubstract(this.startNode.position));
        this.endNodeAngle = new Point(0, 1).getAngle(this.startNode.position.vectorSubstract(this.endNode.position));
        this.id = this.startNode.id < this.endNode.id ? this.startNode.id + ":" + this.endNode.id : this.endNode.id + ":" + this.startNode.id;
    }

    length() {
        return this.endNode.position.distance(this.startNode.position);
    }
}

abstract class PlanarGraph {

}

export class Face {
    id: string;

    boundaryNodes: StreetNode[]; // sorted in traversal path order | only needed to draw it properly (do not need to reflect real order)

    nodes: StreetNode[] = []; // used for sampling only (do not need order but need to have every node)
    streets: StreetEdge[] = [];

    blocks: Face[] = [];

    traingles: [StreetNode, StreetNode, StreetNode][] = [];
    trainglesSurface: number[] = [];
    totalSurface: number = 0;

    color: string;
    isExpansionFinished = false;
    areaStreetPattern: StreetPattern = StreetPattern.Normal;

    constructor(boundaryNodes: StreetNode[], boundaryStreets: StreetEdge[]) {
        this.id = boundaryNodes.map(n => n.id).sort((id1, id2) => id1 - id2).join(':');
        this.boundaryNodes = boundaryNodes;
        this.nodes = [...boundaryNodes];
        this.streets = [...boundaryStreets];

        const traingles = earcut(boundaryNodes.flatMap(node => [node.position.x, node.position.y]));

        for (let i = 0; i < traingles.length; i += 3) {
            const p1 = boundaryNodes[traingles[i]];
            const p2 = boundaryNodes[traingles[i + 1]];
            const p3 = boundaryNodes[traingles[i + 2]];
            this.traingles.push([p1, p2, p3]);
        }

        this.trainglesSurface = this.traingles.map(([p1, p2, p3]: [StreetNode, StreetNode, StreetNode]) => {
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

    getRandomPointInTriangle(selectedTraingle: [StreetNode, StreetNode, StreetNode]): Point {
        const r1 = Math.random();
        const r2 = Math.random();
        const sqrt_r1 = Math.sqrt(r1);

        const A = selectedTraingle[0].position.scalarMultiply(1 - sqrt_r1);
        const B = selectedTraingle[1].position.scalarMultiply(sqrt_r1 * (1 - r2));
        const C = selectedTraingle[2].position.scalarMultiply(r2 * sqrt_r1);

        return A.vectorAdd(B).vectorAdd(C);

    }

    getRandomPointFromFace(): Point {
        // select random traingle from face weighted by surface
        const normalizedSurfaceRations = normalizeNumbers(this.trainglesSurface.map(surface => surface / this.totalSurface));
        let traingleIndex = randomlySelectElementFromProbabilityDistribution(normalizedSurfaceRations);
        traingleIndex = traingleIndex == -1 ? 0 : traingleIndex;
        const selectedTraingle = this.traingles[traingleIndex]

        // find random point in the selected traingle
        // https://math.stackexchange.com/questions/18686/uniform-random-point-in-triangle-in-3d
        return this.getRandomPointInTriangle(selectedTraingle);
    }

    getRandomTwoPoinsInTraingle(): [Point, Point] {
        // select random traingle from face weighted by surface
        const normalizedSurfaceRations = normalizeNumbers(this.trainglesSurface.map(surface => surface / this.totalSurface));
        let traingleIndex = randomlySelectElementFromProbabilityDistribution(normalizedSurfaceRations);
        traingleIndex = traingleIndex == -1 ? 0 : traingleIndex;
        const selectedTraingle = this.traingles[traingleIndex]

        // find random  two points in the selected traingle
        // https://math.stackexchange.com/questions/18686/uniform-random-point-in-triangle-in-3d

        const p1 = this.getRandomPointInTriangle(selectedTraingle);
        const p2 = this.getRandomPointInTriangle(selectedTraingle);

        return [p1, p2];
    }

    _sign(p1: Point, p2: Point, p3: Point) {
        return ((p1.x - p3.x) * (p2.y - p3.y)) - ((p2.x - p3.x) * (p1.y - p3.y));
    }

    isInTriangle(traingle: [StreetNode, StreetNode, StreetNode], p: Point) {
        const [v1, v2, v3] = traingle.map(n => n.position);

        let d1, d2, d3;
        let has_neg, has_pos;

        d1 = this._sign(p, v1, v2);
        d2 = this._sign(p, v2, v3);
        d3 = this._sign(p, v3, v1);

        has_neg = (d1 < 0) || (d2 < 0) || (d3 < 0);
        has_pos = (d1 > 0) || (d2 > 0) || (d3 > 0);

        return !(has_neg && has_pos);

    }

    addStreet(street: StreetEdge) {
        // boundary street
        // if (street.startNode.hierarchy == Hierarchy.Major && street.endNode.hierarchy == Hierarchy.Major) {
        //     if (!this.boundaryStreets.some(s => s.id == street.id)) {
        //         this.boundaryStreets.push(street);
        //     };
        // }

        // we dnot need to add new node here (as it can be only from spliting and we still can fill polygon with old data)

        // if (street.startNode.hierarchy == Hierarchy.Major) {
        //     if (!this.boundaryNodes.some(n => n.id == street.startNode.id)) {
        //         this.boundaryNodes.push(street.startNode); // put in proper place
        //     };
        // }
        // if (street.endNode.hierarchy == Hierarchy.Major) {
        //     if (!this.boundaryNodes.some(n => n.id == street.endNode.id)) {
        //         this.boundaryNodes.push(street.endNode); // put in proper place
        //     };
        // }

        if (!this.streets.some(s => s.id == street.id)) {
            this.streets.push(street);
        };

        if (!this.nodes.some(n => n.id == street.startNode.id)) {
            this.nodes.push(street.startNode);
        };

        if (!this.nodes.some(n => n.id == street.endNode.id)) {
            this.nodes.push(street.endNode);
        };

    }

    removeStreet(street: StreetEdge) {
        const startNodeId = street.startNode.id;
        const endNodeId = street.endNode.id;

        const streetToRemoveIndex = this.streets.findIndex(s => s.id == street.id);
        if (streetToRemoveIndex > -1) {
            this.streets.splice(streetToRemoveIndex, 1);
        }

        const startNodeToRemove = this.nodes.findIndex(n => n.id == startNodeId);
        if (startNodeToRemove > -1 && !this.streets.some(s => s.startNode.id == startNodeId || s.endNode.id == startNodeId)) {
            this.nodes.splice(startNodeToRemove, 1);
        }

        const endNodeToRemove = this.nodes.findIndex(n => n.id == endNodeId);
        if (endNodeToRemove > -1 && !this.streets.some(s => s.startNode.id == endNodeId || s.endNode.id == endNodeId)) {
            this.nodes.splice(endNodeToRemove, 1);
        }

        // we dont need to remove here (as it can be only from spliting and we stil can fill polygon with old data)
        // const startNodeToRemoveBoundary = this.boundaryNodes.findIndex(n => n.id == startNodeId);
        // if (startNodeToRemove > -1) {
        //     this.boundaryNodes.splice(startNodeToRemoveBoundary, 1);
        // }

        // const endNodeToRemoveBoundary = this.boundaryNodes.findIndex(n => n.id == endNodeId);
        // if (endNodeToRemove > -1) {
        //     this.boundaryNodes.splice(endNodeToRemoveBoundary, 1);
        // }

    }

}

class Block extends Face {

}

export class StreetGraph {

    edges: { [edgeId: string]: StreetEdge };

    nodes: StreetNode[];
    graph: { [nodeId: number]: { [nodeId: number]: StreetEdge } };
    clockwiseEdgesOrder: { [nodeId: number]: string[] };

    facesDict: { [faceId: string]: Face };
    facesList: Face[];

    blocksDict: { [blockId: string]: Face } = {};
    blocksList: Face[] = [];

    newPoints: Point[];
    valence2edges: number;
    valence3edges: number;
    valence4edges: number;

    nodesIds: number = 100;
    canvansDrawingEngine: CanvasDrawingEngine | null;
    trainglesToDraw: StreetNode[][] = [];
    pointsToDraw: Point[] = [];

    getEdges() {
        return Object.values(this.edges)
    }

    constructor() {
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

    setCanvansDrawingEngine(canvansDrawingEngine: CanvasDrawingEngine) {
        this.canvansDrawingEngine = canvansDrawingEngine;
    }

    addStreet(street: StreetEdge) {

        const startNodeId = street.startNode.id;
        const endNodeId = street.endNode.id;

        if (this.edges[street.id]) {
            return;
        }

        if (!this.graph[startNodeId]) {
            this.nodes.push(street.startNode);
            this.graph[startNodeId] = {};

            const nodeDirection = new Point(street.startNode.position.x - street.endNode.position.x, street.startNode.position.y - street.endNode.position.y);
            street.startNode.setDirection(nodeDirection)
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
        if (!this.clockwiseEdgesOrder[startNodeId]) this.clockwiseEdgesOrder[startNodeId] = [];
        if (!this.clockwiseEdgesOrder[endNodeId]) this.clockwiseEdgesOrder[endNodeId] = [];

        this.updateCloskwiseEdgesOrder(startNodeId);
        this.updateCloskwiseEdgesOrder(endNodeId);
    }

    addMinorStreet(street: StreetEdge, face: Face) {
        this.addStreet(street);
        face.addStreet(street);
    }

    replaceStreet(streetToReplace: StreetEdge, newStreets: [StreetEdge, StreetEdge, StreetEdge]) {

        const realtedFaces = this.facesList.filter(f => f.streets.some(s => s.id == streetToReplace.id));

        this.addStreet(newStreets[0]);
        this.addStreet(newStreets[1]);
        this.addStreet(newStreets[2]);
        this._removeStreet(streetToReplace);

        for (const f of realtedFaces) {
            // third one can be only in one face, new street containes one new node and one existing, we check which face poses exists one
            if (f.nodes.some((node) => newStreets[2].startNode.id == node.id) || f.nodes.some((node) => newStreets[2].endNode.id == node.id)) {
                f.addStreet(newStreets[2]);
            }

            f.addStreet(newStreets[0]);
            f.addStreet(newStreets[1]);
            f.removeStreet(streetToReplace);
        }
    }


    updateCloskwiseEdgesOrder(nodeId: number) {
        this.clockwiseEdgesOrder[nodeId] = Object.values(this.graph[nodeId]).sort((street1: StreetEdge, street2: StreetEdge) => {
            const street1Angle = street1.startNode.id == nodeId ? street1.startNodeAngle : street1.endNodeAngle;
            const street2Angle = street2.startNode.id == nodeId ? street2.startNodeAngle : street2.endNodeAngle
            return street1Angle - street2Angle;
        }).map(street => street.id);
    }

    // add logic for updateCloskwiseorder
    _removeStreet(street: StreetEdge) {
        const startNodeId = street.startNode.id;
        const endNodeId = street.endNode.id;

        delete this.graph[startNodeId][endNodeId];
        delete this.graph[endNodeId][startNodeId];
        delete this.edges[street.id];

        this.updateCloskwiseEdgesOrder(startNodeId);
        this.updateCloskwiseEdgesOrder(endNodeId);
    }

    getNodeValence(node: StreetNode) {
        if (!this.graph[node.id]) throw new Error('Node do not belongs to street graph');
        return Object.values(this.graph[node.id]).length;
    }

    addNewPoint(point: Point) {
        this.newPoints.push(point);
    }

    clearNewPoints() {
        this.newPoints = [];
    }

    getValenceDistribution() {
        const valenceDistributon: { [key: string]: number } = {
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

    async wait(ms: number) {
        return new Promise((res) => setTimeout(res, ms));
    }

    // clockvice travesal describe algorithm in thesis
    calculateFaces() {
        this.facesList = [];
        this.facesDict = {};

        for (let edge of this.getEdges()) {

            let nextNode = edge.endNode;
            let currEdge = edge;

            const path = [edge];
            const pathNodes = [edge.startNode, edge.endNode];

            // this.canvansDrawingEngine?.drawEdge(edge, "blue");

            while (true) {

                // await this.wait(100);

                const nextEdgeId = this.getClockwiseMostNode(currEdge, nextNode);
                if (!nextEdgeId) break;

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
    }

    // TMP
    calculateFace(edgeId: string) {

        const edge = this.edges[edgeId];
        if (!edge) return;

        let nextNode = edge.endNode;
        let currEdge = edge;

        const path = [edge];
        const pathNodes = [edge.startNode, edge.endNode];

        this.canvansDrawingEngine?.drawEdge(edge, "blue");

        while (true) {

            // await this.wait(100);
            const nextEdgeId = this.getClockwiseMostNode(currEdge, nextNode);
            if (!nextEdgeId) break;

            currEdge = this.edges[nextEdgeId];
            const randomColor = Math.floor(Math.random() * 16777215).toString(16);
            this.canvansDrawingEngine?.drawEdge(currEdge, "#" + randomColor);

            nextNode = currEdge.startNode.id == nextNode.id ? currEdge.endNode : currEdge.startNode;

            pathNodes.push(nextNode);
            path.push(currEdge);

            if (nextNode.id == edge.startNode.id) {
                const face = new Face(pathNodes, path);
                this.facesList.push(face);
                if (!this.facesDict[face.id]) this.facesDict[face.id] = face;
                this.canvansDrawingEngine?.fillCircle(pathNodes, 'orange');
                break;
            }
        }

        while (true) {

            // await this.wait(100);
            const nextEdgeId = this.getCounterclockwiseMostNode(currEdge, nextNode);
            if (!nextEdgeId) break;

            currEdge = this.edges[nextEdgeId];
            const randomColor = Math.floor(Math.random() * 16777215).toString(16);
            this.canvansDrawingEngine?.drawEdge(currEdge, "#" + randomColor);

            nextNode = currEdge.startNode.id == nextNode.id ? currEdge.endNode : currEdge.startNode;

            pathNodes.push(nextNode);
            path.push(currEdge);

            if (nextNode.id == edge.startNode.id) {
                const face = new Face(pathNodes, path);
                this.facesList.push(face);
                if (!this.facesDict[face.id]) this.facesDict[face.id] = face;
                this.canvansDrawingEngine?.fillCircle(pathNodes, 'orange');
                break;
            }
        }
    }

    extractBlocksFromFaces() {
        this.blocksList = [];
        this.blocksDict = {};

        for (let face of this.facesList) {
            face.blocks = [];

            for (let edge of face.streets) {

                let nextNode = edge.endNode;
                let currEdge = edge;

                const path = [edge];
                const pathNodes = [edge.startNode, edge.endNode];

                // this.canvansDrawingEngine?.drawEdge(edge, "blue");

                while (true) {

                    // await this.wait(100);

                    const nextEdgeId = this.getClockwiseMostNode(currEdge, nextNode, (edgeId: string) => face.streets.some(s => s.id == edgeId));
                    if (!nextEdgeId) break;

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
                        if (path.every(s => s.hierarchy == Hierarchy.Major)) break; // do not include outside cycle
                        const face = new Face(pathNodes, path);

                        if (!this.blocksDict[face.id]) {
                            this.blocksDict[face.id] = face;
                            this.blocksList.push(face);
                        }

                        face.blocks.push(face);
                        // this.canvansDrawingEngine?.fillCircle(pathNodes, 'orange');
                        break;
                    }
                }

            }
        }
    }

    // TMP
    extractBlockFromFace(i: number | Face, howfast = 1) {
        let face: Face;
        if (typeof i == "number") {
            face = this.facesList[i % this.facesList.length];
        } else {
            face = i;
        }

        face.blocks = [];
        this.blocksList = [];
        this.blocksDict = {};

        for (let edge of face.streets) {

            let nextNode = edge.endNode;
            let currEdge = edge;

            const path = [edge];
            const pathNodes = [edge.startNode, edge.endNode];

            this.canvansDrawingEngine?.drawEdge(edge, "blue");

            while (true) {

                const nextEdgeId = this.getClockwiseMostNode(currEdge, nextNode, (edgeId: string) => face.streets.some(s => s.id == edgeId));

                if (!nextEdgeId) break;

                currEdge = this.edges[nextEdgeId];
                const randomColor = Math.floor(Math.random() * 16777215).toString(16);
                this.canvansDrawingEngine?.drawEdge(currEdge, "#" + randomColor);

                nextNode = currEdge.startNode.id == nextNode.id ? currEdge.endNode : currEdge.startNode;

                if (nextNode.id != edge.startNode.id) {
                    pathNodes.push(nextNode);
                }

                path.push(currEdge);

                // cycle found
                if (nextNode.id == edge.startNode.id) {
                    const face = new Face(pathNodes, path);
                    if (!this.blocksDict[face.id]) {
                        this.blocksDict[face.id] = face;
                        this.blocksList.push(face);
                    }

                    face.blocks.push(face);
                    this.canvansDrawingEngine?.fillCircle(pathNodes, 'orange');
                    break;
                }
            }
        }

    }

    // TMP
    extractBlockFromFaceEdge(face: Face, edge: StreetEdge) {

        this.blocksList = [];
        this.blocksDict = {};

        let nextNode = edge.endNode;
        let currEdge = edge;

        const path = [edge];
        const pathNodes = [edge.startNode, edge.endNode];


        while (true) {

            const nextEdgeId = this.getClockwiseMostNode(currEdge, nextNode, (edgeId: string) => face.streets.some(s => s.id == edgeId));

            if (!nextEdgeId) break;

            currEdge = this.edges[nextEdgeId];
            const randomColor = Math.floor(Math.random() * 16777215).toString(16);
            this.canvansDrawingEngine?.drawEdge(currEdge, "#" + randomColor);

            nextNode = currEdge.startNode.id == nextNode.id ? currEdge.endNode : currEdge.startNode;

            if (nextNode.id != edge.startNode.id) {
                pathNodes.push(nextNode);
            }

            path.push(currEdge);
            // cycle found
            if (nextNode.id == edge.startNode.id) {
                const face = new Face(pathNodes, path);
                if (!this.blocksDict[face.id]) {
                    this.blocksDict[face.id] = face;
                    this.blocksList.push(face);
                }

                face.blocks.push(face);
                this.canvansDrawingEngine?.fillCircle(pathNodes, 'orange');
                break;
            }
        }
    }

    getClockwiseMostNode(edge: StreetEdge, currentNode: StreetNode, filter: (edgeId: string) => boolean = () => true) {
        const nodeValence = this.clockwiseEdgesOrder[currentNode.id].length;
        if (nodeValence == 1) return null;

        const filteredClockwiseOrder = this.clockwiseEdgesOrder[currentNode.id].filter(filter);
        if (filteredClockwiseOrder.length == 1) return null;

        const index = filteredClockwiseOrder.findIndex((id) => id == edge.id);
        return filteredClockwiseOrder[(index + 1) % filteredClockwiseOrder.length];
    }

    getCounterclockwiseMostNode(edge: StreetEdge, currentNode: StreetNode, filter: (edgeId: string) => boolean = () => true) {
        const nodeValence = this.clockwiseEdgesOrder[currentNode.id].length;
        if (nodeValence == 1) return null;

        const filteredClockwiseOrder = this.clockwiseEdgesOrder[currentNode.id].filter(filter);
        if (filteredClockwiseOrder.length == 1) return null;
        const index = filteredClockwiseOrder.findIndex((id) => id == edge.id);
        return this.clockwiseEdgesOrder[currentNode.id][index == 0 ? filteredClockwiseOrder.length - 1 : index - 1];
    }
}
