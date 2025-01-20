/**
 * Creates a string representation of the Vector2
 * @param vector defines the Vector2 to stringify
 * @param decimalCount defines the number of decimals to use
 * @returns a string with the Vector2 coordinates.
 */
export function Vector2ToFixed(vector, decimalCount) {
    return `{X: ${vector.x.toFixed(decimalCount)} Y: ${vector.y.toFixed(decimalCount)}}`;
}
/**
 * Creates a string representation of the Vector3
 * @param vector defines the Vector3 to stringify
 * @param decimalCount defines the number of decimals to use
 * @returns a string with the Vector3 coordinates.
 */
export function Vector3ToFixed(vector, decimalCount) {
    return `{X: ${vector._x.toFixed(decimalCount)} Y: ${vector._y.toFixed(decimalCount)} Z: ${vector._z.toFixed(decimalCount)}}`;
}
/**
 * Creates a string representation of the Vector4
 * @param vector defines the Vector4 to stringify
 * @param decimalCount defines the number of decimals to use
 * @returns a string with the Vector4 coordinates.
 */
export function Vector4ToFixed(vector, decimalCount) {
    return `{X: ${vector.x.toFixed(decimalCount)} Y: ${vector.y.toFixed(decimalCount)} Z: ${vector.z.toFixed(decimalCount)} W: ${vector.w.toFixed(decimalCount)}}`;
}
//# sourceMappingURL=math.vector.functions.js.map