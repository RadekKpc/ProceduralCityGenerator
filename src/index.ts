import { CanvasDrawingEngine } from "./drawingEngine/CanvasDrawingEngine";
import { CityGenerator } from "./generator/CityGenerator";
import SimulationConfiguration from "./simulationConfiguration";

const init = () => {
    const canvas = <HTMLCanvasElement>document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    let SCALE = 1;
    let drag = false;
    let dragStartX = 0;
    let dragStartY = 0;

    let currentStreetGraph = null;

    if (!ctx) return;

    const canvansDrawingEngine = new CanvasDrawingEngine(ctx);
    const cityGenerator = new CityGenerator(SimulationConfiguration);

    const nextTick = () => {
        const { value: streetGraph, done } = cityGenerator.next();
        currentStreetGraph = streetGraph;
        if (done) {
            alert('Generation done!');
            return;
        }
        canvansDrawingEngine.drawStreets(streetGraph);
    }

    const nextTickButton = document.getElementById("nextTickButton");
    if (nextTickButton) {
        nextTickButton.onclick = nextTick;
    }

    const interval = setInterval(nextTick, 0);

    const stopButton = document.getElementById("stop");

    if (stopButton) {
        stopButton.onclick = () => clearInterval(interval);
    }

    canvansDrawingEngine.drawStreets(cityGenerator.streetGraph);

    // UI FUNCTIONS
    // ZOOMING
    const zoomIn = document.getElementById('zoomIn');
    const zoomOut = document.getElementById('zoomOut');

    const zoomInCallback = () => {
        SCALE *= 1.5;
        canvansDrawingEngine.setScale(SCALE);
        canvansDrawingEngine.drawStreets(currentStreetGraph!);
    }

    const zoomOutCallback = () => {
        SCALE /= 1.5;
        canvansDrawingEngine.setScale(SCALE);
        canvansDrawingEngine.drawStreets(currentStreetGraph!);
    }

    zoomIn?.addEventListener("click", zoomInCallback);
    zoomOut?.addEventListener("click", zoomOutCallback);


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

}


init();