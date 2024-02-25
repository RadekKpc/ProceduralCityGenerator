import { CanvasDrawingEngine } from "./drawingEngine/CanvasDrawingEngine";
import { CityGenerator } from "./generator/CityGenerator";
import SimulationConfiguration from "./simulationConfiguration";

const init = () => {
    const canvas = <HTMLCanvasElement>document.getElementById("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    const canvansDrawingEngine = new CanvasDrawingEngine(ctx);
    const cityGenerator = new CityGenerator(SimulationConfiguration);

    const nextTick = () => {
        const { value: streetGraph, done } = cityGenerator.next();
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

    canvansDrawingEngine.drawStreets(cityGenerator.streetGraph);
}


init();