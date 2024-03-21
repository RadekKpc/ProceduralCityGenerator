import { ISimulationConfiguration } from "../simulationConfiguration";
import { Hierarchy, Point } from "../types/BaseTypes";
import { Face } from "../types/Face";
import { StreetEdge } from "../types/StreetEdge";
import { StreetGraph } from "../types/StreetGraph";
import { StreetNode } from "../types/StreetNode";
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

    constructor(context: CanvasRenderingContext2D | null, simulationCofiguration: ISimulationConfiguration, width: number, height: number, drawingConfiguration: DrawingConfiguration) {
        if (!context) throw new Error('canavs is empty');
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
            for (let face of Object.values(streetGraph.facesDict)) {

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
            for (let block of Object.values(streetGraph.blocksDict)) {

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

        if (this.drawingConfiguration.fillLots) {
            for (let block of Object.values(streetGraph.blocksDict)) {

                for (let lot of Object.values(block.subfacesDict)) {

                    this.context.beginPath();
                    this.context.moveTo(this.getX(lot.boundaryNodes[0].position.x), this.getY(lot.boundaryNodes[0].position.y));
                    for (let node of lot.boundaryNodes) {
                        this.context.lineTo(this.getX(node.position.x), this.getY(node.position.y));
                    }
                    this.context.closePath();

                    this.context.fillStyle = lot.color;
                    this.context.fill();

                }
            }
        }

        this.context.strokeStyle = "black";
        this.context.fillStyle = "black";

        for (let edge of Object.values(streetGraph.edges)) {
            this.context.lineWidth = edge.width;
            this.context.beginPath();
            this.context.moveTo(this.getX(edge.startNode.position.x), this.getY(edge.startNode.position.y));
            this.context.lineTo(this.getX(edge.endNode.position.x), this.getY(edge.endNode.position.y));
            this.context.stroke();
        }

        for (let block of Object.values(streetGraph.blocksDict)) {


            this.context.fillStyle = "black";
            for (let edge of Object.values(block.streets).filter(n => n.hierarchy == Hierarchy.Lot)) {
                this.context.lineWidth = edge.width;
                this.context.beginPath();
                this.context.moveTo(this.getX(edge.startNode.position.x), this.getY(edge.startNode.position.y));
                this.context.lineTo(this.getX(edge.endNode.position.x), this.getY(edge.endNode.position.y));
                this.context.stroke();
            }

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

            this.context.fillStyle = "green";
            for (let point of streetGraph.nodes.filter(n => n.hierarchy == Hierarchy.Lot)) {
                this.context.fillRect(this.getX(point.position.x) - (this.pointsSizes / 2), this.getY(point.position.y) - (this.pointsSizes / 2), this.pointsSizes, this.pointsSizes);
            }
        }


        if (this.drawingConfiguration.showLotNodes) {
            for (let block of Object.values(streetGraph.blocksDict)) {

                this.context.fillStyle = "green";
                for (let point of Object.values(block.nodes).filter(n => n.hierarchy == Hierarchy.Lot)) {
                    this.context.fillRect(this.getX(point.position.x) - (this.pointsSizes / 2), this.getY(point.position.y) - (this.pointsSizes / 2), this.pointsSizes, this.pointsSizes);
                }
            }
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

    drawPint(position: Point, color: string) {
        this.context.fillStyle = color;
        this.context.fillRect(this.getX(position.x) - 2.5, this.getY(position.y) - 2.5, 5, 5);
        this.context.lineWidth = 1;
        this.context.beginPath();
        this.context.moveTo(this.getX(-100), this.getY(0));
        this.context.lineTo(this.getX(100), this.getY(0));
        this.context.stroke();

        this.context.beginPath();
        this.context.moveTo(this.getX(0), this.getY(-100));
        this.context.lineTo(this.getX(0), this.getY(100));
        this.context.stroke();
    }

    drawFace(face: Face, color: string) {
        for (let edge of Object.values(face.streets)) {
            this.drawEdge(edge, color);
        }

        for (let node of Object.values(face.nodes)) {
            this.drawNode(node, color);
        }

        for (let a of Object.values(face.nodes))
            for (let edge of Object.values(face.streets)) {
                this.drawEdge(edge, color);
            }
    }
}
