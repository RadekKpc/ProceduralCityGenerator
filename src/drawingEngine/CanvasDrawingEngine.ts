import { ISimulationConfiguration } from "../simulationConfiguration";
import { Face, Hierarchy, StreetEdge, StreetGraph, StreetNode } from "../types/StreetGraph";
import { DrawingConfiguration, IDrawingEngine } from "./IDrawingEngine";

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
    drawingConfiguration: DrawingConfiguration;
    height: number;
    width: number;
    streetGraph: StreetGraph | null;
    pointsSizes: number;

    constructor(context: CanvasRenderingContext2D, simulationCofiguration: ISimulationConfiguration, width: number, height: number, drawingConfiguration: DrawingConfiguration) {
        this.context = context;
        this.offsetX = width / 2;
        this.offsetY = height / 2;
        this.width = width;
        this.height = height;
        this.scale = 1;
        this.userOffsetX = 0;
        this.userOffsetY = 0;
        this.tmpUserOffsetX = 0;
        this.tmpUserOffsetY = 0;
        this.simulationCofiguration = simulationCofiguration;
        this.drawingConfiguration = drawingConfiguration;
        this.streetGraph = null;
        this.pointsSizes = 5;
    }

    resetScale() {
        this.scale = 1;
        this.userOffsetX = 0;
        this.userOffsetY = 0;
        this.tmpUserOffsetX = 0;
        this.tmpUserOffsetY = 0;
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

    pixelToPositionX(pixelPosition: number) {
        return (pixelPosition - (this.offsetX + this.userOffsetX + this.tmpUserOffsetX)) / this.scale;
    }

    pixelToPositionY(pixelPosition: number) {
        return (pixelPosition - (this.offsetY + this.userOffsetY + this.tmpUserOffsetY)) / ((-1) * this.scale);
    }

    changeDrawingConiguration(drawingConfiguration: Partial<DrawingConfiguration>) {
        this.drawingConfiguration = { ...this.drawingConfiguration, ...drawingConfiguration, };
    }

    redrawStreetGraph() {
        if (this.streetGraph) this.drawStreets(this.streetGraph);
    }

    drawStreets(streetGraph: StreetGraph): void {
        this.context.clearRect(0, 0, this.width, this.height);
        this.streetGraph = streetGraph;

        if (this.drawingConfiguration.fillFaces) {
            for (let face of streetGraph.facesList) {

                this.context.beginPath();
                this.context.moveTo(this.getX(face.boundaryNodes[0].position.x), this.getY(face.boundaryNodes[0].position.y));
                for (let node of face.boundaryNodes) {
                    this.context.lineTo(this.getX(node.position.x), this.getY(node.position.y));
                }
                this.context.closePath();

                this.context.fillStyle = face.color;
                this.context.fill();
            }
        }

        if (this.drawingConfiguration.fillBlocks) {
            for (let block of streetGraph.blocksList) {

                this.context.beginPath();
                this.context.moveTo(this.getX(block.boundaryNodes[0].position.x), this.getY(block.boundaryNodes[0].position.y));
                for (let node of block.boundaryNodes) {
                    this.context.lineTo(this.getX(node.position.x), this.getY(node.position.y));
                }
                this.context.closePath();

                this.context.fillStyle = block.color;
                this.context.fill();
            }
        }

        this.context.strokeStyle = "black";
        this.context.fillStyle = "black";

        for (let edge of streetGraph.getEdges()) {
            this.context.lineWidth = edge.width;
            this.context.beginPath();
            this.context.moveTo(this.getX(edge.startNode.position.x), this.getY(edge.startNode.position.y));
            this.context.lineTo(this.getX(edge.endNode.position.x), this.getY(edge.endNode.position.y));
            this.context.stroke();
        }

        if (this.drawingConfiguration.drawGrowthCenters) {
            this.context.fillStyle = "orange";

            for (let growthPoint of this.simulationCofiguration.growthPoints) {
                this.context.fillRect(this.getX(growthPoint.x) - this.pointsSizes, this.getY(growthPoint.y) - this.pointsSizes, 2 * this.pointsSizes, 2 * this.pointsSizes);
            }
        }

        if (this.drawingConfiguration.drawMajorNodes) {
            this.context.fillStyle = "red";

            for (let point of streetGraph.nodes.filter(n => n.hierarchy == Hierarchy.Major)) {
                this.context.fillRect(this.getX(point.position.x) - (this.pointsSizes / 2), this.getY(point.position.y) - (this.pointsSizes / 2), this.pointsSizes, this.pointsSizes);
            }
        }

        if (this.drawingConfiguration.drawMinorNodes) {
            this.context.fillStyle = "blue";

            for (let point of streetGraph.nodes.filter(n => n.hierarchy == Hierarchy.Minor)) {
                this.context.fillRect(this.getX(point.position.x) - (this.pointsSizes / 2), this.getY(point.position.y) - (this.pointsSizes / 2), this.pointsSizes, this.pointsSizes);
            }
        }

        if (this.drawingConfiguration.drawNewPoints) {
            this.context.fillStyle = "green";

            for (let newPoint of streetGraph.newPoints) {
                this.context.fillRect(this.getX(newPoint.x) - (this.pointsSizes / 2), this.getY(newPoint.y) - (this.pointsSizes / 2), this.pointsSizes, this.pointsSizes);
            }
        }


        // trainglesToDraw
        for (const traingle of streetGraph.trainglesToDraw) {

            this.context.beginPath();
            this.context.moveTo(this.getX(traingle[0].position.x), this.getY(traingle[0].position.y));
            for (let node of traingle) {
                this.context.lineTo(this.getX(node.position.x), this.getY(node.position.y));
            }
            this.context.closePath();

            const randomColor = Math.floor(Math.random() * 128 + 128).toString(16);
            this.context.fillStyle = "#0000" + randomColor;
            this.context.fill();
        }

        // point to draw

        for (let ponint of streetGraph.pointsToDraw) {
            const randomColor = Math.floor(Math.random() * 128 + 128).toString(16);
            this.context.fillStyle = "#" + randomColor + '0000';
            this.context.fillRect(this.getX(ponint.x), this.getY(ponint.y), 5, 5);
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

    drawFace(face: Face, color: string) {
        for (let edge of face.streets) {
            this.drawEdge(edge, color);
        }

        for (let node of face.nodes) {
            this.drawNode(node, color);
        }

        for (let a of face.nodes)
            for (let edge of face.streets) {
                this.drawEdge(edge, color);
            }
    }
}