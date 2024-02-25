import { StreetGraph } from "../types/StreetGraph";
import { IDrawingEngine } from "./IDrawingEngine";

export class CanvasDrawingEngine implements IDrawingEngine {

    context: CanvasRenderingContext2D;
    offsetX: number;
    offsetY: number;

    constructor(context: CanvasRenderingContext2D) {
        this.context = context;
        this.offsetX = 1920 / 2;
        this.offsetY = 1080 / 2;
    }

    drawStreets(streetGraph: StreetGraph): void {

        for (let edge of streetGraph.edges) {
            this.context.lineWidth = edge.width;
            this.context.beginPath();
            this.context.moveTo(edge.startNode.position.x + this.offsetX, edge.startNode.position.y * (-1) + this.offsetY);
            this.context.lineTo(edge.endNode.position.x + this.offsetX, edge.endNode.position.y * (-1) + this.offsetY);
            this.context.stroke();
        }
    }
}