import { ISimulationConfiguration } from "../../simulationConfiguration";
import { Point, StreetNode } from "../../types/StreetGraph";
import { IStreetsPattern } from "./IStreetsPattern";

export class GridStreetsPattern implements IStreetsPattern {

    getNewNodeLocation(direction: Point, startNode: StreetNode, configuration: ISimulationConfiguration): Point {
        const newLength = Math.random() * configuration.streetsLength + configuration.streetsLength;
        const newNodePosition = startNode.position.vectorAdd(direction.scalarMultiply(newLength));
        return newNodePosition;
    }

}