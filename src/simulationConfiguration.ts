import { Hierarchy, Point, StreetStatus } from "./types/BaseTypes";
import { StreetEdge } from "./types/StreetEdge";
import { StreetGraph } from "./types/StreetGraph";
import { StreetNode } from "./types/StreetNode";

export interface IExpansionConfiguraiton {
    minSteetSegmentLength: number,
    streetsLength: number,
    generationAngle: number,
    futureIntersectionScanFactor: number,
    nodeCricusScanningR: number,
}

export interface ISimulationConfiguration {
    // initial parameters
    initialStreetGraph: StreetGraph,
    cityCenterPoint: Point,
    growthPoints: Point[],

    // simulation
    numberOfYears: number,
    timeStep: number,

    // major nodes generation
    valence2to3or4Ratio: number, // should sum to 1, node with valence 2, 3, 4 respectivelly
    focusedGrowthFunc: (distanceFromNearestGrothwCeter: number) => number,
    majorNodesGeneration: IExpansionConfiguraiton,

    // minor nodes generation
    minimumInitialStreetLength: number
    minorNodesGeneration: IExpansionConfiguraiton,

    // lots subdivision
    maxLotSurface: number

}

const initialStreetGraph = new StreetGraph();


const StreetNode1 = new StreetNode(0, new Point(0, 0), Hierarchy.Major);
const StreetNode2 = new StreetNode(1, new Point(50, 0), Hierarchy.Major);
const street1 = new StreetEdge(StreetNode1, StreetNode2, Hierarchy.Major, 3, StreetStatus.Build);

const StreetNode3 = new StreetNode(3, new Point(100, 0), Hierarchy.Major);
const street2 = new StreetEdge(StreetNode2, StreetNode3, Hierarchy.Major, 3, StreetStatus.Build);

const StreetNode4 = new StreetNode(4, new Point(150, 0), Hierarchy.Major);
const street3 = new StreetEdge(StreetNode3, StreetNode4, Hierarchy.Major, 3, StreetStatus.Build);

const StreetNode5 = new StreetNode(5, new Point(150, 200), Hierarchy.Major);
const street4 = new StreetEdge(StreetNode4, StreetNode5, Hierarchy.Major, 3, StreetStatus.Build);

const StreetNode6 = new StreetNode(6, new Point(120, 200), Hierarchy.Major);
const street5 = new StreetEdge(StreetNode5, StreetNode6, Hierarchy.Major, 3, StreetStatus.Build);

const StreetNode7 = new StreetNode(7, new Point(0, 200), Hierarchy.Major);
const street6 = new StreetEdge(StreetNode6, StreetNode7, Hierarchy.Major, 3, StreetStatus.Build);

const street7 = new StreetEdge(StreetNode7, StreetNode1, Hierarchy.Major, 3, StreetStatus.Build);

const StreetNode8 = new StreetNode(8, new Point(100, 100), Hierarchy.Major);
const street8 = new StreetEdge(StreetNode3, StreetNode8, Hierarchy.Major, 3, StreetStatus.Build);

const StreetNode9 = new StreetNode(9, new Point(120, 100), Hierarchy.Major);
const street9 = new StreetEdge(StreetNode6, StreetNode9, Hierarchy.Major, 3, StreetStatus.Build);

const street10 = new StreetEdge(StreetNode8, StreetNode9, Hierarchy.Major, 3, StreetStatus.Build);


initialStreetGraph.addStreet(street1);
// initialStreetGraph.addStreet(street2);
// initialStreetGraph.addStreet(street3);
// initialStreetGraph.addStreet(street4);
// initialStreetGraph.addStreet(street5);
// initialStreetGraph.addStreet(street6);
// initialStreetGraph.addStreet(street7);
// initialStreetGraph.addStreet(street8);
// initialStreetGraph.addStreet(street9);
// initialStreetGraph.addStreet(street10);

const SimulationConfiguration: ISimulationConfiguration = {
    // initial parameters
    initialStreetGraph: initialStreetGraph,
    cityCenterPoint: new Point(400, 400),
    growthPoints: [new Point(0, 0)],
    // growthPoints: [new Point(-400, -400), new Point(400, 400), new Point(1000, 1500)],

    // simulation
    numberOfYears: 10000000,
    timeStep: 1,

    // major nodes generation
    valence2to3or4Ratio: 0.99,
    focusedGrowthFunc: (distanceFromNearestGrothwCeter: number) => 0.01 * distanceFromNearestGrothwCeter,
    majorNodesGeneration: {
        generationAngle: Math.PI / 2,
        minSteetSegmentLength: 0,
        streetsLength: 50,
        futureIntersectionScanFactor: 1.5, // length for node to check future interseciton
        nodeCricusScanningR: 0, // can cause crossing? cuses not finding faces?!! check that
    },

    // minor nodes generation
    minimumInitialStreetLength: 10,
    minorNodesGeneration: {
        generationAngle: Math.PI / 2,
        minSteetSegmentLength: 0,
        streetsLength: 20,
        futureIntersectionScanFactor: 1.5, // length for node to check future interseciton
        nodeCricusScanningR: 0, // causes minor streets to go out of face (if another node is found)
    },

    // lots subdivision
    maxLotSurface: 50
}

export default SimulationConfiguration; 