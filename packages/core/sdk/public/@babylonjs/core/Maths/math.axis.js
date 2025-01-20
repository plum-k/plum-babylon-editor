import { Vector3 } from "./math.vector.js";
/** Defines supported spaces */
export var Space;
(function (Space) {
    /** Local (object) space */
    Space[Space["LOCAL"] = 0] = "LOCAL";
    /** World space */
    Space[Space["WORLD"] = 1] = "WORLD";
    /** Bone space */
    Space[Space["BONE"] = 2] = "BONE";
})(Space || (Space = {}));
/** Defines the 3 main axes */
export class Axis {
}
/** X axis */
Axis.X = new Vector3(1.0, 0.0, 0.0);
/** Y axis */
Axis.Y = new Vector3(0.0, 1.0, 0.0);
/** Z axis */
Axis.Z = new Vector3(0.0, 0.0, 1.0);
/**
 * Defines cartesian components.
 */
export var Coordinate;
(function (Coordinate) {
    /** X axis */
    Coordinate[Coordinate["X"] = 0] = "X";
    /** Y axis */
    Coordinate[Coordinate["Y"] = 1] = "Y";
    /** Z axis */
    Coordinate[Coordinate["Z"] = 2] = "Z";
})(Coordinate || (Coordinate = {}));
//# sourceMappingURL=math.axis.js.map