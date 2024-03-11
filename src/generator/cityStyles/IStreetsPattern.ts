import { IExpansionConfiguraiton } from "../../simulationConfiguration";
import { Point, StreetNode } from "../../types/StreetGraph";

export interface IStreetsPattern {
    getNewNodeLocation(direction: Point, startNode: StreetNode, configuration: IExpansionConfiguraiton): [Point, Point];
}