import { Hierarchy, Point, StreetEdge, StreetGraph, StreetNode, StreetStatus } from "./types/StreetGraph";

export interface ISimulationConfiguration {
    initialStreetGraph: StreetGraph,
    cityCenterPoint: Point,
    numberOfYears: number,
    timeStep: number,
    valenceRatio: [number, number, number, number], // should sum to 1, node with valence 1, 2, 3, 4 respectivelly
    streetsLength: number,
}

const initialStreetGraph = new StreetGraph();

const StreetNode1 = new StreetNode(0, new Point(0, 0), Hierarchy.Major);
const StreetNode2 = new StreetNode(1, new Point(50, 50), Hierarchy.Major);
const street1 = new StreetEdge(StreetNode1, StreetNode2, Hierarchy.Major, 1, StreetStatus.Build);
initialStreetGraph.addStreet(street1);

const SimulationConfiguration: ISimulationConfiguration = {
    initialStreetGraph: initialStreetGraph,
    cityCenterPoint: new Point(400, 400),
    numberOfYears: 1000,
    timeStep: 1,
    valenceRatio: [0.1, 0.6, 0.1, 0.3],
    streetsLength: 50
}

export default SimulationConfiguration; 