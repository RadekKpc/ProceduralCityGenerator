export enum Hierarchy {
    Lot,
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
