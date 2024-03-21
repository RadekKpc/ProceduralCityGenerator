import { StreetGraph } from "../types/StreetGraph";

export type DrawingConfiguration = {
    fillLots: boolean;
    fillFaces: boolean;
    fillBlocks: boolean;
    drawMajorNodes: boolean;
    drawMinorNodes: boolean;
    showLotNodes: boolean;
    drawGrowthCenters: boolean;
}
export interface IDrawingEngine {
    drawStreets(streetGraph: StreetGraph): void;
}