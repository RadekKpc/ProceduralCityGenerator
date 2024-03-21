import { Face } from "./Face";
import { Block, Lot } from './Block';
import { StreetEdge } from "./StreetEdge";
import { StreetNode } from "./StreetNode";
import { Hierarchy, Point } from "./BaseTypes";

export class StreetGraph {

    // primitives
    graph: { [nodeId: number]: { [nodeId: number]: StreetEdge } } = {};
    edges: { [edgeId: string]: StreetEdge } = {};
    nodes: StreetNode[] = [];
    clockwiseEdgesOrder: { [nodeId: number]: string[] } = {};

    // surfaces
    facesDict: { [faceId: string]: Face } = {};
    blocksDict: { [blockId: string]: Block } = {};
    lostDict: { [lotId: string]: Lot } = {};

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

        this.updateCloskwiseEdgesOrder(startNodeId);
        this.updateCloskwiseEdgesOrder(endNodeId);
    }

    addMinorStreet(street: StreetEdge, face: Face) {
        this.addStreet(street);
        face.addStreet(street);
    }

    replaceStreet(streetToReplace: StreetEdge, newStreets: [StreetEdge, StreetEdge, StreetEdge]) {

        const realtedFaces = Object.values(this.facesDict).filter(f => f.streets[streetToReplace.id]);
        const realtedBlocks = Object.values(this.blocksDict).filter(b => b.streets[streetToReplace.id]);
        const realtedLots = Object.values(this.lostDict).filter(l => l.streets[streetToReplace.id]);

        this.addStreet(newStreets[0]);
        this.addStreet(newStreets[1]);
        this.addStreet(newStreets[2]);
        this._removeStreet(streetToReplace);

        for (const f of realtedFaces) {
            // third one can be only in one face, new street containes one new node and one existing, we check which face poses exists one
            if (Object.values(f.nodes).some((node) => newStreets[2].startNode.id == node.id) || Object.values(f.nodes).some((node) => newStreets[2].endNode.id == node.id)) {
                f.addStreet(newStreets[2]);
            }

            f.addStreet(newStreets[0]);
            f.addStreet(newStreets[1]);
            f.removeStreet(streetToReplace);
        }

        for (const b of realtedBlocks) {
            // third one can be only in one face, new street containes one new node and one existing, we check which face poses exists one
            if (Object.values(b.nodes).some((node) => newStreets[2].startNode.id == node.id) || Object.values(b.nodes).some((node) => newStreets[2].endNode.id == node.id)) {
                b.addStreet(newStreets[2]);
            }

            b.addStreet(newStreets[0]);
            b.addStreet(newStreets[1]);
            b.removeStreet(streetToReplace);
        }

        // TODO: i dont know if that should be there
        for (const l of realtedLots) {
            // third one can be only in one face, new street containes one new node and one existing, we check which face poses exists one
            if (Object.values(l.nodes).some((node) => newStreets[2].startNode.id == node.id) || Object.values(l.nodes).some((node) => newStreets[2].endNode.id == node.id)) {
                l.addStreet(newStreets[2]);
            }

            l.addStreet(newStreets[0]);
            l.addStreet(newStreets[1]);
            l.removeStreet(streetToReplace);
        }

    }


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
        this.facesDict = {};

        for (let edge of Object.values(this.edges)) {

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
                    const face = new Face(pathNodes, path, Hierarchy.Major);

                    if (!this.facesDict[face.id]) {
                        this.facesDict[face.id] = face;
                    }

                    // this.canvansDrawingEngine?.fillCircle(pathNodes, 'orange');
                    break;
                }
            }

        }
    }

    extractBlocksFromFaces() {
        this.blocksDict = {};

        for (let face of Object.values(this.facesDict)) {
            const newBlocks = face.calculateSubfaces();
            Object.assign(this.blocksDict, newBlocks);
        }
    }


    splitBlocksOnLots() {
        for (let block of Object.values(this.blocksDict)) {
            const lots = block.splitOnLots();
            Object.assign(this.lostDict, lots);
        }
    }

    splitBlocksOnLot(block: Block) {
       const lots = block.splitOnLots();
       Object.assign(this.lostDict, lots);
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

    getCounterclockwiseMostNode(edge: StreetEdge, currentNode: StreetNode, filter: (edgeId: string) => boolean = () => true) {
        const nodeValence = this.clockwiseEdgesOrder[currentNode.id].length;
        if (nodeValence == 1) return null;

        const filteredClockwiseOrder = this.clockwiseEdgesOrder[currentNode.id].filter(filter);
        if (filteredClockwiseOrder.length == 1) return null;
        const index = filteredClockwiseOrder.findIndex((id) => id == edge.id);
        return this.clockwiseEdgesOrder[currentNode.id][index == 0 ? filteredClockwiseOrder.length - 1 : index - 1];
    }
}

