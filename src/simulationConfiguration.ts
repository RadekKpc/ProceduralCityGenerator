import { Hierarchy, Point, StreetEdge, StreetGraph, StreetNode, StreetStatus } from "./types/StreetGraph";

export interface ISimulationConfiguration {
    initialStreetGraph: StreetGraph,
    cityCenterPoint: Point,
    numberOfYears: number,
    timeStep: number,
    valence2to3or4Ratio: number, // should sum to 1, node with valence 2, 3, 4 respectivelly
    streetsLength: number,
    generationAngle: number,
    futureIntersectionScanFactor: number,
    nodeCricusScanningR: number,
    growthPoints: Point[],
    focusedGrowthFunc: (distanceFromNearestGrothwCeter: number) => number
    minSteetSegmentLength: number,
}

const initialStreetGraph = new StreetGraph();

const StreetNode1 = new StreetNode(0, new Point(0, 0), Hierarchy.Major);
const StreetNode2 = new StreetNode(1, new Point(50, 0), Hierarchy.Major);
const street1 = new StreetEdge(StreetNode1, StreetNode2, Hierarchy.Major, 1, StreetStatus.Build);
initialStreetGraph.addStreet(street1);

const SimulationConfiguration: ISimulationConfiguration = {
    // initial parameters
    initialStreetGraph: initialStreetGraph,
    cityCenterPoint: new Point(400, 400),
    growthPoints: [new Point(0, 0)],
    // growthPoints: [new Point(-400, -400), new Point(400, 400), new Point(1000, 1500)],
    focusedGrowthFunc: (distanceFromNearestGrothwCeter: number) => 0.01 * distanceFromNearestGrothwCeter,
    // simulation
    numberOfYears: 10000000,
    timeStep: 1,
    // new nodes generation
    minSteetSegmentLength: 0,
    generationAngle: Math.PI / 2,
    streetsLength: 50,
    futureIntersectionScanFactor: 1.5, // length for node to check future interseciton
    nodeCricusScanningR: 25,
    // streets
    valence2to3or4Ratio: 0.99,
}

export default SimulationConfiguration; 