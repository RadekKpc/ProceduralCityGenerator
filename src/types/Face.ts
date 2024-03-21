import earcut from 'earcut';
import { NextNodeIdGenerator, calculateIntersection, normalizeNumbers, randomlySelectElementFromProbabilityDistribution } from "../generator/utils";
import { StreetNode } from './StreetNode';
import { StreetEdge } from './StreetEdge';
import { Hierarchy, Point, StreetPattern, StreetStatus } from './BaseTypes';
import { CanvansDrawingEngine } from '..';
import SimulationConfiguration from '../simulationConfiguration';

export class Face {
    id: string;
    color: string;
    faceHierarchy: Hierarchy;
    isExpansionFinished = false;
    areaStreetPattern: StreetPattern = StreetPattern.Normal;

    boundaryNodes: StreetNode[]; // sorted in traversal path order | only needed to draw it properly (do not need to reflect real order)

    graph: { [nodeId: number]: { [nodeId: number]: StreetEdge } } = {};
    nodes: { [nodeId: number]: StreetNode } = {}; // used for sampling only (do not need order but need to have every node)
    streets: { [streetId: string]: StreetEdge } = {};
    clockwiseEdgesOrder: { [nodeId: number]: string[] } = {};

    subfacesDict: { [subfaceId: string]: Face } = {};

    traingles: [StreetNode, StreetNode, StreetNode][] = [];
    trainglesSurface: number[] = [];
    totalSurface: number = 0;

    constructor(boundaryNodes: StreetNode[], boundaryStreets: StreetEdge[], faceHierarchy: Hierarchy) {
        this.faceHierarchy = faceHierarchy;
        this.id = boundaryNodes.map(n => n.id).sort((id1, id2) => id1 - id2).join(':');
        this.boundaryNodes = boundaryNodes;

        for (const s of boundaryStreets) {
            this.addStreet(s)
        }

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

    calculateSubfaces(): { [subfaceId: string]: Face } {
        this.subfacesDict = {};

        for (let edge of Object.values(this.streets)) {

            let nextNode = edge.endNode;
            let currEdge = edge;

            const path = [edge];
            const pathNodes = [edge.startNode, edge.endNode];

            // this.canvansDrawingEngine?.drawEdge(edge, "blue");

            while (true) {

                // await this.wait(100);
                const nextEdgeId = this.getClockwiseMostNode(currEdge, nextNode);
                if (!nextEdgeId) break;

                currEdge = this.streets[nextEdgeId];
                // const randomColor = Math.floor(Math.random() * 16777215).toString(16);
                // this.canvansDrawingEngine?.drawEdge(currEdge, "#" + randomColor);

                nextNode = currEdge.startNode.id == nextNode.id ? currEdge.endNode : currEdge.startNode;

                if (nextNode.id != edge.startNode.id) {
                    pathNodes.push(nextNode);
                }

                path.push(currEdge);
                // cycle found
                if (nextNode.id == edge.startNode.id) {
                    if (path.every(s => s.hierarchy >= this.faceHierarchy)) break; // do not include outside cycle

                    const subface = new Face(pathNodes, path, this.faceHierarchy - 1 < 0 ? 0 : this.faceHierarchy - 1); // change it to block

                    if (!this.subfacesDict[subface.id]) {
                        this.subfacesDict[subface.id] = subface;
                    }

                    // this.canvansDrawingEngine?.fillCircle(pathNodes, 'orange');
                    break;
                }
            }

        }

        return this.subfacesDict;
    }
    async wait(ms: number) {
        return new Promise((res) => setTimeout(res, ms));
    }
    async splitOnLots() {

        let stack: Face[] = [];
        if(this.totalSurface > SimulationConfiguration.maxLotSurface)
        stack.push(this);

        while (stack.length > 0) {
            const lot = stack.pop()!;

            // CanvansDrawingEngine.drawFace(lot, 'pink')
            await this.wait(100)
            // CanvansDrawingEngine.redrawStreetGraph()
            let largestStreet = Object.values(lot.streets)[0];
            for (let s of Object.values(lot.streets)) {
                if (s.length() > largestStreet.length()) {
                    largestStreet = s;
                }
            }
            // console.log('largestStreet', largestStreet)

            const middle = largestStreet.middlePoint();

            const perpendicularLine = (x: number) => (largestStreet.endNode.position.x - largestStreet.startNode.position.x) * (middle.x - x) / (largestStreet.endNode.position.y - largestStreet.startNode.position.y) + middle.y;

            const perpendicularPointA = new Point(-100000, perpendicularLine(-100000));
            const perpendicularPointB = new Point(100000, perpendicularLine(100000));

            // console.log('streets length', Object.values(lot.streets).length)
            for (let s of Object.values(lot.streets)) {
                if (s.id != largestStreet.id) {
                    let corssingPoint = calculateIntersection(perpendicularPointA, perpendicularPointB, s.startNode.position, s.endNode.position);

                    if (corssingPoint) {
                        // await this.wait(100);
                        // CanvansDrawingEngine.drawPint(corssingPoint, 'pink')

                        // console.log('corssingPoint', corssingPoint);
                        const middleNode = new StreetNode(NextNodeIdGenerator.next(), middle, Hierarchy.Lot);
                        const newNode2 = new StreetNode(NextNodeIdGenerator.next(), corssingPoint, Hierarchy.Lot);

                        const part1Street = new StreetEdge(s.startNode, newNode2, s.hierarchy, s.width, s.status);
                        const part2Street = new StreetEdge(s.endNode, newNode2, s.hierarchy, s.width, s.status);
                        const newStreet = new StreetEdge(middleNode, newNode2, Hierarchy.Lot, 1, StreetStatus.Planned);

                        this.replaceStreet(s, [part1Street, part2Street, newStreet]);

                        const part1LargestStreet = new StreetEdge(largestStreet.startNode, middleNode, largestStreet.hierarchy, largestStreet.width, largestStreet.status);
                        const part2LargestStreet = new StreetEdge(largestStreet.endNode, middleNode, largestStreet.hierarchy, largestStreet.width, largestStreet.status);
                        this.replaceStreet(largestStreet, [part1LargestStreet, part2LargestStreet, newStreet]);

                        // CanvansDrawingEngine.drawEdge(newStreet, 'green')
                        // await this.wait(100);
                        // CanvansDrawingEngine.drawEdge(part1Street, 'red')
                        // await this.wait(100);
                        // CanvansDrawingEngine.drawEdge(part2Street, 'red')
                        // await this.wait(100);
                        // CanvansDrawingEngine.drawEdge(part1LargestStreet, 'purple')
                        // await this.wait(100);
                        // CanvansDrawingEngine.drawEdge(part2LargestStreet, 'purple')
                        // await this.wait(100);
                        // CanvansDrawingEngine.redrawStreetGraph()
                        // console.log('subfaces length before', Object.values(this.subfacesDict).length);
                        this.calculateSubfaces();

                        stack = Object.values(this.subfacesDict).filter(f => {
                            // console.log('total surface', f.totalSurface);
                            return f.totalSurface > SimulationConfiguration.maxLotSurface;
                        });
                        // console.log('subfaces length after', Object.values(this.subfacesDict).length);

                        // for (let lot of Object.values(this.subfacesDict)) {
                        //     if (!stack.some(s => s[0].id == lot.id)) {
                        //         stack.push([lot, depth + 1]);
                        //     }

                        //     // console.log(lot.id);
                        //     // console.log(lot);
                        // }
                        // for (let lot of Object.values(this.subfacesDict)) {
                            // console.log('split', lot.id);
                            // we split further => we need to remove parent
                            // await lot.splitOnLots(graph, depth + 1,);
                        // }
                        break;
                    }

                }
            }
            // console.log("no corsisng point")
        }

        return this.subfacesDict;
    }

    replaceStreet(streetToReplace: StreetEdge, newStreets: [StreetEdge, StreetEdge, StreetEdge]) {
        this.addStreet(newStreets[0]);
        this.addStreet(newStreets[1]);
        this.addStreet(newStreets[2]);
        this.removeStreet(streetToReplace);

        // const realtedLots = Object.values(this.subfacesDict).filter(l => l.streets[streetToReplace.id]);

        // // TODO: i dont know if that should be there
        // for (const l of realtedLots) {
        //     // third one can be only in one face, new street containes one new node and one existing, we check which face poses exists one
        //     if (Object.values(l.nodes).some((node) => newStreets[2].startNode.id == node.id) || Object.values(l.nodes).some((node) => newStreets[2].endNode.id == node.id)) {
        //         l.addStreet(newStreets[2]);
        //     }

        //     l.addStreet(newStreets[0]);
        //     l.addStreet(newStreets[1]);
        //     l.removeStreet(streetToReplace);
        // }
    }

    updateCloskwiseEdgesOrder(nodeId: number) {
        if (!this.clockwiseEdgesOrder[nodeId]) this.clockwiseEdgesOrder[nodeId] = [];

        this.clockwiseEdgesOrder[nodeId] = Object.values(this.graph[nodeId]).sort((street1: StreetEdge, street2: StreetEdge) => {
            const street1Angle = street1.startNode.id == nodeId ? street1.startNodeAngle : street1.endNodeAngle;
            const street2Angle = street2.startNode.id == nodeId ? street2.startNodeAngle : street2.endNodeAngle
            return street1Angle - street2Angle;
        }).map(street => street.id);
    }


    getClockwiseMostNode(edge: StreetEdge, currentNode: StreetNode, filter: (edgeId: string) => boolean = () => true) {
        const nodeValence = this.clockwiseEdgesOrder[currentNode.id].length;
        if (nodeValence == 1) return null;

        const filteredClockwiseOrder = this.clockwiseEdgesOrder[currentNode.id].filter(filter);
        if (filteredClockwiseOrder.length == 1) return null;

        const index = filteredClockwiseOrder.findIndex((id) => id == edge.id);
        return filteredClockwiseOrder[(index + 1) % filteredClockwiseOrder.length];
    }


    addStreet(street: StreetEdge) {
        const startNodeId = street.startNode.id;
        const endNodeId = street.endNode.id;

        // const startNodeDirection = new Point(street.startNode.position.x - street.endNode.position.x, street.startNode.position.y - street.endNode.position.y);
        // street.startNode.setDirection(startNodeDirection)

        // const endNodeDirection = new Point(street.endNode.position.x - street.startNode.position.x, street.endNode.position.y - street.startNode.position.y);
        // street.endNode.setDirection(endNodeDirection);
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


        if (this.streets[street.id]) {
            return;
        }

        if (!this.graph[startNodeId]) {
            this.graph[startNodeId] = {};
        }

        if (!this.graph[endNodeId]) {
            this.graph[endNodeId] = {};
        }


        if (!this.nodes[street.startNode.id]) {
            this.nodes[street.startNode.id] = street.startNode;
        };

        if (!this.nodes[street.endNode.id]) {
            this.nodes[street.endNode.id] = street.endNode;
        };

        this.graph[startNodeId][endNodeId] = street;
        this.graph[endNodeId][startNodeId] = street;
        this.streets[street.id] = street;

        this.updateCloskwiseEdgesOrder(startNodeId);
        this.updateCloskwiseEdgesOrder(endNodeId);
    }

    removeStreet(street: StreetEdge) {
        const startNodeId = street.startNode.id;
        const endNodeId = street.endNode.id;

        delete this.streets[street.id];
        delete this.graph[startNodeId][endNodeId];
        delete this.graph[endNodeId][startNodeId];
        // delete this.nodes[startNodeId];
        // delete this.nodes[endNodeId];

        this.updateCloskwiseEdgesOrder(startNodeId);
        this.updateCloskwiseEdgesOrder(endNodeId);


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
}