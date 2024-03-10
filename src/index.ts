import { CanvasDrawingEngine } from "./drawingEngine/CanvasDrawingEngine";
import { DrawingConfiguration } from "./drawingEngine/IDrawingEngine";
import { CityGenerator } from "./generator/CityGenerator";
import SimulationConfiguration from "./simulationConfiguration";
import { StreetGraph } from "./types/StreetGraph";

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
        fillFaces: true,
        drawMajorNodes: true,
        drawMinorNodes: true,
        drawNewPoints: false,
        drawGrowthCenters: false
    }

    const canvansDrawingEngine = new CanvasDrawingEngine(ctx, SimulationConfiguration, canvas.width, canvas.height, drawingConfiguration);
    const cityGenerator = new CityGenerator(SimulationConfiguration);
    canvansDrawingEngine.drawStreets(cityGenerator.streetGraph);



    // view configuration settings
    const fillFaces = (document.getElementById("fillFaces") as HTMLInputElement);
    const drawMajorNodes = (document.getElementById("drawMajorNodes") as HTMLInputElement);
    const drawMinorNodes = (document.getElementById("drawMinorNodes") as HTMLInputElement);
    const showNewNodes = (document.getElementById("showNewNodes") as HTMLInputElement);
    const showGrowthCenters = (document.getElementById("showGrowthCenters") as HTMLInputElement);

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
    const calcualteFaces = document.getElementById("calcualteFaces");
    if (calcualteFaces) calcualteFaces.onclick = () => {
        if (currentStreetGraph) currentStreetGraph.calcualteFaces();
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
        currentStreetGraph?.calcualteFace(edgeId);
    }

    cycleFindButton?.addEventListener("click", findCycle);

}


init();