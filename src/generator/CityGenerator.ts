import { ISimulationConfiguration } from '../simulationConfiguration';
import { Face, Hierarchy, Point, StreetEdge, StreetGraph, StreetNode, StreetStatus } from '../types/StreetGraph';
import { NormalStreetsPattern } from './cityStyles/NormalStreetsPattern';
import { calculateIntersection, normalizeNumbers, randomlySelectElementFromProbabilityDistribution } from './utils';
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
        if (node.hierarchy == Hierarchy.Major) return Math.pow(Math.E, (-1) * Math.pow(this.configuration.focusedGrowthFunc(this.getDistanceFromClosesGrowthPoint(node.position)), 2));
        return 1;
    }


    scanAround(scanPosition: Point) {
        for (let node of this.streetGraph.nodes) {
            if (node.position.distance(scanPosition) < this.configuration.nodeCricusScanningR) {
                return node;
            }
        }
        return null;
    }

    generateNewStreet(direction: Point, startNode: StreetNode) {
        const [newNodePosition, futureIntersectionScanPosition] = new NormalStreetsPattern().getNewNodeLocation(direction, startNode, this.configuration);
        const newNode = new StreetNode(this.streetGraph.getNextNodeId(), newNodePosition, startNode.hierarchy);
        const newStreet = new StreetEdge(startNode, newNode, startNode.hierarchy, startNode.hierarchy == Hierarchy.Major ? 3 : 1, StreetStatus.Build);

        // check for intersection or future intersection
        let closestInetrsectionPoint: Point | null = null;
        let intersectionStreet: StreetEdge | null = null;

        for (let edge of this.streetGraph.getEdges()) {
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
            newNode.hierarchy = intersectionStreet.hierarchy;
            // they should inherit all proeprties
            const part1Street = new StreetEdge(intersectionStreet.startNode, newNode, intersectionStreet.hierarchy, intersectionStreet.width, intersectionStreet.status);
            const part2Street = new StreetEdge(intersectionStreet.endNode, newNode, intersectionStreet.hierarchy, intersectionStreet.width, intersectionStreet.status);
            const newStreet2 = new StreetEdge(startNode, newNode, startNode.hierarchy, startNode.hierarchy == Hierarchy.Major ? 3 : 1, StreetStatus.Build);

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
            return this.generateNewStreet(node.direction, node);
        }

        if (nodeValence == 2) {
            if (Math.random() < 0.5) {
                node.hasLeft = true;
                return this.generateNewStreet(node.leftDirection, node);
            } else {
                node.hasRight = true;
                return this.generateNewStreet(node.rightDirection, node);
            }
        }

        if (nodeValence == 3) {
            node.isGrowthing = false;
            if (node.hasLeft) {
                node.hasRight = true;
                return this.generateNewStreet(node.rightDirection, node);
            }
            node.hasLeft = true;
            return this.generateNewStreet(node.leftDirection, node);
        }

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
            return [[1], [2, 3]];
        }
        return [[2, 3], [1]];
        // check distribution again (for 4 valance nodes)
        // console.log(this.configuration.valenceRatio, Object.entries(valenceDistributon).sort(([key, _v], [key2, _v2]) => Number(key) - Number(key2)).map(([_key, v]) => v / allNodes));
        // if (valenceDistributon['2'] / allNodes < this.configuration.valenceRatio[0]) return 1;
        // if (valenceDistributon['3'] / allNodes < this.configuration.valenceRatio[1]) return 2;
        // return 3;
    }

    nextFace: number = 0;
    splitNextFace() {
        this.streetGraph.pointsToDraw = [];
        this.streetGraph.trainglesToDraw = [];
        const face = this.streetGraph.facesList[this.nextFace % this.streetGraph.facesList.length];
        for (let i = 0; i < 10; i++) {
            const point = face.getRandomPointFromFace();
            this.streetGraph.pointsToDraw.push(point);
        }
        for (let traingle of face.traingles) {
            this.streetGraph.trainglesToDraw.push(traingle);
        }
        this.nextFace += 1;
    }

    splitFaces() {
        for (let face of this.streetGraph.facesList) {
            for (let traingle of face.traingles) {
                this.streetGraph.trainglesToDraw.push(traingle);
            }
            for (let i = 0; i < 10; i++) {
                const point = face.getRandomPointFromFace();
                this.streetGraph.pointsToDraw.push(point);
            }
        }
    }

    generateSecondaryRoads() {
        console.log('this.streetGraph.facesList', this.streetGraph.facesList)
        for (let face of this.streetGraph.facesList) {
            this.fillFaceWithRoads(face);
        }
    }

    expandMinorStreets() {
        for (let face of this.streetGraph.facesList) {
            for (let i = 0; i < 30; i++) {
                this.expandMinorStreet(face);
            }
        }
    }
    fillFaceWithRoads(face: Face) {

        let isProperLength = false;
        let newEdge;

        for (let i = 0; i < 10; i++) {
            const [startPoint1, startPoint2] = face.getRandomTwoPoinsInTraingle();
            const node1 = new StreetNode(this.streetGraph.getNextNodeId(), startPoint1, Hierarchy.Minor);
            const node2 = new StreetNode(this.streetGraph.getNextNodeId(), startPoint2, Hierarchy.Minor);
            newEdge = new StreetEdge(node1, node2, Hierarchy.Minor, 1, StreetStatus.Planned);
            if (newEdge.length() >= this.configuration.minimumInitialStreetLength) {
                isProperLength = true;
                break;
            }
        }

        if (!isProperLength || !newEdge) {
            console.log('could not find proper new street for face')
            return;
        }

        this.streetGraph.addMinorStreet(newEdge, face);

        // while(!face.isExpansionFinished) {

        // }
        // for (let i = 0; i < 30; i++) {
        //     this.expandMinorStreet(face);
        // }
    }

    expandMinorStreet(face: Face) {

        let growthCandidates = face.nodes.filter(node => node.isGrowthing && node.hierarchy == Hierarchy.Minor);
        const candidatesProbabilites = growthCandidates.map(candidate => this.calucateGrowthCandidateProbablity(candidate));
        const normalizedCandidatesProbabilities = normalizeNumbers(candidatesProbabilites);
        const randomNodeIndex = randomlySelectElementFromProbabilityDistribution(normalizedCandidatesProbabilities);

        if (randomNodeIndex == -1) {
            // console.log("coud not find candidate");
            return {
                done: this.currentTime == this.configuration.numberOfYears,
                value: this.streetGraph
            };
        }

        const randomNode = growthCandidates[randomNodeIndex];

        const expansionResult = this.expandNode(randomNode);

        // console.log('expansionResult', expansionResult)
        this.streetGraph.clearNewPoints();

        for (let newStreet of expansionResult.newStreets) {
            this.streetGraph.addMinorStreet(newStreet, face); // check it twice
            // below 2 lines are tmp
            this.streetGraph.addNewPoint(newStreet.endNode.position);
            this.streetGraph.addNewPoint(newStreet.startNode.position);
        }

        for (let streetToRemove of expansionResult.streetsToRemove) {
            this.streetGraph.removeStreet(streetToRemove); // to be done
        }
    }


    next(): IteratorResult<StreetGraph, any> {
        this.currentTime += 1;

        const searchedValences = this.getSearchedValence();
        let growthCandidates = this.streetGraph.nodes.filter(node => node.isGrowthing && searchedValences[0].includes(this.streetGraph.getNodeValence(node)));

        if (growthCandidates.length == 0) {
            growthCandidates = this.streetGraph.nodes.filter(node => node.isGrowthing && searchedValences[1].includes(this.streetGraph.getNodeValence(node)));
        }

        const candidatesProbabilites = growthCandidates.map(candidate => this.calucateGrowthCandidateProbablity(candidate));
        const normalizedCandidatesProbabilities = normalizeNumbers(candidatesProbabilites);
        // console.log('normalizedCandidatesProbabilities', normalizedCandidatesProbabilities)
        // console.log(normalizedCandidatesProbabilities.reduce((a, b) => a + b, 0))
        const randomNodeIndex = randomlySelectElementFromProbabilityDistribution(normalizedCandidatesProbabilities);

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
            // below 2 lines are tmp
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
