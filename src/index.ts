import { CanvasDrawingEngine } from "./drawingEngine/CanvasDrawingEngine";
import { DrawingConfiguration } from "./drawingEngine/IDrawingEngine";
import { CityGenerator } from "./generator/CityGenerator";
import SimulationConfiguration from "./simulationConfiguration";
import { Hierarchy, Point, StreetGraph, StreetNode } from "./types/StreetGraph";

const init = () => {
    const canvas = <HTMLCanvasElement>document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    let SCALE = 1;
    let drag = false;
    let dragStartX = 0;
    let dragStartY = 0;

    let currentStreetGraph: StreetGraph | null = null;

    if (!ctx) return;

    const drawingConfiguration: DrawingConfiguration = {
        fillBlocks: true,
        fillFaces: true,
        drawMajorNodes: true,
        drawMinorNodes: true,
        drawNewPoints: false,
        drawGrowthCenters: false
    }

    const canvansDrawingEngine = new CanvasDrawingEngine(ctx, SimulationConfiguration, canvas.width, canvas.height, drawingConfiguration);
    const cityGenerator = new CityGenerator(SimulationConfiguration);
    cityGenerator.streetGraph.setCanvansDrawingEngine(canvansDrawingEngine);
    canvansDrawingEngine.drawStreets(cityGenerator.streetGraph);



    // view configuration settings
    const fillFaces = (document.getElementById("fillFaces") as HTMLInputElement);
    const fillBlocks = (document.getElementById("fillBlocks") as HTMLInputElement);
    const drawMajorNodes = (document.getElementById("drawMajorNodes") as HTMLInputElement);
    const drawMinorNodes = (document.getElementById("drawMinorNodes") as HTMLInputElement);
    const showNewNodes = (document.getElementById("showNewNodes") as HTMLInputElement);
    const showGrowthCenters = (document.getElementById("showGrowthCenters") as HTMLInputElement);

    fillBlocks.onclick = () => {
        canvansDrawingEngine.changeDrawingConiguration({ fillBlocks: fillBlocks.checked });
        canvansDrawingEngine.redrawStreetGraph();
    }

    fillFaces.onclick = () => {
        canvansDrawingEngine.changeDrawingConiguration({ fillFaces: fillFaces.checked });
        canvansDrawingEngine.redrawStreetGraph();
    }

    drawMajorNodes.onclick = () => {
        canvansDrawingEngine.changeDrawingConiguration({ drawMajorNodes: drawMajorNodes.checked });
        canvansDrawingEngine.redrawStreetGraph();
    }

    drawMinorNodes.onclick = () => {
        canvansDrawingEngine.changeDrawingConiguration({ drawMinorNodes: drawMinorNodes.checked });
        canvansDrawingEngine.redrawStreetGraph();
    }

    showNewNodes.onclick = () => {
        canvansDrawingEngine.changeDrawingConiguration({ drawNewPoints: showNewNodes.checked });
        canvansDrawingEngine.redrawStreetGraph();
    }

    showGrowthCenters.onclick = () => {
        canvansDrawingEngine.changeDrawingConiguration({ drawGrowthCenters: showGrowthCenters.checked });
        canvansDrawingEngine.redrawStreetGraph();
    }

    const centerView = document.getElementById("centerView");
    if (centerView) centerView.onclick = () => {
        canvansDrawingEngine.resetScale();
        canvansDrawingEngine.redrawStreetGraph();
    }

    // simulaton control
    const stopButton = document.getElementById("stop");
    const startButton = document.getElementById("start");
    const nextTickButton = document.getElementById("nextTickButton");

    const nextTick = () => {
        const { value: streetGraph, done } = cityGenerator.next();
        currentStreetGraph = streetGraph;
        streetGraph.setCanvansDrawingEngine(canvansDrawingEngine)

        if (done) {
            alert('Generation done!');
            return;
        }
        canvansDrawingEngine.drawStreets(streetGraph);
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
            }
            startButton.style.display = 'none';
            stopButton.style.display = 'inline-block';
        }
    }


    // action buttons
    const calculateFaces = document.getElementById("calculateFaces");
    if (calculateFaces) calculateFaces.onclick = () => {
        if (currentStreetGraph) cityGenerator.extractFacesFromGraph();
        canvansDrawingEngine.redrawStreetGraph();
    }

    const splitFaces = document.getElementById("splitFaces");
    if (splitFaces) splitFaces.onclick = () => {
        if (currentStreetGraph) cityGenerator.splitFaces();
        canvansDrawingEngine.redrawStreetGraph();
    }

    const generateSecondaryRoads = document.getElementById("generateSecondaryRoads");
    if (generateSecondaryRoads) generateSecondaryRoads.onclick = () => {
        if (currentStreetGraph) cityGenerator.generateSecondaryRoads();
        canvansDrawingEngine.redrawStreetGraph();
    }

    const expandMinorStreets = document.getElementById("expandMinorStreets");
    if (expandMinorStreets) expandMinorStreets.onclick = () => {
        if (currentStreetGraph) cityGenerator.expandMinorStreets();
        canvansDrawingEngine.redrawStreetGraph();
    }

    const calculateBlocks = document.getElementById("calculateBlocks");
    if (calculateBlocks) calculateBlocks.onclick = () => {
        if (currentStreetGraph) cityGenerator.extractBlocksFromFace();
        canvansDrawingEngine.redrawStreetGraph();
    }

    const calculateNextBlock = document.getElementById("calculateNextBlock");
    if (calculateNextBlock) calculateNextBlock.onclick = () => {
        if (currentStreetGraph) cityGenerator.extractBlocksFromNextFace();
        canvansDrawingEngine.redrawStreetGraph();
    }


    // ZOOMING

    const zoomInCallback = () => {
        SCALE *= 1.5;
        canvansDrawingEngine.setScale(SCALE);
        canvansDrawingEngine.redrawStreetGraph();
    }

    const zoomOutCallback = () => {
        SCALE /= 1.5;
        canvansDrawingEngine.setScale(SCALE);
        canvansDrawingEngine.redrawStreetGraph();
    }


    canvas.addEventListener('wheel', (e) => {
        if (e.deltaY > 0) {
            zoomInCallback();
        } else {
            zoomOutCallback();
        }
    });

    // DOUBLE CLICK

    canvas.addEventListener('dblclick', (e) => {
        if (!currentStreetGraph) return;
        const realPositionX = canvansDrawingEngine.pixelToPositionX(e.x - 8);
        const realPositionY = canvansDrawingEngine.pixelToPositionY(e.y - 8);
        const clickPointPosition = new Point(realPositionX, realPositionY);
        const scanR = 50;

        const nodes = currentStreetGraph.nodes.filter(n => n.position.distance(clickPointPosition) < scanR);

        const face = currentStreetGraph.facesList.find((f) => f.traingles.some(t => f.isInTriangle(t, clickPointPosition)));
        const block = currentStreetGraph.blocksList.find((f) => f.traingles.some(t => f.isInTriangle(t, clickPointPosition)));

        if (face) {
            canvansDrawingEngine.drawFace(face, 'purple');
            console.log(face);
        }

        if (block) {
            canvansDrawingEngine.drawFace(block, 'orange')
            console.log(block);
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
        canvansDrawingEngine.addUserOffsetX(diffX);
        canvansDrawingEngine.addUserOffsetY(diffY);

        canvansDrawingEngine.setTmpUserOffsetX(0);
        canvansDrawingEngine.setTmpUserOffsetY(0);

        canvansDrawingEngine.drawStreets(cityGenerator.streetGraph);
        drag = false
    });

    canvas.addEventListener('mousemove', (e) => {
        if (drag) {
            const diffX = e.pageX - dragStartX;
            const diffY = e.pageY - dragStartY;
            canvansDrawingEngine.setTmpUserOffsetX(diffX);
            canvansDrawingEngine.setTmpUserOffsetY(diffY);
            canvansDrawingEngine.drawStreets(cityGenerator.streetGraph);
        }
    });

    // print node info
    const printNodeinfoButton = document.getElementById('printNodeinfo');

    const printNodeInfo = (nodeId: number, color: string) => {
        const node = currentStreetGraph?.nodes.find((n) => n.id == nodeId);
        if (node) {
            canvansDrawingEngine.drawNode(node, color)
            const nodeAngles = currentStreetGraph?.clockwiseEdgesOrder[nodeId];

            console.log(`node ${nodeId}`, node);
            console.log(`nodeAngles ${nodeId}`, nodeAngles);
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
            canvansDrawingEngine.drawEdge(edge, 'blue')

            printNodeInfo(edge.startNode.id, 'green');
            printNodeInfo(edge.endNode.id, 'red');
        } else {
            console.log(`edge ${edgeId} do not exists`)
        }

    }

    printEdgeinfoButton?.addEventListener("click", printEdgeinfo);

    // cycle find

    const cycleFindButton = document.getElementById('cycleFound');

    const findCycle = () => {
        const edgeId = (document.getElementById('edgeId2') as HTMLInputElement).value;
        currentStreetGraph?.calculateFace(edgeId);
    }

    cycleFindButton?.addEventListener("click", findCycle);

    // face highlite

    const printFaceInfo = document.getElementById('printFaceInfo');
    const printFaceInfoCb = () => {
        const faceId = (document.getElementById('face') as HTMLInputElement).value;
        const face = currentStreetGraph?.facesDict[faceId];
        if (face) {
            canvansDrawingEngine.drawFace(face, 'blue')

            console.log(face);
        } else {
            console.log(`edge ${faceId} do not exists`)
        }

    }

    printFaceInfo?.addEventListener("click", printFaceInfoCb);

    // run cycle
    const runBlocksAlgo = document.getElementById('runBlocksAlgo');
    const runBlocksAlgoCb = () => {
        const faceId = (document.getElementById('face') as HTMLInputElement).value;
        const delay = (document.getElementById('delay') as HTMLInputElement).value;
        const face = currentStreetGraph?.facesDict[faceId];
        if (face) {
            currentStreetGraph?.extractBlockFromFace(face, Number(delay));
            canvansDrawingEngine.redrawStreetGraph();
            console.log(face);
        } else {
            console.log(`edge ${faceId} do not exists`)
        }

    }

    runBlocksAlgo?.addEventListener("click", runBlocksAlgoCb);

    // run block
    const blockFoundEdge = document.getElementById('blockFoundEdge');
    const blockFoundEdgeCb = () => {
        const edgeId = (document.getElementById('edgeId2') as HTMLInputElement).value;
        const delay = (document.getElementById('delay') as HTMLInputElement).value;
        const faceId = (document.getElementById('face') as HTMLInputElement).value;
        const face = currentStreetGraph?.facesDict[faceId];
        const edge = currentStreetGraph?.edges[faceId];
        if (edge && face) {
            currentStreetGraph?.extractBlockFromFaceEdge(face, edge /*, Number(delay)*/);
            canvansDrawingEngine.redrawStreetGraph();
            console.log(edgeId);
        } else {
            console.log(`edge ${edgeId} do not exists or face ${face} ${edge}`)
        }

    }

    blockFoundEdge?.addEventListener("click", blockFoundEdgeCb);


}


init();