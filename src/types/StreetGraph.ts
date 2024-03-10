import { CanvasDrawingEngine } from "../drawingEngine/CanvasDrawingEngine";
import earcut from 'earcut';
import { normalizeNumbers, randomlySelectElementFromProbabilityDistribution } from "../generator/utils";

export enum Hierarchy {
    Minor,
    Major,
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
    traffic: number;
    direction: Point; // normalized vector
    leftDirection: Point; // normalized vector
    rightDirection: Point; // normalized vector
    hasFront: boolean;
    hasRight: boolean;
    hasLeft: boolean

    constructor(id: number, position: Point, hierarchy: Hierarchy) {
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

    setTraffic(traffic: number) {
        this.traffic = traffic;
    }

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
    hierarchy: Hierarchy;
    width: number;
    status: StreetStatus;

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


export class Face {
    id: string;
    path: string;
    nodes: StreetNode[];
    color: string;
    traingles: [StreetNode, StreetNode, StreetNode][] = [];
    trainglesSurface: number[] = [];
    totalSurface: number = 0;


    constructor(nodes: StreetNode[]) {
        const id = nodes.map(n => n.id).sort((id1, id2) => id1 - id2).join(':');
        this.id = id;
        this.path = nodes.map(n => n.id).join('_');
        this.nodes = nodes;

        const traingles = earcut(nodes.flatMap(node => [node.position.x, node.position.y]));

        for (let i = 0; i < traingles.length; i += 3) {
            const p1 = nodes[traingles[i]];
            const p2 = nodes[traingles[i + 1]];
            const p3 = nodes[traingles[i + 2]];
            this.traingles.push([p1, p2, p3]);
        }
        // [StreetNode, StreetNode, StreetNode]
        this.trainglesSurface = this.traingles.map(([p1, p2, p3]: [StreetNode, StreetNode, StreetNode]) => {
            const a = p1.position.distance(p2.position);
            const b = p1.position.distance(p3.position);
            const c = p2.position.distance(p3.position);
            return 0.25 * Math.sqrt((a + b + c) * ((-1) * a + b + c) * ((-1) * b + a + c) * ((-1) * c + a + b)); // Heron's formula
        });

        this.totalSurface = this.trainglesSurface.reduce((a, b) => a + b, 0);

        const randomColor = Math.floor(Math.random() * 128 + 128).toString(16);
        this.color = "#00" + randomColor + "00";
    }

    getRandomPointFromFace(): Point {
        // select random traingle from face weighted by surface
        const normalizedSurfaceRations = normalizeNumbers(this.trainglesSurface.map(surface => surface / this.totalSurface));
        let traingleIndex = randomlySelectElementFromProbabilityDistribution(normalizedSurfaceRations);
        traingleIndex = traingleIndex == -1 ? 0 : traingleIndex;
        const selectedTraingle = this.traingles[traingleIndex]

        // find random point in the selected traingle
        // https://math.stackexchange.com/questions/18686/uniform-random-point-in-triangle-in-3d
        const r1 = Math.random();
        const r2 = Math.random();
        const sqrt_r1 = Math.sqrt(r1);

        const A = selectedTraingle[0].position.scalarMultiply(1 - sqrt_r1);
        const B = selectedTraingle[1].position.scalarMultiply(sqrt_r1 * (1 - r2));
        const C = selectedTraingle[2].position.scalarMultiply(r2 * sqrt_r1);

        return A.vectorAdd(B).vectorAdd(C);
    }
}


export class StreetGraph {

    edges: StreetEdge[];
    edgesDict: { [edgeId: string]: StreetEdge };

    nodes: StreetNode[];
    graph: { [nodeId: number]: { [nodeId: number]: StreetEdge } };
    clockwiseEdgesOrder: { [nodeId: number]: string[] };

    facesDict: { [faceId: string]: Face };
    facesList: Face[];

    newPoints: Point[];
    valence2edges: number;
    valence3edges: number;
    valence4edges: number;

    nodesIds: number = 100;
    canvansDrawingEngine: CanvasDrawingEngine | null;
    trainglesToDraw: StreetNode[][] = [];
    pointsToDraw: Point[] = [];

    constructor() {
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

    setCanvansDrawingEngine(canvansDrawingEngine: CanvasDrawingEngine) {
        this.canvansDrawingEngine = canvansDrawingEngine;
    }

    addStreet(street: StreetEdge) {

        const startNodeId = street.startNode.id;
        const endNodeId = street.endNode.id;

        if (this.edgesDict[street.id]) {
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
        this.edges.push(street);
        this.edgesDict[street.id] = street;

        // update clockwiseEdgesOrder
        if (!this.clockwiseEdgesOrder[startNodeId]) this.clockwiseEdgesOrder[startNodeId] = [];
        if (!this.clockwiseEdgesOrder[endNodeId]) this.clockwiseEdgesOrder[endNodeId] = [];

        this.updateCloskwiseEdgesOrder(startNodeId);
        this.updateCloskwiseEdgesOrder(endNodeId);
    }

    updateCloskwiseEdgesOrder(nodeId: number) {
        this.clockwiseEdgesOrder[nodeId] = Object.values(this.graph[nodeId]).sort((street1: StreetEdge, street2: StreetEdge) => {
            const street1Angle = street1.startNode.id == nodeId ? street1.startNodeAngle : street1.endNodeAngle;
            const street2Angle = street2.startNode.id == nodeId ? street2.startNodeAngle : street2.endNodeAngle
            return street1Angle - street2Angle;
        }).map(street => street.id);
    }

    // add logic for updateCloskwiseorder
    removeStreet(street: StreetEdge) {
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
    async calcualteFaces() {
        this.facesList = [];

        for (let edge of this.edges) {

            let nextNode = edge.endNode;
            let currEdge = edge;

            const path = [edge];
            const pathNodes = [edge.startNode, edge.endNode];

            // this.canvansDrawingEngine?.drawEdge(edge, "blue");

            while (true) {

                // await this.wait(100);

                const nextEdgeId = this.getClockwiseMostNode(currEdge, nextNode);
                if (!nextEdgeId) break;

                currEdge = this.edgesDict[nextEdgeId];
                // const randomColor = Math.floor(Math.random() * 16777215).toString(16);
                // this.canvansDrawingEngine?.drawEdge(currEdge, "#" + randomColor);

                nextNode = currEdge.startNode.id == nextNode.id ? currEdge.endNode : currEdge.startNode;

                if (nextNode.id != edge.startNode.id) {
                    pathNodes.push(nextNode);
                }

                path.push(currEdge);
                // cycle found
                if (nextNode.id == edge.startNode.id) {
                    const face = new Face(pathNodes);

                    if (!this.facesDict[face.id]) {
                        this.facesDict[face.id] = face;
                        this.facesList.push(face);
                    }

                    // this.canvansDrawingEngine?.fillCircle(pathNodes, 'orange');
                    break;
                }
            }

        }

        // for (let edge of this.edges) {

        //     // await this.wait(100);
        //     let nextNode = edge.endNode;
        //     let currEdge = edge;

        //     const path = [edge];
        //     const pathNodes = [edge.startNode, edge.endNode];

        //     // this.canvansDrawingEngine?.drawEdge(edge, "blue");

        //     while (true) {

        //         const nextEdgeId = this.getCounterclockwiseMostNode(currEdge, nextNode);
        //         if (!nextEdgeId) break;

        //         currEdge = this.edgesDict[nextEdgeId];
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

    async calcualteFace(edgeId: string) {

        const edge = this.edgesDict[edgeId];
        if (!edge) return;

        let nextNode = edge.endNode;
        let currEdge = edge;

        const path = [edge];
        const pathNodes = [edge.startNode, edge.endNode];

        this.canvansDrawingEngine?.drawEdge(edge, "blue");

        while (true) {

            await this.wait(100);
            const nextEdgeId = this.getClockwiseMostNode(currEdge, nextNode);
            if (!nextEdgeId) break;

            currEdge = this.edgesDict[nextEdgeId];
            const randomColor = Math.floor(Math.random() * 16777215).toString(16);
            this.canvansDrawingEngine?.drawEdge(currEdge, "#" + randomColor);

            nextNode = currEdge.startNode.id == nextNode.id ? currEdge.endNode : currEdge.startNode;

            pathNodes.push(nextNode);
            path.push(currEdge);

            if (nextNode.id == edge.startNode.id) {
                const face = new Face(pathNodes);
                this.facesList.push(face);
                if (!this.facesDict[face.id]) this.facesDict[face.id] = face;
                this.canvansDrawingEngine?.fillCircle(pathNodes, 'orange');
                break;
            }
        }

        while (true) {

            await this.wait(100);
            const nextEdgeId = this.getCounterclockwiseMostNode(currEdge, nextNode);
            if (!nextEdgeId) break;

            currEdge = this.edgesDict[nextEdgeId];
            const randomColor = Math.floor(Math.random() * 16777215).toString(16);
            this.canvansDrawingEngine?.drawEdge(currEdge, "#" + randomColor);

            nextNode = currEdge.startNode.id == nextNode.id ? currEdge.endNode : currEdge.startNode;

            pathNodes.push(nextNode);
            path.push(currEdge);

            if (nextNode.id == edge.startNode.id) {
                const face = new Face(pathNodes);
                this.facesList.push(face);
                if (!this.facesDict[face.id]) this.facesDict[face.id] = face;
                this.canvansDrawingEngine?.fillCircle(pathNodes, 'orange');
                break;
            }
        }
    }

    getClockwiseMostNode(edge: StreetEdge, currentNode: StreetNode) {
        const nodeValence = this.clockwiseEdgesOrder[currentNode.id].length;
        if (nodeValence == 1) return null;
        const index = this.clockwiseEdgesOrder[currentNode.id].findIndex((id) => id == edge.id);
        return this.clockwiseEdgesOrder[currentNode.id][index == nodeValence - 1 ? 0 : index + 1];
    }

    getCounterclockwiseMostNode(edge: StreetEdge, currentNode: StreetNode) {
        const nodeValence = this.clockwiseEdgesOrder[currentNode.id].length;
        if (nodeValence == 1) return null;
        const index = this.clockwiseEdgesOrder[currentNode.id].findIndex((id) => id == edge.id);
        return this.clockwiseEdgesOrder[currentNode.id][index == 0 ? nodeValence - 1 : index - 1];
    }
}
