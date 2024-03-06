import { StreetGraph } from "../types/StreetGraph";
import { IDrawingEngine } from "./IDrawingEngine";

export class CanvasDrawingEngine implements IDrawingEngine {

    context: CanvasRenderingContext2D;
    offsetX: number;
    offsetY: number;
    SCALE: number;

    constructor(context: CanvasRenderingContext2D) {
        this.context = context;
        this.offsetX = 1920 / 2;
        this.offsetY = 1080 / 2;
        this.SCALE = 1;
    }

    setScale(scale: number) {
        this.SCALE = scale;
    }

    drawStreets(streetGraph: StreetGraph): void {
        this.context.clearRect(0, 0, 1920, 1080);

        this.context.fillStyle = "black";

        for (let edge of streetGraph.edges) {
            this.context.lineWidth = edge.width;
            this.context.beginPath();
            this.context.moveTo((edge.startNode.position.x * this.SCALE) + this.offsetX, (edge.startNode.position.y * (-1) * this.SCALE + this.offsetY));
            this.context.lineTo((edge.endNode.position.x * this.SCALE) + this.offsetX, (edge.endNode.position.y * (-1) * this.SCALE + this.offsetY));
            this.context.stroke();
        }

        this.context.fillStyle = "red";

        for (let newPoint of streetGraph.newPoints) {
            this.context.fillRect(newPoint.x * this.SCALE + this.offsetX, newPoint.y * (-1) * this.SCALE + this.offsetY, 5, 5);
        }
    }
}