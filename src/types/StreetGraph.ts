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

    normalize() {
        const vectorLength = Math.sqrt(this.x * this.x + this.y * this.y);
        this.x = this.x / vectorLength;
        this.y = this.y / vectorLength;
    }

    vectorMultiply(vector: Point): Point {
        return new Point(this.x * vector.x, this.y * vector.y)
    }

    vectorAdd(vector: Point): Point {
        return new Point(this.x + vector.x, this.y + vector.y)
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

    startNode: StreetNode;
    endNode: StreetNode;
    hierarchy: Hierarchy;
    width: number;
    status: StreetStatus;

    constructor(startNode: StreetNode, endNode: StreetNode, hierarchy: Hierarchy, width: number, status: StreetStatus) {
        this.startNode = startNode;
        this.endNode = endNode;
        this.hierarchy = hierarchy;
        this.width = width;
        this.status = status;
    }
}

export class StreetGraph {

    edges: StreetEdge[];
    nodes: StreetNode[];
    graph: { [nodeId: number]: { [nodeId: number]: StreetEdge } };
    newPoints: Point[];
    valence2edges: number;
    valence3edges: number;
    valence4edges: number;

    constructor() {
        this.edges = [];
        this.nodes = [];
        this.newPoints = [];
        this.graph = {};
        this.valence2edges = 0;
        this.valence3edges = 0;
        this.valence4edges = 0;
    }

    addStreet(street: StreetEdge) {

        const startNodeId = street.startNode.id;
        const endNodeId = street.endNode.id;

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
    }

    removeStreet(street: StreetEdge) {
        const startNodeId = street.startNode.id;
        const endNodeId = street.endNode.id;

        delete this.graph[startNodeId][endNodeId];
        delete this.graph[endNodeId][startNodeId];

        const index = this.edges.indexOf(street);
        if (index > -1) {
            this.edges.splice(index, 1);
        }
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
}