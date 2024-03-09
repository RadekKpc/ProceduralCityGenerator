import { ISimulationConfiguration } from "../simulationConfiguration";
import { Point, StreetEdge, StreetGraph, StreetNode } from "../types/StreetGraph";
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

    getX(position: number) {
        return (position * this.scale) + this.offsetX + this.userOffsetX + this.tmpUserOffsetX;
    }

    getY(position: number) {
        return (position * (-1) * this.scale + this.offsetY + this.userOffsetY + this.tmpUserOffsetY);
    }

    drawStreets(streetGraph: StreetGraph): void {
        this.context.clearRect(0, 0, 1920, 1080);

        this.context.strokeStyle = "black";
        this.context.fillStyle = "black";

        for (let edge of streetGraph.edges) {
            this.context.lineWidth = edge.width;
            this.context.beginPath();
            this.context.moveTo(this.getX(edge.startNode.position.x), this.getY(edge.startNode.position.y));
            this.context.lineTo(this.getX(edge.endNode.position.x), this.getY(edge.endNode.position.y));
            this.context.stroke();
        }

        this.context.fillStyle = "red";

        for (let newPoint of streetGraph.newPoints) {
            this.context.fillRect(this.getX(newPoint.x), this.getY(newPoint.y), 5, 5);
        }

        this.context.fillStyle = "blue";

        for (let growthPoint of this.simulationCofiguration.growthPoints) {
            this.context.fillRect(this.getX(growthPoint.x), this.getY(growthPoint.y), 10, 10);
        }

        this.context.fillStyle = "green";

        for (let face of streetGraph.facesList) {
            this.context.beginPath();
            this.context.moveTo(this.getX(face.nodes[0].position.x), this.getY(face.nodes[0].position.y));
            for (let node of face.nodes) {
                this.context.lineTo(this.getX(node.position.x), this.getY(node.position.y));
            }
            this.context.closePath();
            this.context.fill();
        }

    }

    fillCircle(path: StreetNode[], color: string) {
        this.context.fillStyle = color;

        this.context.beginPath();
        this.context.moveTo(this.getX(path[0].position.x), this.getY(path[0].position.y));
        for (let node of path) {
            this.context.lineTo(this.getX(node.position.x), this.getY(node.position.y));
        }
        this.context.closePath();
        this.context.fill();
    }

    drawEdge(streetEdge: StreetEdge, color: string) {
        this.context.strokeStyle = color;

        this.context.lineWidth = streetEdge.width + 2;
        this.context.beginPath();
        this.context.moveTo(this.getX(streetEdge.startNode.position.x), this.getY(streetEdge.startNode.position.y));
        this.context.lineTo(this.getX(streetEdge.endNode.position.x), this.getY(streetEdge.endNode.position.y));
        this.context.stroke();
    }

    drawNode(node: StreetNode, color: string) {
        this.context.fillStyle = color;
        this.context.fillRect(this.getX(node.position.x) - 5, this.getY(node.position.y) - 5, 10, 10);
    }
}