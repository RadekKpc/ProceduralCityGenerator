// CITY GENERATOR:



    //tmp
    // nextFace: number = 0;
    // splitNextFace() {
    //     this.streetGraph.pointsToDraw = [];
    //     this.streetGraph.trainglesToDraw = [];
    //     const face = Object.values(this.streetGraph.facesDict)[this.nextFace %Object.values(this.streetGraph.facesDict).length];
    //     for (let i = 0; i < 10; i++) {
    //         const point = face.getRandomPointFromFace();
    //         this.streetGraph.pointsToDraw.push(point);
    //     }
    //     for (let traingle of face.traingles) {
    //         this.streetGraph.trainglesToDraw.push(traingle);
    //     }
    //     this.nextFace += 1;
    // }

    //tmp
    // splitFaces() {
    //     for (let face of Object.values(this.streetGraph.facesDict)) {
    //         for (let traingle of face.traingles) {
    //             this.streetGraph.trainglesToDraw.push(traingle);
    //         }
    //         for (let i = 0; i < 10; i++) {
    //             const point = face.getRandomPointFromFace();
    //             this.streetGraph.pointsToDraw.push(point);
    //         }
    //     }
    // }


// STREET GRAPH:

// TMP
// calculateFace(edgeId: string) {

//     const edge = this.edges[edgeId];
//     if (!edge) return;

//     let nextNode = edge.endNode;
//     let currEdge = edge;

//     const path = [edge];
//     const pathNodes = [edge.startNode, edge.endNode];

//     this.canvansDrawingEngine?.drawEdge(edge, "blue");

//     while (true) {

//         // await this.wait(100);
//         const nextEdgeId = this.getClockwiseMostNode(currEdge, nextNode);
//         if (!nextEdgeId) break;

//         currEdge = this.edges[nextEdgeId];
//         const randomColor = Math.floor(Math.random() * 16777215).toString(16);
//         this.canvansDrawingEngine?.drawEdge(currEdge, "#" + randomColor);

//         nextNode = currEdge.startNode.id == nextNode.id ? currEdge.endNode : currEdge.startNode;

//         pathNodes.push(nextNode);
//         path.push(currEdge);

//         if (nextNode.id == edge.startNode.id) {
//             const face = new Face(pathNodes, path, this.canvansDrawingEngine);
//             if (!this.facesDict[face.id]) this.facesDict[face.id] = face;
//             this.canvansDrawingEngine?.fillCircle(pathNodes, 'orange');
//             break;
//         }
//     }

//     while (true) {

//         // await this.wait(100);
//         const nextEdgeId = this.getCounterclockwiseMostNode(currEdge, nextNode);
//         if (!nextEdgeId) break;

//         currEdge = this.edges[nextEdgeId];
//         const randomColor = Math.floor(Math.random() * 16777215).toString(16);
//         this.canvansDrawingEngine?.drawEdge(currEdge, "#" + randomColor);

//         nextNode = currEdge.startNode.id == nextNode.id ? currEdge.endNode : currEdge.startNode;

//         pathNodes.push(nextNode);
//         path.push(currEdge);

//         if (nextNode.id == edge.startNode.id) {
//             const face = new Face(pathNodes, path, this.canvansDrawingEngine);
//             if (!this.facesDict[face.id]) this.facesDict[face.id] = face;
//             this.canvansDrawingEngine?.fillCircle(pathNodes, 'orange');
//             break;
//         }
//     }
// }

// // TMP
// extractBlockFromFace(i: number | Face, howfast = 1) {
//     let face: Face;
//     if (typeof i == "number") {
//         face = this.facesList[i % this.facesList.length];
//     } else {
//         face = i;
//     }

//     face.blocks = [];
//     this.blocksList = [];
//     this.blocksDict = {};

//     for (let edge of face.streets) {

//         let nextNode = edge.endNode;
//         let currEdge = edge;

//         const path = [edge];
//         const pathNodes = [edge.startNode, edge.endNode];

//         this.canvansDrawingEngine?.drawEdge(edge, "blue");

//         while (true) {

//             const nextEdgeId = this.getClockwiseMostNode(currEdge, nextNode, (edgeId: string) => face.streets.some(s => s.id == edgeId));

//             if (!nextEdgeId) break;

//             currEdge = this.edges[nextEdgeId];
//             const randomColor = Math.floor(Math.random() * 16777215).toString(16);
//             this.canvansDrawingEngine?.drawEdge(currEdge, "#" + randomColor);

//             nextNode = currEdge.startNode.id == nextNode.id ? currEdge.endNode : currEdge.startNode;

//             if (nextNode.id != edge.startNode.id) {
//                 pathNodes.push(nextNode);
//             }

//             path.push(currEdge);

//             // cycle found
//             if (nextNode.id == edge.startNode.id) {
//                 const face = new Block(pathNodes, path, this.canvansDrawingEngine);
//                 if (!this.blocksDict[face.id]) {
//                     this.blocksDict[face.id] = face;
//                     this.blocksList.push(face);
//                 }

//                 face.blocks.push(face);
//                 this.canvansDrawingEngine?.fillCircle(pathNodes, 'orange');
//                 break;
//             }
//         }
//     }

// }

// TMP
// extractBlockFromFaceEdge(face: Face, edge: StreetEdge) {

//     this.blocksList = [];
//     this.blocksDict = {};

//     let nextNode = edge.endNode;
//     let currEdge = edge;

//     const path = [edge];
//     const pathNodes = [edge.startNode, edge.endNode];


//     while (true) {

//         const nextEdgeId = this.getClockwiseMostNode(currEdge, nextNode, (edgeId: string) => face.streets.some(s => s.id == edgeId));

//         if (!nextEdgeId) break;

//         currEdge = this.edges[nextEdgeId];
//         const randomColor = Math.floor(Math.random() * 16777215).toString(16);
//         this.canvansDrawingEngine?.drawEdge(currEdge, "#" + randomColor);

//         nextNode = currEdge.startNode.id == nextNode.id ? currEdge.endNode : currEdge.startNode;

//         if (nextNode.id != edge.startNode.id) {
//             pathNodes.push(nextNode);
//         }

//         path.push(currEdge);
//         // cycle found
//         if (nextNode.id == edge.startNode.id) {
//             const face = new Block(pathNodes, path, this.canvansDrawingEngine);
//             if (!this.blocksDict[face.id]) {
//                 this.blocksDict[face.id] = face;
//                 this.blocksList.push(face);
//             }

//             face.blocks.push(face);
//             this.canvansDrawingEngine?.fillCircle(pathNodes, 'orange');
//             break;
//         }
//     }
// }