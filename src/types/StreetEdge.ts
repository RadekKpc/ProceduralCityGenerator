import { StreetNode } from "./StreetNode";
import { Hierarchy, Point, StreetStatus } from "./BaseTypes";

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

    middlePoint() {
        return new Point((this.endNode.position.x + this.startNode.position.x) / 2, (this.endNode.position.y + this.startNode.position.y) / 2)
    }
}
