import { IExpansionConfiguraiton } from "../../simulationConfiguration";
import { Point } from "../../types/BaseTypes";
import { StreetNode } from "../../types/StreetNode";

export interface IStreetsPattern {
    getNewNodeLocation(direction: Point, startNode: StreetNode, configuration: IExpansionConfiguraiton): [Point, Point];
}