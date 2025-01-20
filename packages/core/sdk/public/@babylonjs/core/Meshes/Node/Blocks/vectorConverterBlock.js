import { Vector2, Vector3, Vector4 } from "../../../Maths/math.vector.js";
import { RegisterClass } from "../../../Misc/typeStore.js";
import { NodeGeometryBlockConnectionPointTypes } from "../Enums/nodeGeometryConnectionPointTypes.js";
import { NodeGeometryBlock } from "../nodeGeometryBlock.js";
/**
 * Block used to create a Vector2/3/4 out of individual or partial inputs
 */
export class VectorConverterBlock extends NodeGeometryBlock {
    /**
     * Create a new VectorConverterBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name);
        this.registerInput("xyzw ", NodeGeometryBlockConnectionPointTypes.Vector4, true);
        this.registerInput("xyz ", NodeGeometryBlockConnectionPointTypes.Vector3, true);
        this.registerInput("xy ", NodeGeometryBlockConnectionPointTypes.Vector2, true);
        this.registerInput("zw ", NodeGeometryBlockConnectionPointTypes.Vector2, true);
        this.registerInput("x ", NodeGeometryBlockConnectionPointTypes.Float, true);
        this.registerInput("y ", NodeGeometryBlockConnectionPointTypes.Float, true);
        this.registerInput("z ", NodeGeometryBlockConnectionPointTypes.Float, true);
        this.registerInput("w ", NodeGeometryBlockConnectionPointTypes.Float, true);
        this.registerOutput("xyzw", NodeGeometryBlockConnectionPointTypes.Vector4);
        this.registerOutput("xyz", NodeGeometryBlockConnectionPointTypes.Vector3);
        this.registerOutput("xy", NodeGeometryBlockConnectionPointTypes.Vector2);
        this.registerOutput("zw", NodeGeometryBlockConnectionPointTypes.Vector2);
        this.registerOutput("x", NodeGeometryBlockConnectionPointTypes.Float);
        this.registerOutput("y", NodeGeometryBlockConnectionPointTypes.Float);
        this.registerOutput("z", NodeGeometryBlockConnectionPointTypes.Float);
        this.registerOutput("w", NodeGeometryBlockConnectionPointTypes.Float);
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "VectorConverterBlock";
    }
    /**
     * Gets the xyzw component (input)
     */
    get xyzwIn() {
        return this._inputs[0];
    }
    /**
     * Gets the xyz component (input)
     */
    get xyzIn() {
        return this._inputs[1];
    }
    /**
     * Gets the xy component (input)
     */
    get xyIn() {
        return this._inputs[2];
    }
    /**
     * Gets the zw component (input)
     */
    get zwIn() {
        return this._inputs[3];
    }
    /**
     * Gets the x component (input)
     */
    get xIn() {
        return this._inputs[4];
    }
    /**
     * Gets the y component (input)
     */
    get yIn() {
        return this._inputs[5];
    }
    /**
     * Gets the z component (input)
     */
    get zIn() {
        return this._inputs[6];
    }
    /**
     * Gets the w component (input)
     */
    get wIn() {
        return this._inputs[7];
    }
    /**
     * Gets the xyzw component (output)
     */
    get xyzwOut() {
        return this._outputs[0];
    }
    /**
     * Gets the xyz component (output)
     */
    get xyzOut() {
        return this._outputs[1];
    }
    /**
     * Gets the xy component (output)
     */
    get xyOut() {
        return this._outputs[2];
    }
    /**
     * Gets the zw component (output)
     */
    get zwOut() {
        return this._outputs[3];
    }
    /**
     * Gets the x component (output)
     */
    get xOut() {
        return this._outputs[4];
    }
    /**
     * Gets the y component (output)
     */
    get yOut() {
        return this._outputs[5];
    }
    /**
     * Gets the z component (output)
     */
    get zOut() {
        return this._outputs[6];
    }
    /**
     * Gets the w component (output)
     */
    get wOut() {
        return this._outputs[7];
    }
    _inputRename(name) {
        if (name === "xyzw ") {
            return "xyzwIn";
        }
        if (name === "xyz ") {
            return "xyzIn";
        }
        if (name === "xy ") {
            return "xyIn";
        }
        if (name === "zw ") {
            return "zwIn";
        }
        if (name === "x ") {
            return "xIn";
        }
        if (name === "y ") {
            return "yIn";
        }
        if (name === "z ") {
            return "zIn";
        }
        if (name === "w ") {
            return "wIn";
        }
        return name;
    }
    _outputRename(name) {
        switch (name) {
            case "x":
                return "xOut";
            case "y":
                return "yOut";
            case "z":
                return "zOut";
            case "w":
                return "wOut";
            case "xy":
                return "xyOut";
            case "zw":
                return "zwOut";
            case "xyz":
                return "xyzOut";
            case "xyzw":
                return "xyzwOut";
            default:
                return name;
        }
    }
    _buildBlock(state) {
        super._buildBlock(state);
        const xInput = this.xIn;
        const yInput = this.yIn;
        const zInput = this.zIn;
        const wInput = this.wIn;
        const xyInput = this.xyIn;
        const zwInput = this.zwIn;
        const xyzInput = this.xyzIn;
        const xyzwInput = this.xyzwIn;
        const xyzwOutput = this.xyzwOut;
        const xyzOutput = this.xyzOut;
        const xyOutput = this.xyOut;
        const zwOutput = this.zwOut;
        const xOutput = this.xOut;
        const yOutput = this.yOut;
        const zOutput = this.zOut;
        const wOutput = this.wOut;
        const getData = (state) => {
            if (xyzwInput.isConnected) {
                return xyzwInput.getConnectedValue(state);
            }
            let x = 0;
            let y = 0;
            let z = 0;
            let w = 0;
            if (xInput.isConnected) {
                x = xInput.getConnectedValue(state);
            }
            if (yInput.isConnected) {
                y = yInput.getConnectedValue(state);
            }
            if (zInput.isConnected) {
                z = zInput.getConnectedValue(state);
            }
            if (wInput.isConnected) {
                w = wInput.getConnectedValue(state);
            }
            if (xyInput.isConnected) {
                const temp = xyInput.getConnectedValue(state);
                if (temp) {
                    x = temp.x;
                    y = temp.y;
                }
            }
            if (zwInput.isConnected) {
                const temp = zwInput.getConnectedValue(state);
                if (temp) {
                    z = temp.x;
                    w = temp.y;
                }
            }
            if (xyzInput.isConnected) {
                const temp = xyzInput.getConnectedValue(state);
                if (temp) {
                    x = temp.x;
                    y = temp.y;
                    z = temp.z;
                }
            }
            return new Vector4(x, y, z, w);
        };
        xyzwOutput._storedFunction = (state) => getData(state);
        xyzOutput._storedFunction = (state) => {
            const data = getData(state);
            return new Vector3(data.x, data.y, data.z);
        };
        xyOutput._storedFunction = (state) => {
            const data = getData(state);
            return new Vector2(data.x, data.y);
        };
        zwOutput._storedFunction = (state) => {
            const data = getData(state);
            return new Vector2(data.z, data.w);
        };
        xOutput._storedFunction = (state) => getData(state).x;
        yOutput._storedFunction = (state) => getData(state).y;
        zOutput._storedFunction = (state) => getData(state).z;
        wOutput._storedFunction = (state) => getData(state).w;
    }
}
RegisterClass("BABYLON.VectorConverterBlock", VectorConverterBlock);
//# sourceMappingURL=vectorConverterBlock.js.map