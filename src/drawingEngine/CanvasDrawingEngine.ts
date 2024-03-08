import { ISimulationConfiguration } from "../simulationConfiguration";
import { Point, StreetGraph } from "../types/StreetGraph";
import { IDrawingEngine } from "./IDrawingEngine";

export class CanvasDrawingEngine implements IDrawingEngine {

    context: CanvasRenderingContext2D;
    offsetX: number;
    offsetY: number;
    scale: number;
    userOffsetX: number;
    userOffsetY: number;
    tmpUserOffsetX: number;
    tmpUserOffsetY: number;
    simulationCofiguration: ISimulationConfiguration;

    constructor(context: CanvasRenderingContext2D, simulationCofiguration: ISimulationConfiguration) {
        this.context = context;
        this.offsetX = 1920 / 2;
        this.offsetY = 1080 / 2;
        this.scale = 1;
        this.userOffsetX = 0;
        this.userOffsetY = 0;
        this.tmpUserOffsetX = 0;
        this.tmpUserOffsetY = 0;
        this.simulationCofiguration = simulationCofiguration;
    }

    setScale(scale: number) {
        this.scale = scale;
    }

    addUserOffsetX(offset: number) {
        this.userOffsetX += offset;
    }

    addUserOffsetY(offset: number) {
        this.userOffsetY += offset;
    }

    setTmpUserOffsetX(offset: number) {
        this.tmpUserOffsetX = offset;
    }

    setTmpUserOffsetY(offset: number) {
        this.tmpUserOffsetY = offset;
    }

    drawStreets(streetGraph: StreetGraph): void {
        this.context.clearRect(0, 0, 1920, 1080);

        this.context.fillStyle = "black";

        for (let edge of streetGraph.edges) {
            this.context.lineWidth = edge.width;
            this.context.beginPath();
            this.context.moveTo((edge.startNode.position.x * this.scale) + this.offsetX + this.userOffsetX + this.tmpUserOffsetX, (edge.startNode.position.y * (-1) * this.scale + this.offsetY + this.userOffsetY + this.tmpUserOffsetY));
            this.context.lineTo((edge.endNode.position.x * this.scale) + this.offsetX + this.userOffsetX + this.tmpUserOffsetX, (edge.endNode.position.y * (-1) * this.scale + this.offsetY + this.userOffsetY + this.tmpUserOffsetY));
            this.context.stroke();
        }

        this.context.fillStyle = "red";

        for (let newPoint of streetGraph.newPoints) {
            this.context.fillRect(newPoint.x * this.scale + this.offsetX + this.userOffsetX + this.tmpUserOffsetX, newPoint.y * (-1) * this.scale + this.offsetY + this.userOffsetY + this.tmpUserOffsetY, 5, 5);
        }

        this.context.fillStyle = "blue";

        for (let growthPoint of this.simulationCofiguration.growthPoints) {
            this.context.fillRect(growthPoint.x * this.scale + this.offsetX + this.userOffsetX + this.tmpUserOffsetX, growthPoint.y * (-1) * this.scale + this.offsetY + this.userOffsetY + this.tmpUserOffsetY, 10, 10);
        }
    }
}