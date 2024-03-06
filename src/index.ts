import { CanvasDrawingEngine } from "./drawingEngine/CanvasDrawingEngine";
import { CityGenerator } from "./generator/CityGenerator";
import SimulationConfiguration from "./simulationConfiguration";

const init = () => {
    const canvas = <HTMLCanvasElement>document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    let SCALE = 1;
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

    const zoomIn = document.getElementById('zoomIn');
    const zoomOut = document.getElementById('zoomOut');
    zoomIn?.addEventListener("click", () => {
        SCALE *= 1.5;
        canvansDrawingEngine.setScale(SCALE);
        canvansDrawingEngine.drawStreets(currentStreetGraph!);
    });
    zoomOut?.addEventListener("click", () => {
        SCALE /= 1.5;
        canvansDrawingEngine.setScale(SCALE);
        canvansDrawingEngine.drawStreets(currentStreetGraph!);
    });

    canvansDrawingEngine.drawStreets(cityGenerator.streetGraph);
}


init();