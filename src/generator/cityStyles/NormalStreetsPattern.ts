import { ISimulationConfiguration } from "../../simulationConfiguration";
import { Point, StreetNode } from "../../types/StreetGraph";
import { gaussianRandom } from "../utils";
import { IStreetsPattern } from "./IStreetsPattern";

export class NormalStreetsPattern implements IStreetsPattern {

    getNewNodeLocation(direction: Point, startNode: StreetNode, configuration: ISimulationConfiguration): Point {
        const newLength = gaussianRandom(0.16, 0.5, 0, 1) * configuration.streetsLength + configuration.streetsLength;
        const newAngle = gaussianRandom(0.16, 0, -0.5, 0.5) * configuration.generationAngle;
        const newNodePosition = startNode.position.vectorAdd(direction.rotate(newAngle).scalarMultiply(newLength));
        return newNodePosition;
    }

}