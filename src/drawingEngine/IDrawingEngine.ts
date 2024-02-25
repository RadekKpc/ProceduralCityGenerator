import { StreetGraph } from "../types/StreetGraph";

export interface IDrawingEngine {
    drawStreets(streetGraph: StreetGraph): void;
}