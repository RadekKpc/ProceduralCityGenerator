import { Hierarchy, Point, StreetEdge, StreetGraph, StreetNode, StreetStatus } from "./types/StreetGraph";

export interface ISimulationConfiguration {
    initialStreetGraph: StreetGraph,
    cityCenterPoint: Point,
    numberOfYears: number,
    timeStep: number,
    valenceRatio: [number, number, number], // should sum to 1, node with valence 2, 3, 4 respectivelly
    streetsLength: number,
    generationAngle: number,
    futureIntersectionScanFactor: number,
    nodeCricusScanningR: number,
    growthPoints: Point[]
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
    // growthPoints: [new Point(0, 0)],
    growthPoints: [new Point(-400, -400), new Point(400, 400), new Point(1000, 1500)],
    // simulation
    numberOfYears: 10000000,
    timeStep: 1,
    // new nodes generation
    generationAngle: Math.PI / 3,
    streetsLength: 25,
    futureIntersectionScanFactor: 1.5, // length for node to check future interseciton
    nodeCricusScanningR: 7,
    // streets
    valenceRatio: [0.7, 0.1, 0.2],
}

export default SimulationConfiguration; 