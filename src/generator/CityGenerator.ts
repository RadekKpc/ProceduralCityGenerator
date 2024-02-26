import { ISimulationConfiguration } from '../simulationConfiguration';
import { Hierarchy, Point, StreetEdge, StreetGraph, StreetNode, StreetStatus } from '../types/StreetGraph';
import { GridStreetsPattern } from './cityStyles/GridStreetsPattern';
import { NormalStreetsPattern } from './cityStyles/NormalStreetsPattern';
import { calculateIntersection } from './utils';

export class CityGenerator implements Iterator<StreetGraph> {

    numberOfStreets: number;
    streetGraph: StreetGraph;
    configuration: ISimulationConfiguration;
    currentTime: number;

    constructor(configuration: ISimulationConfiguration) {
        this.configuration = configuration;
        this.numberOfStreets = 0;
        this.streetGraph = configuration.initialStreetGraph;
        this.currentTime = 0;
    }

    calucateGrowthCandidateProbablity(node: StreetNode): number {
        // console.log(node.position.distance(this.configuration.cityCenterPoint), this.streetGraph.getNodeValence(node), this.configuration.valenceRatio[this.streetGraph.getNodeValence(node) - 1])
        return node.position.distance(this.configuration.cityCenterPoint) * this.configuration.valenceRatio[this.streetGraph.getNodeValence(node) - 1];
    }

    normalizeNumbers(numbers: number[]): number[] {
        const sum = numbers.reduce((a, b) => a + b, 0);
        return numbers.map(n => n / sum);
    }

    randomlySelectElementFromProbabilityDistribution(distribution: number[]) {
        for (let i = 1; i < distribution.length; i++) {
            distribution[i] += distribution[i - 1];
        }
        const randomNumber = Math.random();
        return distribution.findIndex(e => e >= randomNumber);
    }

    generateNewStreet(direction: Point, strategy: null, startNode: StreetNode) {
        const newNodePosition = new NormalStreetsPattern().getNewNodeLocation(direction, startNode, this.configuration);
        const newNode = new StreetNode(this.streetGraph.nodes.length, newNodePosition, Hierarchy.Major);
        const newStreet = new StreetEdge(startNode, newNode, Hierarchy.Major, 1, StreetStatus.Build);

        // check for intersection
        let closestInetrsectionPoint: Point | null = null;
        let intersectionStreet: StreetEdge | null = null;

        for (let edge of this.streetGraph.edges) {

            if (edge.startNode.id != startNode.id && edge.endNode.id != startNode.id) {
                const intersectionPoint = calculateIntersection(edge.startNode.position, edge.endNode.position, newStreet.startNode.position, newStreet.endNode.position);
                if (intersectionPoint) {
                    if (closestInetrsectionPoint && closestInetrsectionPoint.distance(edge.startNode.position) <= intersectionPoint.distance(edge.startNode.position)) {
                        continue;
                    }
                    intersectionStreet = edge;
                    closestInetrsectionPoint = intersectionPoint;
                    console.log(intersectionPoint, edge.startNode.position, edge.endNode.position, newStreet.startNode.position, newStreet.endNode.position);
                }

            }
        }

        // cut graph
        if (closestInetrsectionPoint && intersectionStreet) {
            newNode.setPosition(closestInetrsectionPoint);
            // they should inherit all proeprties
            const part1Street = new StreetEdge(intersectionStreet.startNode, newNode, intersectionStreet.hierarchy, 3, intersectionStreet.status);
            const part2Street = new StreetEdge(intersectionStreet.endNode, newNode, intersectionStreet.hierarchy, 3, intersectionStreet.status);
            const newStreet = new StreetEdge(startNode, newNode, Hierarchy.Major, 3, StreetStatus.Build);
            return {
                newStreets: [part1Street, part2Street, newStreet],
                streetsToRemove: [intersectionStreet]
            };

        }

        return {
            newStreets: [newStreet],
            streetsToRemove: []
        };

    }

    expandNode(node: StreetNode) {
        const nodeValence = this.streetGraph.getNodeValence(node);

        if (nodeValence == 1) {
            node.hasFront = true;
            return this.generateNewStreet(node.direction, null, node);
        }

        if (nodeValence == 2) {
            if (Math.random() < 0.5) {
                node.hasLeft = true;
                return this.generateNewStreet(node.leftDirection, null, node);
            } else {
                node.hasRight = true;
                return this.generateNewStreet(node.rightDirection, null, node);
            }
        }

        if (nodeValence == 3) {
            node.isGrowthing = false;
            if (node.hasLeft) {
                node.hasRight = true;
                return this.generateNewStreet(node.rightDirection, null, node);
            }
            node.hasLeft = true;
            return this.generateNewStreet(node.leftDirection, null, node);
        }

        console.log("nothing gerated");

        return {
            newStreets: [],
            streetsToRemove: []
        };
    }

    next(): IteratorResult<StreetGraph, any> {
        this.currentTime += 1;

        const growthCandidates = this.streetGraph.nodes.filter(node => node.isGrowthing);
        const candidatesProbabilites = growthCandidates.map(candidate => this.calucateGrowthCandidateProbablity(candidate));
        const normalizedCandidatesProbabilities = this.normalizeNumbers(candidatesProbabilites);

        const randomNodeIndex = this.randomlySelectElementFromProbabilityDistribution(normalizedCandidatesProbabilities);
        const randomNode = growthCandidates[randomNodeIndex];

        console.log(this.streetGraph.edges);

        const expansionResult = this.expandNode(randomNode);


        for (let newStreet of expansionResult.newStreets) {
            this.streetGraph.addStreet(newStreet!); // check it twice
        }

        for (let streetToRemove of expansionResult.streetsToRemove) {
            this.streetGraph.removeStreet(streetToRemove!); // check it twice
        }


        return {
            done: this.currentTime == this.configuration.numberOfYears,
            value: this.streetGraph
        };
    }

}
