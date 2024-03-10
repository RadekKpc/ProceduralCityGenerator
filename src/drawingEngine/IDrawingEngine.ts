import { StreetGraph } from "../types/StreetGraph";

export type DrawingConfiguration = {
    fillFaces: boolean;
    drawMajorNodes: boolean;
    drawMinorNodes: boolean;
    drawNewPoints: boolean;
    drawGrowthCenters: boolean;
}
export interface IDrawingEngine {
    drawStreets(streetGraph: StreetGraph): void;
}