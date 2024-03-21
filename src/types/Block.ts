import { CanvansDrawingEngine } from "..";
import { calculateIntersection, NextNodeIdGenerator } from "../generator/utils";
import { Hierarchy, Point, StreetStatus } from "./BaseTypes";
import { Face } from "./Face";
import { StreetEdge } from "./StreetEdge";
import { StreetGraph } from "./StreetGraph";
import { StreetNode } from "./StreetNode";

export class Block extends Face {

    subfacesDict: { [lotId: string]: Lot } = {};

    async splitOnLots2(graph: StreetGraph, depth = 0, lotsToRemove: Lot[] = []) {

        console.log("depth", depth)
        if (depth == 4) {
            for (let l of lotsToRemove) {
                // delete graph.lostDict[l.id];
            }
            return;
        }

        // extract 
        let largestStreet = Object.values(this.streets)[0];
        for (let s of Object.values(this.streets)) {
            if (s.length() > largestStreet.length()) {
                largestStreet = s;
            }
        }
        console.log('largestStreet', largestStreet)

        const middle = largestStreet.middlePoint();

        const perpendicularLine = (x: number) => (largestStreet.endNode.position.x - largestStreet.startNode.position.x) * (middle.x - x) / (largestStreet.endNode.position.y - largestStreet.startNode.position.y) + middle.y;

        const perpendicularPointA = new Point(-100000, perpendicularLine(-100000));
        const perpendicularPointB = new Point(100000, perpendicularLine(100000));

        console.log('streets length', Object.values(this.streets).length)
        for (let s of Object.values(this.streets)) {
            if (s.id != largestStreet.id) {
                let corssingPonit = calculateIntersection(perpendicularPointA, perpendicularPointB, s.startNode.position, s.endNode.position);

                if (corssingPonit) {
                    console.log('corssingPonit', corssingPonit);
                    const middleNode = new StreetNode(NextNodeIdGenerator.next(), middle, Hierarchy.Lot);
                    const newNode2 = new StreetNode(NextNodeIdGenerator.next(), corssingPonit, Hierarchy.Lot);

                    const part1Street = new StreetEdge(s.startNode, newNode2, s.hierarchy, s.width, s.status);
                    const part2Street = new StreetEdge(s.endNode, newNode2, s.hierarchy, s.width, s.status);
                    const newStreet = new StreetEdge(middleNode, newNode2, Hierarchy.Lot, 1, StreetStatus.Planned);

                    graph.replaceStreet(s, [part1Street, part2Street, newStreet]);

                    const part1LargestStreet = new StreetEdge(largestStreet.startNode, middleNode, largestStreet.hierarchy, largestStreet.width, largestStreet.status);
                    const part2LargestStreet = new StreetEdge(largestStreet.endNode, middleNode, largestStreet.hierarchy, largestStreet.width, largestStreet.status);
                    graph.replaceStreet(largestStreet, [part1LargestStreet, part2LargestStreet, newStreet]);

                    console.log('subfaces length before', Object.values(this.subfacesDict).length);
                    await this.calculateSubfaces();
                    console.log('subfaces length after', Object.values(this.subfacesDict).length);

                    for (let lot of Object.values(this.subfacesDict)) {
                        console.log(lot.id);
                        console.log(lot);
                    }
                    for (let lot of Object.values(this.subfacesDict)) {
                        console.log('split', lot.id);
                        // we split further => we need to remove parent
                        await lot.splitOnLots2(graph, depth + 1, [...lotsToRemove, this]);
                    }
                    return;
                }

            }
        }
        console.log("no corsisng point")

        // try 3 times
        // find point in middle

        // draw pararrel line

        // check if splits on two parts

        // modify graph

        // check suraface

        // accept and return or reject and modify graph back

        // return null after 3 attempts

    }

    // async splitOnLots(graph: StreetGraph) {

    //     this.calculateSubfaces();

    //     console.log("asdasdsa", Object.values(this.subfacesDict).length);
    //     for (const l of Object.values(this.subfacesDict)) {
    //         console.log(l)
    //     }

        // // extract 
        // let largestStreet = Object.values(this.streets)[0];
        // for (let s of Object.values(this.streets)) {
        //     if (s.length() > largestStreet.length()) {
        //         largestStreet = s;
        //     }
        // }
        // console.log('largestStreet', largestStreet)

        // const middle = largestStreet.middlePoint();

        // const perpendicularLine = (x: number) => (largestStreet.endNode.position.x - largestStreet.startNode.position.x) * (middle.x - x) / (largestStreet.endNode.position.y - largestStreet.startNode.position.y) + middle.y;

        // const perpendicularPointA = new Point(-100000, perpendicularLine(-100000));
        // const perpendicularPointB = new Point(100000, perpendicularLine(100000));

        // console.log('streets length', Object.values(this.streets).length)
        // for (let s of Object.values(this.streets)) {
        //     if (s.id != largestStreet.id) {
        //         let corssingPonit = calculateIntersection(perpendicularPointA, perpendicularPointB, s.startNode.position, s.endNode.position);

        //         if (corssingPonit) {
        //             console.log('corssingPonit', corssingPonit);
        //             const middleNode = new StreetNode(graph.getNextNodeId(), middle, Hierarchy.Lot);
        //             const newNode2 = new StreetNode(graph.getNextNodeId(), corssingPonit, Hierarchy.Lot);

        //             const part1Street = new StreetEdge(s.startNode, newNode2, s.hierarchy, s.width, s.status);
        //             const part2Street = new StreetEdge(s.endNode, newNode2, s.hierarchy, s.width, s.status);
        //             const newStreet = new StreetEdge(middleNode, newNode2, Hierarchy.Lot, 1, StreetStatus.Planned);

        //             graph.replaceStreet(s, [part1Street, part2Street, newStreet]);

        //             const part1LargestStreet = new StreetEdge(largestStreet.startNode, middleNode, largestStreet.hierarchy, largestStreet.width, largestStreet.status);
        //             const part2LargestStreet = new StreetEdge(largestStreet.endNode, middleNode, largestStreet.hierarchy, largestStreet.width, largestStreet.status);
        //             graph.replaceStreet(largestStreet, [part1LargestStreet, part2LargestStreet, newStreet]);

        //             console.log('subfaces length before', this.subfaces.length);
        //             await this.extractLots(graph);
        //             console.log('subfaces length after', this.subfaces.length);

        //             for (let lot of this.subfaces) {
        //                 console.log(lot.id);
        //                 console.log(lot);
        //             }
        //             for (let lot of this.subfaces) {
        //                 console.log('split', lot.id);
        //                 // we split further => we need to remove parent
        //                 await lot.splitOnLots(graph, depth + 1, [...lotsToRemove, this]);
        //             }
        //             return;
        //         }

        //     }
        // }
        // console.log("no corsisng point")

    // }



    // async extractLots(graph: StreetGraph) {

    //     console.log("calcualte for lot", this.id);
    //     console.log("subfaces", this.subfaces.length);
    //     console.log("streets", Object.values(this.streets).length);
    //     this.subfaces = [];
    //     this.subfacesDict = {};

    //     // for (let s of Object.values(this.streets)) {
    //     //     CanvansDrawingEngine?.drawEdge(s, 'pink')
    //     // }
    //     // await this.wait(2000);
    //     for (let edge of Object.values(this.streets)) {

    //         let nextNode = edge.endNode;
    //         let currEdge = edge;

    //         const path = [edge];
    //         const pathNodes = [edge.startNode, edge.endNode];

    //         // CanvansDrawingEngine?.drawEdge(edge, "blue");

    //         let i = 0;
    //         while (true) {
    //             // await this.wait(1000);
    //             i += 1;
    //             if (i == 1000) {
    //                 break;
    //             }
    //             const nextEdgeId = graph.getClockwiseMostNode(currEdge, nextNode, (edgeId: string) => {
    //                 // console.log(this.id)
    //                 return Object.values(this.streets).some(s => s.id == edgeId);
    //             });
    //             if (!nextEdgeId) {
    //                 console.log("not enxt edge")
    //                 break;
    //             }

    //             currEdge = graph.edges[nextEdgeId];
    //             const randomColor = Math.floor(Math.random() * 16777215).toString(16);
    //             // CanvansDrawingEngine?.drawEdge(currEdge, "#" + randomColor);

    //             nextNode = currEdge.startNode.id == nextNode.id ? currEdge.endNode : currEdge.startNode;

    //             if (nextNode.id != edge.startNode.id) {
    //                 pathNodes.push(nextNode);
    //             }

    //             path.push(currEdge);
    //             // cycle found
    //             if (nextNode.id == edge.startNode.id) {
    //                 if (path.every(s => s.hierarchy == Hierarchy.Major || s.hierarchy == Hierarchy.Minor)) break; // do not include outside cycle
    //                 const lot = new Lot(pathNodes, path, Hierarchy.Lot);
    //                 if (!this.subfacesDict[lot.id]) {
    //                     this.subfaces.push(lot);
    //                     this.subfacesDict[lot.id] = lot;
    //                     graph.lostDict[lot.id] = (lot);
    //                     // CanvansDrawingEngine?.fillCircle(pathNodes, 'orange');
    //                 }
    //                 break;
    //             }
    //         }
    //         console.log("subfaces", this.subfaces)
    //     }
    // }

}

export class Lot extends Block {}