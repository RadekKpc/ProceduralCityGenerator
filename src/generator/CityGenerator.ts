import { CanvasDrawingEngine } from '../drawingEngine/CanvasDrawingEngine';
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

    getDistanceFromClosesGrowthPoint(position: Point): number {
        const closestPointDistance = Math.min(...this.configuration.growthPoints.map(p => position.distance(p)));
        return closestPointDistance >= 1 ? closestPointDistance : 1;
    }

    calucateGrowthCandidateProbablity(node: StreetNode): number {
        return Math.pow(Math.E, (-1) * Math.pow(this.configuration.focusedGrowthFunc(this.getDistanceFromClosesGrowthPoint(node.position)), 2));
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

    scanAround(scanPosition: Point) {
        for (let node of this.streetGraph.nodes) {
            if (node.position.distance(scanPosition) < this.configuration.nodeCricusScanningR) {
                return node;
            }
        }
        return null;
    }

    generateNewStreet(direction: Point, strategy: null, startNode: StreetNode) {
        const [newNodePosition, futureIntersectionScanPosition] = new NormalStreetsPattern().getNewNodeLocation(direction, startNode, this.configuration);
        const newNode = new StreetNode(this.streetGraph.getNextNodeId(), newNodePosition, Hierarchy.Major);
        const newStreet = new StreetEdge(startNode, newNode, Hierarchy.Major, 1, StreetStatus.Build);

        // check for intersection or future intersection
        let closestInetrsectionPoint: Point | null = null;
        let intersectionStreet: StreetEdge | null = null;

        for (let edge of this.streetGraph.edges) {
            if (edge.startNode.id != startNode.id && edge.endNode.id != startNode.id) {
                const intersectionPoint = calculateIntersection(edge.startNode.position, edge.endNode.position, newStreet.startNode.position, futureIntersectionScanPosition);
                if (intersectionPoint) {
                    if (closestInetrsectionPoint && closestInetrsectionPoint.distance(newStreet.startNode.position) <= intersectionPoint.distance(newStreet.startNode.position)) {
                        continue;
                    }
                    intersectionStreet = edge;
                    closestInetrsectionPoint = intersectionPoint;
                }

            }
        }

        if (closestInetrsectionPoint && intersectionStreet) {
            // if intersection is close ot existing point we do not need cut edge
            const nodeInCircle = this.scanAround(closestInetrsectionPoint);
            if (nodeInCircle) {
                newStreet.setEndNode(nodeInCircle)

                if (newStreet.length() < this.configuration.minSteetSegmentLength) return { newStreets: [], streetsToRemove: [] };

                return {
                    newStreets: [newStreet],
                    streetsToRemove: []
                }
            }

            // cut graph
            newNode.setPosition(closestInetrsectionPoint);
            // they should inherit all proeprties
            const part1Street = new StreetEdge(intersectionStreet.startNode, newNode, intersectionStreet.hierarchy, 3, intersectionStreet.status);
            const part2Street = new StreetEdge(intersectionStreet.endNode, newNode, intersectionStreet.hierarchy, 3, intersectionStreet.status);
            const newStreet2 = new StreetEdge(startNode, newNode, Hierarchy.Major, 3, StreetStatus.Build);

            if (newStreet2.length() < this.configuration.minSteetSegmentLength) return { newStreets: [], streetsToRemove: [] };

            return {
                newStreets: [part1Street, part2Street, newStreet2],
                streetsToRemove: [intersectionStreet]
            };

        }


        // check for existing nodes in circle
        const nodeInCircle = this.scanAround(newNode.position);
        if (nodeInCircle) {
            newStreet.setEndNode(nodeInCircle);

            if (newStreet.length() < this.configuration.minSteetSegmentLength) return { newStreets: [], streetsToRemove: [] };

            return {
                newStreets: [newStreet],
                streetsToRemove: []
            }
        }

        if (newStreet.length() < this.configuration.minSteetSegmentLength) return { newStreets: [], streetsToRemove: [] };

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

        console.log("nothing generated");

        return {
            newStreets: [],
            streetsToRemove: []
        };
    }

    getSearchedValence(): number[][] {
        const valenceDistributon = this.streetGraph.getValenceDistribution();
        const current2to4ration = valenceDistributon['2'] / (valenceDistributon['4'] + valenceDistributon['3']);
        // const allNodes = this.streetGraph.nodes.length;

        console.log('current2to4ration', current2to4ration)
        if (current2to4ration < this.configuration.valence2to3or4Ratio) {
            return [[1], [2,3]];
        }
        return [[2, 3], [1]];
        // check distribution again (for 4 valance nodes)
        // console.log(this.configuration.valenceRatio, Object.entries(valenceDistributon).sort(([key, _v], [key2, _v2]) => Number(key) - Number(key2)).map(([_key, v]) => v / allNodes));
        // if (valenceDistributon['2'] / allNodes < this.configuration.valenceRatio[0]) return 1;
        // if (valenceDistributon['3'] / allNodes < this.configuration.valenceRatio[1]) return 2;
        // return 3;
    }

    next(): IteratorResult<StreetGraph, any> {
        this.currentTime += 1;

        const searchedValences = this.getSearchedValence();
        let growthCandidates = this.streetGraph.nodes.filter(node => node.isGrowthing && searchedValences[0].includes(this.streetGraph.getNodeValence(node)));

        if (growthCandidates.length == 0) {
            growthCandidates = this.streetGraph.nodes.filter(node => node.isGrowthing && searchedValences[1].includes(this.streetGraph.getNodeValence(node)));
        }

        const candidatesProbabilites = growthCandidates.map(candidate => this.calucateGrowthCandidateProbablity(candidate));
        const normalizedCandidatesProbabilities = this.normalizeNumbers(candidatesProbabilites);
        // console.log('normalizedCandidatesProbabilities', normalizedCandidatesProbabilities)
        // console.log(normalizedCandidatesProbabilities.reduce((a, b) => a + b, 0))
        const randomNodeIndex = this.randomlySelectElementFromProbabilityDistribution(normalizedCandidatesProbabilities);

        if (randomNodeIndex == -1) {
            // console.log("coud not find candidate");
            return {
                done: this.currentTime == this.configuration.numberOfYears,
                value: this.streetGraph
            };
        }

        // console.log('randomNodeIndex', randomNodeIndex)
        const randomNode = growthCandidates[randomNodeIndex];


        const expansionResult = this.expandNode(randomNode);

        // console.log('expansionResult', expansionResult)
        this.streetGraph.clearNewPoints();


        for (let newStreet of expansionResult.newStreets) {
            this.streetGraph.addStreet(newStreet); // check it twice
            this.streetGraph.addNewPoint(newStreet.endNode.position);
            this.streetGraph.addNewPoint(newStreet.startNode.position);
        }

        for (let streetToRemove of expansionResult.streetsToRemove) {
            this.streetGraph.removeStreet(streetToRemove); // check it twice
        }

        return {
            done: this.currentTime == this.configuration.numberOfYears,
            value: this.streetGraph
        };
    }

}
