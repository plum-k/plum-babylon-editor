import { NodeMaterialBlock } from "../nodeMaterialBlock.js";
import { NodeMaterialBlockConnectionPointTypes } from "../Enums/nodeMaterialBlockConnectionPointTypes.js";
import { NodeMaterialBlockTargets } from "../Enums/nodeMaterialBlockTargets.js";
import { RegisterClass } from "../../../Misc/typeStore.js";
import { Color3 } from "../../../Maths/math.color.js";
import { Observable } from "../../../Misc/observable.js";
/**
 * Class used to store a color step for the GradientBlock
 */
export class GradientBlockColorStep {
    /**
     * Gets value indicating which step this color is associated with (between 0 and 1)
     */
    get step() {
        return this._step;
    }
    /**
     * Sets a value indicating which step this color is associated with (between 0 and 1)
     */
    set step(val) {
        this._step = val;
    }
    /**
     * Gets the color associated with this step
     */
    get color() {
        return this._color;
    }
    /**
     * Sets the color associated with this step
     */
    set color(val) {
        this._color = val;
    }
    /**
     * Creates a new GradientBlockColorStep
     * @param step defines a value indicating which step this color is associated with (between 0 and 1)
     * @param color defines the color associated with this step
     */
    constructor(step, color) {
        this.step = step;
        this.color = color;
    }
}
/**
 * Block used to return a color from a gradient based on an input value between 0 and 1
 */
export class GradientBlock extends NodeMaterialBlock {
    /** calls observable when the value is changed*/
    colorStepsUpdated() {
        this.onValueChangedObservable.notifyObservers(this);
    }
    /**
     * Creates a new GradientBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name, NodeMaterialBlockTargets.Neutral);
        /**
         * Gets or sets the list of color steps
         */
        this.colorSteps = [new GradientBlockColorStep(0, Color3.Black()), new GradientBlockColorStep(1.0, Color3.White())];
        /** Gets an observable raised when the value is changed */
        this.onValueChangedObservable = new Observable();
        this.registerInput("gradient", NodeMaterialBlockConnectionPointTypes.AutoDetect);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.Color3);
        this._inputs[0].addExcludedConnectionPointFromAllowedTypes(NodeMaterialBlockConnectionPointTypes.Float |
            NodeMaterialBlockConnectionPointTypes.Vector2 |
            NodeMaterialBlockConnectionPointTypes.Vector3 |
            NodeMaterialBlockConnectionPointTypes.Vector4 |
            NodeMaterialBlockConnectionPointTypes.Color3 |
            NodeMaterialBlockConnectionPointTypes.Color4);
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "GradientBlock";
    }
    /**
     * Gets the gradient input component
     */
    get gradient() {
        return this._inputs[0];
    }
    /**
     * Gets the output component
     */
    get output() {
        return this._outputs[0];
    }
    _writeColorConstant(index, vec3) {
        const step = this.colorSteps[index];
        return `${vec3}(${step.color.r}, ${step.color.g}, ${step.color.b})`;
    }
    _buildBlock(state) {
        super._buildBlock(state);
        const output = this._outputs[0];
        const vec3 = state._getShaderType(NodeMaterialBlockConnectionPointTypes.Vector3);
        if (!this.colorSteps.length || !this.gradient.connectedPoint) {
            state.compilationString += state._declareOutput(output) + ` = ${vec3}(0., 0., 0.);\n`;
            return;
        }
        const tempColor = state._getFreeVariableName("gradientTempColor");
        const tempPosition = state._getFreeVariableName("gradientTempPosition");
        state.compilationString += `${state._declareLocalVar(tempColor, NodeMaterialBlockConnectionPointTypes.Vector3)} = ${this._writeColorConstant(0, vec3)};\n`;
        state.compilationString += `${state._declareLocalVar(tempPosition, NodeMaterialBlockConnectionPointTypes.Float)};\n`;
        let gradientSource = this.gradient.associatedVariableName;
        if (this.gradient.connectedPoint.type !== NodeMaterialBlockConnectionPointTypes.Float) {
            gradientSource += ".x";
        }
        for (let index = 1; index < this.colorSteps.length; index++) {
            const step = this.colorSteps[index];
            const previousStep = this.colorSteps[index - 1];
            state.compilationString += `${tempPosition} = clamp((${gradientSource} - ${state._emitFloat(previousStep.step)}) / (${state._emitFloat(step.step)} -  ${state._emitFloat(previousStep.step)}), 0.0, 1.0) * step(${state._emitFloat(index)}, ${state._emitFloat(this.colorSteps.length - 1)});\n`;
            state.compilationString += `${tempColor} = mix(${tempColor}, ${this._writeColorConstant(index, vec3)}, ${tempPosition});\n`;
        }
        state.compilationString += state._declareOutput(output) + ` = ${tempColor};\n`;
        return this;
    }
    serialize() {
        const serializationObject = super.serialize();
        serializationObject.colorSteps = [];
        for (const step of this.colorSteps) {
            serializationObject.colorSteps.push({
                step: step.step,
                color: {
                    r: step.color.r,
                    g: step.color.g,
                    b: step.color.b,
                },
            });
        }
        return serializationObject;
    }
    _deserialize(serializationObject, scene, rootUrl) {
        super._deserialize(serializationObject, scene, rootUrl);
        this.colorSteps.length = 0;
        for (const step of serializationObject.colorSteps) {
            this.colorSteps.push(new GradientBlockColorStep(step.step, new Color3(step.color.r, step.color.g, step.color.b)));
        }
    }
    _dumpPropertiesCode() {
        let codeString = super._dumpPropertiesCode();
        codeString += `${this._codeVariableName}.colorSteps = [];\n`;
        for (const colorStep of this.colorSteps) {
            codeString += `${this._codeVariableName}.colorSteps.push(new BABYLON.GradientBlockColorStep(${colorStep.step}, new BABYLON.Color3(${colorStep.color.r}, ${colorStep.color.g}, ${colorStep.color.b})));\n`;
        }
        return codeString;
    }
}
RegisterClass("BABYLON.GradientBlock", GradientBlock);
//# sourceMappingURL=gradientBlock.js.map