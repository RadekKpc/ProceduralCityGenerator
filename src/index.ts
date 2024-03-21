import { CanvasDrawingEngine } from "./drawingEngine/CanvasDrawingEngine";
import { DrawingConfiguration } from "./drawingEngine/IDrawingEngine";
import { CityGenerator } from "./generator/CityGenerator";
import SimulationConfiguration from "./simulationConfiguration";
import { Point } from "./types/BaseTypes";
import { StreetGraph } from "./types/StreetGraph";


const canvas = <HTMLCanvasElement>document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const drawingConfiguration: DrawingConfiguration = {
    fillLots: true,
    fillBlocks: true,
    fillFaces: true,
    drawMajorNodes: true,
    drawMinorNodes: true,
    showLotNodes: true,
    drawGrowthCenters: false
}

export const CanvansDrawingEngine = new CanvasDrawingEngine(ctx, SimulationConfiguration, canvas.width, canvas.height, drawingConfiguration);

const init = () => {
    let SCALE = 1;
    let drag = false;
    let dragStartX = 0;
    let dragStartY = 0;

    let currentStreetGraph: StreetGraph | null = null;

    const cityGenerator = new CityGenerator(SimulationConfiguration);
    CanvansDrawingEngine.drawStreets(cityGenerator.streetGraph);



    // view configuration settings
    const fillLots = (document.getElementById("fillLots") as HTMLInputElement);
    const fillFaces = (document.getElementById("fillFaces") as HTMLInputElement);
    const fillBlocks = (document.getElementById("fillBlocks") as HTMLInputElement);
    const drawMajorNodes = (document.getElementById("drawMajorNodes") as HTMLInputElement);
    const drawMinorNodes = (document.getElementById("drawMinorNodes") as HTMLInputElement);
    const showLotNodes = (document.getElementById("showLotNodes") as HTMLInputElement);
    const showGrowthCenters = (document.getElementById("showGrowthCenters") as HTMLInputElement);

    fillLots.onclick = () => {
        CanvansDrawingEngine.changeDrawingConiguration({ fillLots: fillLots.checked });
        CanvansDrawingEngine.redrawStreetGraph();
    }

    fillBlocks.onclick = () => {
        CanvansDrawingEngine.changeDrawingConiguration({ fillBlocks: fillBlocks.checked });
        CanvansDrawingEngine.redrawStreetGraph();
    }

    fillFaces.onclick = () => {
        CanvansDrawingEngine.changeDrawingConiguration({ fillFaces: fillFaces.checked });
        CanvansDrawingEngine.redrawStreetGraph();
    }

    drawMajorNodes.onclick = () => {
        CanvansDrawingEngine.changeDrawingConiguration({ drawMajorNodes: drawMajorNodes.checked });
        CanvansDrawingEngine.redrawStreetGraph();
    }

    drawMinorNodes.onclick = () => {
        CanvansDrawingEngine.changeDrawingConiguration({ drawMinorNodes: drawMinorNodes.checked });
        CanvansDrawingEngine.redrawStreetGraph();
    }

    showLotNodes.onclick = () => {
        CanvansDrawingEngine.changeDrawingConiguration({ showLotNodes: showLotNodes.checked });
        CanvansDrawingEngine.redrawStreetGraph();
    }

    showGrowthCenters.onclick = () => {
        CanvansDrawingEngine.changeDrawingConiguration({ drawGrowthCenters: showGrowthCenters.checked });
        CanvansDrawingEngine.redrawStreetGraph();
    }

    const centerView = document.getElementById("centerView");
    if (centerView) centerView.onclick = () => {
        CanvansDrawingEngine.resetScale();
        CanvansDrawingEngine.redrawStreetGraph();
    }

    // simulaton control
    const stopButton = document.getElementById("stop");
    const startButton = document.getElementById("start");
    const nextTickButton = document.getElementById("nextTickButton");

    const nextTick = () => {
        const { value: streetGraph, done } = cityGenerator.next();
        currentStreetGraph = streetGraph;

        if (done) {
            alert('Generation done!');
            return;
        }
        CanvansDrawingEngine.drawStreets(streetGraph);
    }

    if (nextTickButton) nextTickButton.onclick = nextTick;
    if (stopButton) stopButton.style.display = 'none';
    if (startButton) startButton.onclick = () => {
        const interval = setInterval(nextTick, 0);
        if (stopButton) {
            stopButton.onclick = () => {
                clearInterval(interval);
                startButton.style.display = 'inline-block';
                stopButton.style.display = 'none';
                cityGenerator.extractFacesFromGraph();
                cityGenerator.generateSecondaryRoads();
                cityGenerator.expandMinorStreets();
                cityGenerator.extractBlocksFromFace();
                CanvansDrawingEngine.redrawStreetGraph();
            }
            startButton.style.display = 'none';
            stopButton.style.display = 'inline-block';
        }
    }


    // action buttons
    const calculateFaces = document.getElementById("calculateFaces");
    if (calculateFaces) calculateFaces.onclick = () => {
        if (currentStreetGraph) cityGenerator.extractFacesFromGraph();
        CanvansDrawingEngine.redrawStreetGraph();
    }

    // const splitFaces = document.getElementById("splitFaces");
    // if (splitFaces) splitFaces.onclick = () => {
    //     if (currentStreetGraph) cityGenerator.splitFaces();
    //     CanvansDrawingEngine.redrawStreetGraph();
    // }

    const generateSecondaryRoads = document.getElementById("generateSecondaryRoads");
    if (generateSecondaryRoads) generateSecondaryRoads.onclick = () => {
        if (currentStreetGraph) cityGenerator.generateSecondaryRoads();
        CanvansDrawingEngine.redrawStreetGraph();
    }

    const expandMinorStreets = document.getElementById("expandMinorStreets");
    if (expandMinorStreets) expandMinorStreets.onclick = () => {
        if (currentStreetGraph) cityGenerator.expandMinorStreets();
        CanvansDrawingEngine.redrawStreetGraph();
    }

    const calculateBlocks = document.getElementById("calculateBlocks");
    if (calculateBlocks) calculateBlocks.onclick = () => {
        if (currentStreetGraph) cityGenerator.extractBlocksFromFace();
        CanvansDrawingEngine.redrawStreetGraph();
    }

    // const calculateNextBlock = document.getElementById("calculateNextBlock");
    // if (calculateNextBlock) calculateNextBlock.onclick = () => {
    //     if (currentStreetGraph) cityGenerator.extractBlocksFromNextFace();
    //     CanvansDrawingEngine.redrawStreetGraph();
    // }

    const generateLots = document.getElementById('generateLots');
    if (generateLots) generateLots.onclick = () => {
        if (currentStreetGraph) cityGenerator.splitBlocksOnLots();
        CanvansDrawingEngine.redrawStreetGraph();
    }


    // ZOOMING

    const zoomInCallback = () => {
        SCALE *= 1.5;
        CanvansDrawingEngine.setScale(SCALE);
        CanvansDrawingEngine.redrawStreetGraph();
    }

    const zoomOutCallback = () => {
        SCALE /= 1.5;
        CanvansDrawingEngine.setScale(SCALE);
        CanvansDrawingEngine.redrawStreetGraph();
    }


    canvas.addEventListener('wheel', (e) => {
        if (e.deltaY > 0) {
            zoomInCallback();
        } else {
            zoomOutCallback();
        }
    });

    // DOUBLE CLICK

    canvas.addEventListener('dblclick', async (e) => {
        if (!currentStreetGraph) return;
        const realPositionX = CanvansDrawingEngine.pixelToPositionX(e.x - 8);
        const realPositionY = CanvansDrawingEngine.pixelToPositionY(e.y - 8);
        const clickPointPosition = new Point(realPositionX, realPositionY);
        const scanR = 1;

        const nodes = currentStreetGraph.nodes.filter(n => n.position.distance(clickPointPosition) < scanR);

        for (let n of nodes) {
            console.log(n.id, currentStreetGraph.clockwiseEdgesOrder[n.id])

            for (let e of currentStreetGraph.clockwiseEdgesOrder[n.id]) {
                CanvansDrawingEngine.drawEdge(currentStreetGraph.edges[e], 'red');
                await new Promise(res => setTimeout(res, 200))
            }

        }
        const face = Object.values(currentStreetGraph.facesDict).find((f) => f.traingles.some(t => f.isInTriangle(t, clickPointPosition)));
        const block = Object.values(currentStreetGraph.blocksDict).find((f) => f.traingles.some(t => f.isInTriangle(t, clickPointPosition)));
        const lot = Object.values(currentStreetGraph.blocksDict).flatMap(b => Object.values(b.subfacesDict)).find((f) => f.traingles.some(t => f.isInTriangle(t, clickPointPosition)));
        console.log(currentStreetGraph.lostDict)
        if (face) {
            CanvansDrawingEngine.drawFace(face, 'purple');
            (document.getElementById('face') as HTMLInputElement).value = face.id;
            console.log(face);
        }

        if (block) {
            CanvansDrawingEngine.drawFace(block, 'orange');
            (document.getElementById('block') as HTMLInputElement).value = block.id;
            console.log(block);
        }

        if (lot) {
            CanvansDrawingEngine.drawFace(lot, 'green');
            console.log(lot);
        }
    });

    // MOVING CANVAS POSITION AROUND

    canvas.addEventListener('mousedown', (e) => {
        dragStartX = e.pageX;
        dragStartY = e.pageY;
        drag = true;
    });

    canvas.addEventListener('mouseup', (e) => {
        const diffX = e.pageX - dragStartX;
        const diffY = e.pageY - dragStartY;
        CanvansDrawingEngine.addUserOffsetX(diffX);
        CanvansDrawingEngine.addUserOffsetY(diffY);

        CanvansDrawingEngine.setTmpUserOffsetX(0);
        CanvansDrawingEngine.setTmpUserOffsetY(0);

        CanvansDrawingEngine.drawStreets(cityGenerator.streetGraph);
        drag = false
    });

    canvas.addEventListener('mousemove', (e) => {
        if (drag) {
            const diffX = e.pageX - dragStartX;
            const diffY = e.pageY - dragStartY;
            CanvansDrawingEngine.setTmpUserOffsetX(diffX);
            CanvansDrawingEngine.setTmpUserOffsetY(diffY);
            CanvansDrawingEngine.drawStreets(cityGenerator.streetGraph);
        }
    });

    // print node info
    const printNodeinfoButton = document.getElementById('printNodeinfo');

    const printNodeInfo = (nodeId: number, color: string) => {
        const node = currentStreetGraph?.nodes.find((n) => n.id == nodeId);
        if (node) {
            CanvansDrawingEngine.drawNode(node, color)
            const nodeAngles = currentStreetGraph?.clockwiseEdgesOrder[nodeId];

            console.log(`node ${nodeId}`, node);
            console.log(`nodeAngles ${nodeId}`, nodeAngles);
            console.log(`graph ${nodeId}`, currentStreetGraph?.graph[nodeId]);
        } else {
            console.log('node do not exists')
        }
    }

    const printNodeinfoCb = () => {
        const nodeId = (document.getElementById('nodeid') as HTMLInputElement).value;
        printNodeInfo(Number(nodeId), 'blue')
    }

    printNodeinfoButton?.addEventListener("click", printNodeinfoCb);

    // print edge info
    const printEdgeinfoButton = document.getElementById('printEdgeinfo');
    const printEdgeinfo = () => {
        const edgeId = (document.getElementById('edgeId') as HTMLInputElement).value;
        const edge = currentStreetGraph?.edges[edgeId];
        if (edge) {
            CanvansDrawingEngine.drawEdge(edge, 'blue')

            printNodeInfo(edge.startNode.id, 'green');
            printNodeInfo(edge.endNode.id, 'red');
        } else {
            console.log(`edge ${edgeId} do not exists`)
        }

    }

    printEdgeinfoButton?.addEventListener("click", printEdgeinfo);

    // cycle find

    // const cycleFindButton = document.getElementById('cycleFound');

    // const findCycle = () => {
    //     const edgeId = (document.getElementById('edgeId2') as HTMLInputElement).value;
    //     currentStreetGraph?.calculateFace(edgeId);
    // }

    // cycleFindButton?.addEventListener("click", findCycle);

    // face highlite

    const printFaceInfo = document.getElementById('printFaceInfo');
    const printFaceInfoCb = () => {
        const faceId = (document.getElementById('face') as HTMLInputElement).value;
        const face = currentStreetGraph?.facesDict[faceId];
        if (face) {
            CanvansDrawingEngine.drawFace(face, 'blue')

            console.log(face);
        } else {
            console.log(`edge ${faceId} do not exists`)
        }

    }

    printFaceInfo?.addEventListener("click", printFaceInfoCb);

    // // run cycle
    // const runBlocksAlgo = document.getElementById('runBlocksAlgo');
    // const runBlocksAlgoCb = () => {
    //     const faceId = (document.getElementById('face') as HTMLInputElement).value;
    //     const delay = (document.getElementById('delay') as HTMLInputElement).value;
    //     const face = currentStreetGraph?.facesDict[faceId];
    //     if (face) {
    //         currentStreetGraph?.extractBlockFromFace(face, Number(delay));
    //         CanvansDrawingEngine.redrawStreetGraph();
    //         console.log(face);
    //     } else {
    //         console.log(`edge ${faceId} do not exists`)
    //     }

    // }

    // runBlocksAlgo?.addEventListener("click", runBlocksAlgoCb);

    // // run block
    // const blockFoundEdge = document.getElementById('blockFoundEdge');
    // const blockFoundEdgeCb = () => {
    //     const edgeId = (document.getElementById('edgeId2') as HTMLInputElement).value;
    //     const delay = (document.getElementById('delay') as HTMLInputElement).value;
    //     const faceId = (document.getElementById('face') as HTMLInputElement).value;
    //     const face = currentStreetGraph?.facesDict[faceId];
    //     const edge = currentStreetGraph?.edges[faceId];
    //     if (edge && face) {
    //         currentStreetGraph?.extractBlockFromFaceEdge(face, edge /*, Number(delay)*/);
    //         CanvansDrawingEngine.redrawStreetGraph();
    //         console.log(edgeId);
    //     } else {
    //         console.log(`edge ${edgeId} do not exists or face ${face} ${edge}`)
    //     }

    // }

    // blockFoundEdge?.addEventListener("click", blockFoundEdgeCb);

    // run lot split
    const splitIntoLots = document.getElementById('splitToLots');
    const splitIntoLotsCb = () => {
        const blockId = (document.getElementById('block') as HTMLInputElement).value;
        const block = currentStreetGraph?.blocksDict[blockId];
        if (block) {
            console.log(block);
            currentStreetGraph?.splitBlocksOnLot(block,  /*, Number(delay)*/);
            CanvansDrawingEngine.redrawStreetGraph();
        } else {
            console.log(`edge ${blockId} do not exists or block ${block}`)
        }

    }

    splitIntoLots?.addEventListener("click", splitIntoLotsCb);


}


init();