import { __decorate } from "../tslib.es6.js";
import { Vector3 } from "./math.vector.js";
import { nativeOverride } from "../Misc/decorators.js";
// This helper class is only here so we can apply the nativeOverride decorator to functions.
class MathHelpers {
    static extractMinAndMaxIndexed(positions, indices, indexStart, indexCount, minimum, maximum) {
        for (let index = indexStart; index < indexStart + indexCount; index++) {
            const offset = indices[index] * 3;
            const x = positions[offset];
            const y = positions[offset + 1];
            const z = positions[offset + 2];
            minimum.minimizeInPlaceFromFloats(x, y, z);
            maximum.maximizeInPlaceFromFloats(x, y, z);
        }
    }
    static extractMinAndMax(positions, start, count, stride, minimum, maximum) {
        for (let index = start, offset = start * stride; index < start + count; index++, offset += stride) {
            const x = positions[offset];
            const y = positions[offset + 1];
            const z = positions[offset + 2];
            minimum.minimizeInPlaceFromFloats(x, y, z);
            maximum.maximizeInPlaceFromFloats(x, y, z);
        }
    }
}
__decorate([
    nativeOverride.filter((...[positions, indices]) => !Array.isArray(positions) && !Array.isArray(indices))
    // eslint-disable-next-line @typescript-eslint/naming-convention
], MathHelpers, "extractMinAndMaxIndexed", null);
__decorate([
    nativeOverride.filter((...[positions]) => !Array.isArray(positions))
    // eslint-disable-next-line @typescript-eslint/naming-convention
], MathHelpers, "extractMinAndMax", null);
/**
 * Extracts minimum and maximum values from a list of indexed positions
 * @param positions defines the positions to use
 * @param indices defines the indices to the positions
 * @param indexStart defines the start index
 * @param indexCount defines the end index
 * @param bias defines bias value to add to the result
 * @returns minimum and maximum values
 */
export function extractMinAndMaxIndexed(positions, indices, indexStart, indexCount, bias = null) {
    const minimum = new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
    const maximum = new Vector3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
    MathHelpers.extractMinAndMaxIndexed(positions, indices, indexStart, indexCount, minimum, maximum);
    if (bias) {
        minimum.x -= minimum.x * bias.x + bias.y;
        minimum.y -= minimum.y * bias.x + bias.y;
        minimum.z -= minimum.z * bias.x + bias.y;
        maximum.x += maximum.x * bias.x + bias.y;
        maximum.y += maximum.y * bias.x + bias.y;
        maximum.z += maximum.z * bias.x + bias.y;
    }
    return {
        minimum: minimum,
        maximum: maximum,
    };
}
/**
 * Extracts minimum and maximum values from a list of positions
 * @param positions defines the positions to use
 * @param start defines the start index in the positions array
 * @param count defines the number of positions to handle
 * @param bias defines bias value to add to the result
 * @param stride defines the stride size to use (distance between two positions in the positions array)
 * @returns minimum and maximum values
 */
export function extractMinAndMax(positions, start, count, bias = null, stride) {
    const minimum = new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
    const maximum = new Vector3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
    if (!stride) {
        stride = 3;
    }
    MathHelpers.extractMinAndMax(positions, start, count, stride, minimum, maximum);
    if (bias) {
        minimum.x -= minimum.x * bias.x + bias.y;
        minimum.y -= minimum.y * bias.x + bias.y;
        minimum.z -= minimum.z * bias.x + bias.y;
        maximum.x += maximum.x * bias.x + bias.y;
        maximum.y += maximum.y * bias.x + bias.y;
        maximum.z += maximum.z * bias.x + bias.y;
    }
    return {
        minimum: minimum,
        maximum: maximum,
    };
}
/**
 * Flip flipped faces
 * @param positions defines the positions to use
 * @param indices defines the indices to use and update
 */
export function FixFlippedFaces(positions, indices) {
    const boundingInfo = extractMinAndMax(positions, 0, positions.length / 3);
    const inside = boundingInfo.maximum.subtract(boundingInfo.minimum).scale(0.5).add(boundingInfo.minimum);
    const tmpVectorA = new Vector3();
    const tmpVectorB = new Vector3();
    const tmpVectorC = new Vector3();
    const tmpVectorAB = new Vector3();
    const tmpVectorAC = new Vector3();
    const tmpVectorNormal = new Vector3();
    const tmpVectorAvgNormal = new Vector3();
    // Clean indices
    for (let index = 0; index < indices.length; index += 3) {
        const a = indices[index];
        const b = indices[index + 1];
        const c = indices[index + 2];
        // Evaluate face normal
        tmpVectorA.fromArray(positions, a * 3);
        tmpVectorB.fromArray(positions, b * 3);
        tmpVectorC.fromArray(positions, c * 3);
        tmpVectorB.subtractToRef(tmpVectorA, tmpVectorAB);
        tmpVectorC.subtractToRef(tmpVectorA, tmpVectorAC);
        Vector3.CrossToRef(tmpVectorAB, tmpVectorAC, tmpVectorNormal);
        tmpVectorNormal.normalize();
        // Calculate normal from face center to the inside of the geometry
        const avgX = tmpVectorA.x + tmpVectorB.x + tmpVectorC.x;
        const avgY = tmpVectorA.y + tmpVectorB.y + tmpVectorC.y;
        const avgZ = tmpVectorA.z + tmpVectorB.z + tmpVectorC.z;
        tmpVectorAvgNormal.set(avgX / 3, avgY / 3, avgZ / 3);
        tmpVectorAvgNormal.subtractInPlace(inside);
        tmpVectorAvgNormal.normalize();
        if (Vector3.Dot(tmpVectorNormal, tmpVectorAvgNormal) >= 0) {
            // Flip!
            indices[index] = c;
            indices[index + 2] = a;
        }
    }
}
//# sourceMappingURL=math.functions.js.map