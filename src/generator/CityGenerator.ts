import { stat } from 'fs';
import { ISimulationConfiguration } from '../simulationConfiguration';
import { Hierarchy, Point, StreetEdge, StreetGraph, StreetNode, StreetStatus } from '../types/StreetGraph';

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

    calucateGrothCandidateProbablity(node: StreetNode): number {
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
        const newNodePosition = startNode.position.vectorAdd(direction.scalarMultiply(this.configuration.streetsLength));
        const newNode = new StreetNode(this.streetGraph.nodes.length, newNodePosition, Hierarchy.Major);
        const newStreet = new StreetEdge(startNode, newNode, Hierarchy.Major, 3, StreetStatus.Build);
        return newStreet;
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
    }

    next(): IteratorResult<StreetGraph, any> {
        this.currentTime += 1;

        const growthCandidates = this.streetGraph.nodes.filter(node => node.isGrowthing);
        const candidatesProbabilites = growthCandidates.map(candidate => this.calucateGrothCandidateProbablity(candidate));
        const normalizedCandidatesProbabilities = this.normalizeNumbers(candidatesProbabilites);

        console.log(normalizedCandidatesProbabilities);

        const randomNodeIndex = this.randomlySelectElementFromProbabilityDistribution(normalizedCandidatesProbabilities);
        const randomNode = growthCandidates[randomNodeIndex];

        const newStreet = this.expandNode(randomNode);
        this.streetGraph.addStreet(newStreet!); // check it twice

        console.log(newStreet);
        return {
            done: this.currentTime == this.configuration.numberOfYears,
            value: this.streetGraph
        };
    }

}
