import { Point } from "../types/StreetGraph";

// Standard Normal variate using Box-Muller transform.
export const gaussianRandom = (stdev = 1, mean = 0, min = -5, max = 5): number => {
    const u = 1 - Math.random(); // Converting [0,1) to (0,1]
    const v = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    // Transform to the desired mean and standard deviation:
    const result = z * stdev + mean;
    if (result < min || result > max) return gaussianRandom(mean, stdev, min, max);
    return result;
}

export const calculateIntersection = (p1: Point, p2: Point, p3: Point, p4: Point): Point | null => {

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
    if (!(
        Math.min(p1.x, p2.x) <= px && px <= Math.max(p1.x, p2.x) &&
        Math.min(p3.x, p4.x) <= px && px <= Math.max(p3.x, p4.x) &&
        Math.min(p1.y, p2.y) <= py && py <= Math.max(p1.y, p2.y) &&
        Math.min(p3.y, p4.y) <= py && py <= Math.max(p3.y, p4.y)
    )) return null

    return new Point(px, py);
}

export const normalizeNumbers = (numbers: number[]): number[] => {
    const sum = numbers.reduce((a, b) => a + b, 0);
    return numbers.map(n => n / sum);
}

export const randomlySelectElementFromProbabilityDistribution = (distribution: number[]) => {
    for (let i = 1; i < distribution.length; i++) {
        distribution[i] += distribution[i - 1];
    }
    const randomNumber = Math.random();
    return distribution.findIndex(e => e >= randomNumber);
}