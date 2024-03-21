import { Hierarchy, Point } from "./BaseTypes";

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