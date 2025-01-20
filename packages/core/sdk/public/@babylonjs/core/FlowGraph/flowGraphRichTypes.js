import { Vector2, Vector3, Vector4, Matrix, Quaternion } from "../Maths/math.vector.js";
import { Color3, Color4 } from "../Maths/math.color.js";
import { FlowGraphInteger } from "./flowGraphInteger.js";
/**
 * A rich type represents extra information about a type,
 * such as its name and a default value constructor.
 * @experimental
 */
export class RichType {
    constructor(
    /**
     * The name given to the type.
     */
    typeName, 
    /**
     * The default value of the type.
     */
    defaultValue) {
        this.typeName = typeName;
        this.defaultValue = defaultValue;
    }
    /**
     * Serializes this rich type into a serialization object.
     * @param serializationObject the object to serialize to
     */
    serialize(serializationObject) {
        serializationObject.typeName = this.typeName;
        serializationObject.defaultValue = this.defaultValue;
    }
    /**
     * Parses a rich type from a serialization object.
     * @param serializationObject a serialization object
     * @returns the parsed rich type
     */
    static Parse(serializationObject) {
        return new RichType(serializationObject.typeName, serializationObject.defaultValue);
    }
}
export const RichTypeAny = new RichType("any", undefined);
export const RichTypeString = new RichType("string", "");
export const RichTypeNumber = new RichType("number", 0);
export const RichTypeBoolean = new RichType("boolean", false);
export const RichTypeVector2 = new RichType("Vector2", Vector2.Zero());
export const RichTypeVector3 = new RichType("Vector3", Vector3.Zero());
export const RichTypeVector4 = new RichType("Vector4", Vector4.Zero());
export const RichTypeMatrix = new RichType("Matrix", Matrix.Identity());
export const RichTypeColor3 = new RichType("Color3", Color3.Black());
export const RichTypeColor4 = new RichType("Color4", new Color4(0, 0, 0, 0));
export const RichTypeQuaternion = new RichType("Quaternion", Quaternion.Identity());
export const RichTypeFlowGraphInteger = new RichType("FlowGraphInteger", new FlowGraphInteger(0));
/**
 * Given a value, try to deduce its rich type.
 * @param value the value to deduce the rich type from
 * @returns the value's rich type, or RichTypeAny if the type could not be deduced.
 */
export function getRichTypeFromValue(value) {
    switch (typeof value) {
        case "string":
            return RichTypeString;
        case "number":
            return RichTypeNumber;
        case "boolean":
            return RichTypeBoolean;
        case "object":
            if (value instanceof Vector2) {
                return RichTypeVector2;
            }
            else if (value instanceof Vector3) {
                return RichTypeVector3;
            }
            else if (value instanceof Vector4) {
                return RichTypeVector4;
            }
            else if (value instanceof Color3) {
                return RichTypeColor3;
            }
            else if (value instanceof Color4) {
                return RichTypeColor4;
            }
            else if (value instanceof Quaternion) {
                return RichTypeQuaternion;
            }
            else if (value instanceof FlowGraphInteger) {
                return RichTypeFlowGraphInteger;
            }
            else {
                return RichTypeAny;
            }
        default:
            return RichTypeAny;
    }
}
//# sourceMappingURL=flowGraphRichTypes.js.map