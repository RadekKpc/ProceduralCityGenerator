import { ISimulationConfiguration } from "../../simulationConfiguration";
import { Point, StreetNode } from "../../types/StreetGraph";
import { IStreetsPattern } from "./IStreetsPattern";

export class NormalStreetsPattern implements IStreetsPattern {

    getNewNodeLocation(direction: Point, startNode: StreetNode, configuration: ISimulationConfiguration): Point {
        const newLength = Math.random() * configuration.streetsLength + configuration.streetsLength;
        const newAngle = (Math.random() - 0.5) * configuration.generationAngle;
        const newNodePosition = startNode.position.vectorAdd(direction.rotate(newAngle).scalarMultiply(newLength));
        return newNodePosition;
    }

}