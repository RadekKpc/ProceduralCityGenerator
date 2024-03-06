import { ISimulationConfiguration } from "../../simulationConfiguration";
import { Point, StreetNode } from "../../types/StreetGraph";

export interface IStreetsPattern {
    getNewNodeLocation(direction: Point, startNode: StreetNode, configuration: ISimulationConfiguration): [Point, Point];
}