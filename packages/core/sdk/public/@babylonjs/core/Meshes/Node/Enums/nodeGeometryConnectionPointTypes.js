/**
 * Defines the kind of connection point for node geometry
 */
export var NodeGeometryBlockConnectionPointTypes;
(function (NodeGeometryBlockConnectionPointTypes) {
    /** Int */
    NodeGeometryBlockConnectionPointTypes[NodeGeometryBlockConnectionPointTypes["Int"] = 1] = "Int";
    /** Float */
    NodeGeometryBlockConnectionPointTypes[NodeGeometryBlockConnectionPointTypes["Float"] = 2] = "Float";
    /** Vector2 */
    NodeGeometryBlockConnectionPointTypes[NodeGeometryBlockConnectionPointTypes["Vector2"] = 4] = "Vector2";
    /** Vector3 */
    NodeGeometryBlockConnectionPointTypes[NodeGeometryBlockConnectionPointTypes["Vector3"] = 8] = "Vector3";
    /** Vector4 */
    NodeGeometryBlockConnectionPointTypes[NodeGeometryBlockConnectionPointTypes["Vector4"] = 16] = "Vector4";
    /** Matrix */
    NodeGeometryBlockConnectionPointTypes[NodeGeometryBlockConnectionPointTypes["Matrix"] = 32] = "Matrix";
    /** Geometry */
    NodeGeometryBlockConnectionPointTypes[NodeGeometryBlockConnectionPointTypes["Geometry"] = 64] = "Geometry";
    /** Texture */
    NodeGeometryBlockConnectionPointTypes[NodeGeometryBlockConnectionPointTypes["Texture"] = 128] = "Texture";
    /** Detect type based on connection */
    NodeGeometryBlockConnectionPointTypes[NodeGeometryBlockConnectionPointTypes["AutoDetect"] = 1024] = "AutoDetect";
    /** Output type that will be defined by input type */
    NodeGeometryBlockConnectionPointTypes[NodeGeometryBlockConnectionPointTypes["BasedOnInput"] = 2048] = "BasedOnInput";
    /** Undefined */
    NodeGeometryBlockConnectionPointTypes[NodeGeometryBlockConnectionPointTypes["Undefined"] = 4096] = "Undefined";
    /** Bitmask of all types */
    NodeGeometryBlockConnectionPointTypes[NodeGeometryBlockConnectionPointTypes["All"] = 4095] = "All";
})(NodeGeometryBlockConnectionPointTypes || (NodeGeometryBlockConnectionPointTypes = {}));
//# sourceMappingURL=nodeGeometryConnectionPointTypes.js.map