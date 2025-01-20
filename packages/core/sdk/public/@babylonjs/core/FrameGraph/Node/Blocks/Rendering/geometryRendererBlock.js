import { __decorate } from "../../../../tslib.es6.js";
import { NodeRenderGraphBlock } from "../../nodeRenderGraphBlock.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
import { NodeRenderGraphBlockConnectionPointTypes } from "../../Types/nodeRenderGraphTypes.js";
import { editableInPropertyPage } from "../../../../Decorators/nodeDecorator.js";
import { FrameGraphGeometryRendererTask } from "../../../Tasks/Rendering/geometryRendererTask.js";

/**
 * Block that render geometry of objects to a multi render target
 */
export class NodeRenderGraphGeometryRendererBlock extends NodeRenderGraphBlock {
    /**
     * Gets the frame graph task associated with this block
     */
    get task() {
        return this._frameGraphTask;
    }
    /**
     * Create a new NodeRenderGraphGeometryRendererBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     * @param doNotChangeAspectRatio True (default) to not change the aspect ratio of the scene in the RTT
     */
    constructor(name, frameGraph, scene, doNotChangeAspectRatio = true) {
        super(name, frameGraph, scene);
        // View depth
        this.viewDepthFormat = 6;
        this.viewDepthType = 2;
        // Screen depth
        this.screenDepthFormat = 6;
        this.screenDepthType = 2;
        // View normal
        this.viewNormalFormat = 5;
        this.viewNormalType = 0;
        // World normal
        this.worldNormalFormat = 5;
        this.worldNormalType = 0;
        // Local position
        this.localPositionFormat = 5;
        this.localPositionType = 2;
        // World Position
        this.worldPositionFormat = 5;
        this.worldPositionType = 2;
        // Albedo
        this.albedoFormat = 5;
        this.albedoType = 0;
        // Reflectivity
        this.reflectivityFormat = 5;
        this.reflectivityType = 0;
        // Velocity
        this.velocityFormat = 5;
        this.velocityType = 0;
        // Linear velocity
        this.linearVelocityFormat = 5;
        this.linearVelocityType = 0;
        this._additionalConstructionParameters = [doNotChangeAspectRatio];
        this.registerInput("depth", NodeRenderGraphBlockConnectionPointTypes.TextureBackBufferDepthStencilAttachment, true);
        this.registerInput("camera", NodeRenderGraphBlockConnectionPointTypes.Camera);
        this.registerInput("objects", NodeRenderGraphBlockConnectionPointTypes.ObjectList);
        this._addDependenciesInput();
        this.registerOutput("outputDepth", NodeRenderGraphBlockConnectionPointTypes.BasedOnInput);
        this.registerOutput("geomViewDepth", NodeRenderGraphBlockConnectionPointTypes.TextureViewDepth);
        this.registerOutput("geomScreenDepth", NodeRenderGraphBlockConnectionPointTypes.TextureScreenDepth);
        this.registerOutput("geomViewNormal", NodeRenderGraphBlockConnectionPointTypes.TextureViewNormal);
        this.registerOutput("geomWorldNormal", NodeRenderGraphBlockConnectionPointTypes.TextureViewNormal);
        this.registerOutput("geomLocalPosition", NodeRenderGraphBlockConnectionPointTypes.TextureLocalPosition);
        this.registerOutput("geomWorldPosition", NodeRenderGraphBlockConnectionPointTypes.TextureWorldPosition);
        this.registerOutput("geomAlbedo", NodeRenderGraphBlockConnectionPointTypes.TextureAlbedo);
        this.registerOutput("geomReflectivity", NodeRenderGraphBlockConnectionPointTypes.TextureReflectivity);
        this.registerOutput("geomVelocity", NodeRenderGraphBlockConnectionPointTypes.TextureVelocity);
        this.registerOutput("geomLinearVelocity", NodeRenderGraphBlockConnectionPointTypes.TextureLinearVelocity);
        this.depth.addAcceptedConnectionPointTypes(NodeRenderGraphBlockConnectionPointTypes.TextureDepthStencilAttachment);
        this.outputDepth._typeConnectionSource = this.depth;
        this._frameGraphTask = new FrameGraphGeometryRendererTask(this.name, frameGraph, scene, { doNotChangeAspectRatio });
    }
    /** Indicates if depth testing must be enabled or disabled */
    get depthTest() {
        return this._frameGraphTask.depthTest;
    }
    set depthTest(value) {
        this._frameGraphTask.depthTest = value;
    }
    /** Indicates if depth writing must be enabled or disabled */
    get depthWrite() {
        return this._frameGraphTask.depthWrite;
    }
    set depthWrite(value) {
        this._frameGraphTask.depthWrite = value;
    }
    /** True (default) to not change the aspect ratio of the scene in the RTT */
    get doNotChangeAspectRatio() {
        return this._frameGraphTask.objectRenderer.options.doNotChangeAspectRatio;
    }
    set doNotChangeAspectRatio(value) {
        this._frameGraphTask.dispose();
        this._frameGraphTask = new FrameGraphGeometryRendererTask(this.name, this._frameGraph, this._scene, { doNotChangeAspectRatio: value });
        this._additionalConstructionParameters = [value];
    }
    /** Width of the geometry texture */
    get width() {
        return this._frameGraphTask.size.width;
    }
    set width(value) {
        this._frameGraphTask.size.width = value;
    }
    /** Height of the geometry texture */
    get height() {
        return this._frameGraphTask.size.height;
    }
    set height(value) {
        this._frameGraphTask.size.height = value;
    }
    /** Indicates if the geometry texture width and height are percentages or absolute values */
    get sizeInPercentage() {
        return this._frameGraphTask.sizeIsPercentage;
    }
    set sizeInPercentage(value) {
        this._frameGraphTask.sizeIsPercentage = value;
    }
    /** Number of samples of the geometry texture */
    get samples() {
        return this._frameGraphTask.samples;
    }
    set samples(value) {
        this._frameGraphTask.samples = value;
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "NodeRenderGraphGeometryRendererBlock";
    }
    /**
     * Gets the depth texture input component
     */
    get depth() {
        return this._inputs[0];
    }
    /**
     * Gets the camera input component
     */
    get camera() {
        return this._inputs[1];
    }
    /**
     * Gets the objects input component
     */
    get objects() {
        return this._inputs[2];
    }
    /**
     * Gets the output depth component
     */
    get outputDepth() {
        return this._outputs[0];
    }
    /**
     * Gets the geometry view depth component
     */
    get geomViewDepth() {
        return this._outputs[1];
    }
    /**
     * Gets the geometry screen depth component
     */
    get geomScreenDepth() {
        return this._outputs[2];
    }
    /**
     * Gets the geometry view normal component
     */
    get geomViewNormal() {
        return this._outputs[3];
    }
    /**
     * Gets the world geometry normal component
     */
    get geomWorldNormal() {
        return this._outputs[4];
    }
    /**
     * Gets the geometry local position component
     */
    get geomLocalPosition() {
        return this._outputs[5];
    }
    /**
     * Gets the geometry world position component
     */
    get geomWorldPosition() {
        return this._outputs[6];
    }
    /**
     * Gets the geometry albedo component
     */
    get geomAlbedo() {
        return this._outputs[7];
    }
    /**
     * Gets the geometry reflectivity component
     */
    get geomReflectivity() {
        return this._outputs[8];
    }
    /**
     * Gets the geometry velocity component
     */
    get geomVelocity() {
        return this._outputs[9];
    }
    /**
     * Gets the geometry linear velocity component
     */
    get geomLinearVelocity() {
        return this._outputs[10];
    }
    _buildBlock(state) {
        super._buildBlock(state);
        const textureActivation = [
            this.geomViewDepth.isConnected,
            this.geomScreenDepth.isConnected,
            this.geomViewNormal.isConnected,
            this.geomWorldNormal.isConnected,
            this.geomLocalPosition.isConnected,
            this.geomWorldPosition.isConnected,
            this.geomAlbedo.isConnected,
            this.geomReflectivity.isConnected,
            this.geomVelocity.isConnected,
            this.geomLinearVelocity.isConnected,
        ];
        if (textureActivation.every((t) => !t)) {
            throw new Error("NodeRenderGraphGeometryRendererBlock: At least one output geometry buffer must be connected");
        }
        this.outputDepth.value = this._frameGraphTask.outputDepthTexture;
        this.geomViewDepth.value = this._frameGraphTask.geometryViewDepthTexture;
        this.geomScreenDepth.value = this._frameGraphTask.geometryScreenDepthTexture;
        this.geomViewNormal.value = this._frameGraphTask.geometryViewNormalTexture;
        this.geomWorldNormal.value = this._frameGraphTask.geometryWorldNormalTexture;
        this.geomLocalPosition.value = this._frameGraphTask.geometryLocalPositionTexture;
        this.geomWorldPosition.value = this._frameGraphTask.geometryWorldPositionTexture;
        this.geomAlbedo.value = this._frameGraphTask.geometryAlbedoTexture;
        this.geomReflectivity.value = this._frameGraphTask.geometryReflectivityTexture;
        this.geomVelocity.value = this._frameGraphTask.geometryVelocityTexture;
        this.geomLinearVelocity.value = this._frameGraphTask.geometryLinearVelocityTexture;
        this._frameGraphTask.depthTexture = this.depth.connectedPoint?.value;
        this._frameGraphTask.camera = this.camera.connectedPoint?.value;
        this._frameGraphTask.objectList = this.objects.connectedPoint?.value;
        this._frameGraphTask.textureDescriptions = [];
        const textureFormats = [
            this.viewDepthFormat,
            this.screenDepthFormat,
            this.viewNormalFormat,
            this.worldNormalFormat,
            this.localPositionFormat,
            this.worldPositionFormat,
            this.albedoFormat,
            this.reflectivityFormat,
            this.velocityFormat,
            this.linearVelocityFormat,
        ];
        const textureTypes = [
            this.viewDepthType,
            this.screenDepthType,
            this.viewNormalType,
            this.worldNormalType,
            this.localPositionType,
            this.worldPositionType,
            this.albedoType,
            this.reflectivityType,
            this.velocityType,
            this.linearVelocityType,
        ];
        const bufferTypes = [
            5,
            10,
            6,
            8,
            9,
            1,
            12,
            3,
            2,
            11,
        ];
        for (let i = 0; i < textureActivation.length; i++) {
            if (textureActivation[i]) {
                this._frameGraphTask.textureDescriptions.push({
                    textureFormat: textureFormats[i],
                    textureType: textureTypes[i],
                    type: bufferTypes[i],
                });
            }
        }
    }
    _dumpPropertiesCode() {
        const codes = [];
        codes.push(`${this._codeVariableName}.depthTest = ${this.depthTest};`);
        codes.push(`${this._codeVariableName}.depthWrite = ${this.depthWrite};`);
        codes.push(`${this._codeVariableName}.samples = ${this.samples};`);
        codes.push(`${this._codeVariableName}.viewDepthFormat = ${this.viewDepthFormat};`);
        codes.push(`${this._codeVariableName}.viewDepthType = ${this.viewDepthType};`);
        codes.push(`${this._codeVariableName}.screenDepthFormat = ${this.screenDepthFormat};`);
        codes.push(`${this._codeVariableName}.screenDepthType = ${this.screenDepthType};`);
        codes.push(`${this._codeVariableName}.localPositionFormat = ${this.localPositionFormat};`);
        codes.push(`${this._codeVariableName}.localPositionType = ${this.localPositionType};`);
        codes.push(`${this._codeVariableName}.worldPositionFormat = ${this.worldPositionFormat};`);
        codes.push(`${this._codeVariableName}.worldPositionType = ${this.worldPositionType};`);
        codes.push(`${this._codeVariableName}.viewNormalFormat = ${this.viewNormalFormat};`);
        codes.push(`${this._codeVariableName}.viewNormalType = ${this.viewNormalType};`);
        codes.push(`${this._codeVariableName}.worldNormalFormat = ${this.worldNormalFormat};`);
        codes.push(`${this._codeVariableName}.worldNormalType = ${this.worldNormalType};`);
        codes.push(`${this._codeVariableName}.albedoFormat = ${this.albedoFormat};`);
        codes.push(`${this._codeVariableName}.albedoType = ${this.albedoType};`);
        codes.push(`${this._codeVariableName}.reflectivityFormat = ${this.reflectivityFormat};`);
        codes.push(`${this._codeVariableName}.reflectivityType = ${this.reflectivityType};`);
        codes.push(`${this._codeVariableName}.velocityFormat = ${this.velocityFormat};`);
        codes.push(`${this._codeVariableName}.velocityType = ${this.velocityType};`);
        codes.push(`${this._codeVariableName}.linearVelocityFormat = ${this.linearVelocityFormat};`);
        codes.push(`${this._codeVariableName}.linearVelocityType = ${this.linearVelocityType};`);
        return super._dumpPropertiesCode() + codes.join("\n");
    }
    serialize() {
        const serializationObject = super.serialize();
        serializationObject.depthTest = this.depthTest;
        serializationObject.depthWrite = this.depthWrite;
        serializationObject.samples = this.samples;
        serializationObject.viewDepthFormat = this.viewDepthFormat;
        serializationObject.viewDepthType = this.viewDepthType;
        serializationObject.screenDepthFormat = this.screenDepthFormat;
        serializationObject.screenDepthType = this.screenDepthType;
        serializationObject.localPositionFormat = this.localPositionFormat;
        serializationObject.localPositionType = this.localPositionType;
        serializationObject.worldPositionFormat = this.worldPositionFormat;
        serializationObject.worldPositionType = this.worldPositionType;
        serializationObject.viewNormalFormat = this.viewNormalFormat;
        serializationObject.viewNormalType = this.viewNormalType;
        serializationObject.worldNormalFormat = this.worldNormalFormat;
        serializationObject.worldNormalType = this.worldNormalType;
        serializationObject.albedoFormat = this.albedoFormat;
        serializationObject.albedoType = this.albedoType;
        serializationObject.reflectivityFormat = this.reflectivityFormat;
        serializationObject.reflectivityType = this.reflectivityType;
        serializationObject.velocityFormat = this.velocityFormat;
        serializationObject.velocityType = this.velocityType;
        serializationObject.linearVelocityFormat = this.linearVelocityFormat;
        serializationObject.linearVelocityType = this.linearVelocityType;
        return serializationObject;
    }
    _deserialize(serializationObject) {
        super._deserialize(serializationObject);
        this.depthTest = serializationObject.depthTest;
        this.depthWrite = serializationObject.depthWrite;
        this.samples = serializationObject.samples;
        this.viewDepthFormat = serializationObject.viewDepthFormat;
        this.viewDepthType = serializationObject.viewDepthType;
        this.screenDepthFormat = serializationObject.screenDepthFormat;
        this.screenDepthType = serializationObject.screenDepthType;
        this.localPositionFormat = serializationObject.localPositionFormat;
        this.localPositionType = serializationObject.localPositionType;
        this.worldPositionFormat = serializationObject.worldPositionFormat;
        this.worldPositionType = serializationObject.worldPositionType;
        this.viewNormalFormat = serializationObject.viewNormalFormat;
        this.viewNormalType = serializationObject.viewNormalType;
        this.worldNormalFormat = serializationObject.worldNormalFormat;
        this.worldNormalType = serializationObject.worldNormalType;
        this.albedoFormat = serializationObject.albedoFormat;
        this.albedoType = serializationObject.albedoType;
        this.reflectivityFormat = serializationObject.reflectivityFormat;
        this.reflectivityType = serializationObject.reflectivityType;
        this.velocityFormat = serializationObject.velocityFormat;
        this.velocityType = serializationObject.velocityType;
        this.linearVelocityFormat = serializationObject.linearVelocityFormat;
        this.linearVelocityType = serializationObject.linearVelocityType;
    }
}
__decorate([
    editableInPropertyPage("Depth test", 0 /* PropertyTypeForEdition.Boolean */, "PROPERTIES")
], NodeRenderGraphGeometryRendererBlock.prototype, "depthTest", null);
__decorate([
    editableInPropertyPage("Depth write", 0 /* PropertyTypeForEdition.Boolean */, "PROPERTIES")
], NodeRenderGraphGeometryRendererBlock.prototype, "depthWrite", null);
__decorate([
    editableInPropertyPage("Do not change aspect ratio", 0 /* PropertyTypeForEdition.Boolean */, "PROPERTIES")
], NodeRenderGraphGeometryRendererBlock.prototype, "doNotChangeAspectRatio", null);
__decorate([
    editableInPropertyPage("Texture width", 2 /* PropertyTypeForEdition.Int */, "PROPERTIES")
], NodeRenderGraphGeometryRendererBlock.prototype, "width", null);
__decorate([
    editableInPropertyPage("Texture height", 2 /* PropertyTypeForEdition.Int */, "PROPERTIES")
], NodeRenderGraphGeometryRendererBlock.prototype, "height", null);
__decorate([
    editableInPropertyPage("Size is in percentage", 0 /* PropertyTypeForEdition.Boolean */, "PROPERTIES")
], NodeRenderGraphGeometryRendererBlock.prototype, "sizeInPercentage", null);
__decorate([
    editableInPropertyPage("Samples", 2 /* PropertyTypeForEdition.Int */, "PROPERTIES", { min: 1, max: 8 })
], NodeRenderGraphGeometryRendererBlock.prototype, "samples", null);
__decorate([
    editableInPropertyPage("View depth format", 7 /* PropertyTypeForEdition.TextureFormat */, "GEOMETRY BUFFERS")
], NodeRenderGraphGeometryRendererBlock.prototype, "viewDepthFormat", void 0);
__decorate([
    editableInPropertyPage("View depth type", 8 /* PropertyTypeForEdition.TextureType */, "GEOMETRY BUFFERS")
], NodeRenderGraphGeometryRendererBlock.prototype, "viewDepthType", void 0);
__decorate([
    editableInPropertyPage("Screen depth format", 7 /* PropertyTypeForEdition.TextureFormat */, "GEOMETRY BUFFERS")
], NodeRenderGraphGeometryRendererBlock.prototype, "screenDepthFormat", void 0);
__decorate([
    editableInPropertyPage("Screen depth type", 8 /* PropertyTypeForEdition.TextureType */, "GEOMETRY BUFFERS")
], NodeRenderGraphGeometryRendererBlock.prototype, "screenDepthType", void 0);
__decorate([
    editableInPropertyPage("View normal format", 7 /* PropertyTypeForEdition.TextureFormat */, "GEOMETRY BUFFERS")
], NodeRenderGraphGeometryRendererBlock.prototype, "viewNormalFormat", void 0);
__decorate([
    editableInPropertyPage("View normal type", 8 /* PropertyTypeForEdition.TextureType */, "GEOMETRY BUFFERS")
], NodeRenderGraphGeometryRendererBlock.prototype, "viewNormalType", void 0);
__decorate([
    editableInPropertyPage("World normal format", 7 /* PropertyTypeForEdition.TextureFormat */, "GEOMETRY BUFFERS")
], NodeRenderGraphGeometryRendererBlock.prototype, "worldNormalFormat", void 0);
__decorate([
    editableInPropertyPage("World normal type", 8 /* PropertyTypeForEdition.TextureType */, "GEOMETRY BUFFERS")
], NodeRenderGraphGeometryRendererBlock.prototype, "worldNormalType", void 0);
__decorate([
    editableInPropertyPage("Local position format", 7 /* PropertyTypeForEdition.TextureFormat */, "GEOMETRY BUFFERS")
], NodeRenderGraphGeometryRendererBlock.prototype, "localPositionFormat", void 0);
__decorate([
    editableInPropertyPage("Local position type", 8 /* PropertyTypeForEdition.TextureType */, "GEOMETRY BUFFERS")
], NodeRenderGraphGeometryRendererBlock.prototype, "localPositionType", void 0);
__decorate([
    editableInPropertyPage("World position format", 7 /* PropertyTypeForEdition.TextureFormat */, "GEOMETRY BUFFERS")
], NodeRenderGraphGeometryRendererBlock.prototype, "worldPositionFormat", void 0);
__decorate([
    editableInPropertyPage("World position type", 8 /* PropertyTypeForEdition.TextureType */, "GEOMETRY BUFFERS")
], NodeRenderGraphGeometryRendererBlock.prototype, "worldPositionType", void 0);
__decorate([
    editableInPropertyPage("Albedo format", 7 /* PropertyTypeForEdition.TextureFormat */, "GEOMETRY BUFFERS")
], NodeRenderGraphGeometryRendererBlock.prototype, "albedoFormat", void 0);
__decorate([
    editableInPropertyPage("Albedo type", 8 /* PropertyTypeForEdition.TextureType */, "GEOMETRY BUFFERS")
], NodeRenderGraphGeometryRendererBlock.prototype, "albedoType", void 0);
__decorate([
    editableInPropertyPage("Reflectivity format", 7 /* PropertyTypeForEdition.TextureFormat */, "GEOMETRY BUFFERS")
], NodeRenderGraphGeometryRendererBlock.prototype, "reflectivityFormat", void 0);
__decorate([
    editableInPropertyPage("Reflectivity type", 8 /* PropertyTypeForEdition.TextureType */, "GEOMETRY BUFFERS")
], NodeRenderGraphGeometryRendererBlock.prototype, "reflectivityType", void 0);
__decorate([
    editableInPropertyPage("Velocity format", 7 /* PropertyTypeForEdition.TextureFormat */, "GEOMETRY BUFFERS")
], NodeRenderGraphGeometryRendererBlock.prototype, "velocityFormat", void 0);
__decorate([
    editableInPropertyPage("Velocity type", 8 /* PropertyTypeForEdition.TextureType */, "GEOMETRY BUFFERS")
], NodeRenderGraphGeometryRendererBlock.prototype, "velocityType", void 0);
__decorate([
    editableInPropertyPage("Linear velocity format", 7 /* PropertyTypeForEdition.TextureFormat */, "GEOMETRY BUFFERS")
], NodeRenderGraphGeometryRendererBlock.prototype, "linearVelocityFormat", void 0);
__decorate([
    editableInPropertyPage("Linear velocity type", 8 /* PropertyTypeForEdition.TextureType */, "GEOMETRY BUFFERS")
], NodeRenderGraphGeometryRendererBlock.prototype, "linearVelocityType", void 0);
RegisterClass("BABYLON.NodeRenderGraphGeometryRendererBlock", NodeRenderGraphGeometryRendererBlock);
//# sourceMappingURL=geometryRendererBlock.js.map