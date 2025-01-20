import { Color3, Color4 } from "../Maths/math.color.js";
import { VertexBuffer } from "../Buffers/buffer.js";
import { Mesh } from "../Meshes/mesh.js";
import { InstancedMesh } from "../Meshes/instancedMesh.js";
import { Material } from "../Materials/material.js";
import { ShaderMaterial } from "../Materials/shaderMaterial.js";
Mesh._LinesMeshParser = (parsedMesh, scene) => {
    return LinesMesh.Parse(parsedMesh, scene);
};
/**
 * Line mesh
 * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/param
 */
export class LinesMesh extends Mesh {
    _isShaderMaterial(shader) {
        return shader.getClassName() === "ShaderMaterial";
    }
    /**
     * Creates a new LinesMesh
     * @param name defines the name
     * @param scene defines the hosting scene
     * @param parent defines the parent mesh if any
     * @param source defines the optional source LinesMesh used to clone data from
     * @param doNotCloneChildren When cloning, skip cloning child meshes of source, default False.
     * When false, achieved by calling a clone(), also passing False.
     * This will make creation of children, recursive.
     * @param useVertexColor defines if this LinesMesh supports vertex color
     * @param useVertexAlpha defines if this LinesMesh supports vertex alpha
     * @param material material to use to draw the line. If not provided, will create a new one
     */
    constructor(name, scene = null, parent = null, source = null, doNotCloneChildren, 
    /**
     * If vertex color should be applied to the mesh
     */
    useVertexColor, 
    /**
     * If vertex alpha should be applied to the mesh
     */
    useVertexAlpha, material) {
        super(name, scene, parent, source, doNotCloneChildren);
        this.useVertexColor = useVertexColor;
        this.useVertexAlpha = useVertexAlpha;
        /**
         * Color of the line (Default: White)
         */
        this.color = new Color3(1, 1, 1);
        /**
         * Alpha of the line (Default: 1)
         */
        this.alpha = 1;
        /** Shader language used by the material */
        this._shaderLanguage = 0 /* ShaderLanguage.GLSL */;
        if (source) {
            this.color = source.color.clone();
            this.alpha = source.alpha;
            this.useVertexColor = source.useVertexColor;
            this.useVertexAlpha = source.useVertexAlpha;
        }
        this.intersectionThreshold = 0.1;
        const defines = [];
        const options = {
            attributes: [VertexBuffer.PositionKind],
            uniforms: ["world", "viewProjection"],
            needAlphaBlending: true,
            defines: defines,
            useClipPlane: null,
            shaderLanguage: 0 /* ShaderLanguage.GLSL */,
        };
        if (!this.useVertexAlpha) {
            options.needAlphaBlending = false;
        }
        else {
            options.defines.push("#define VERTEXALPHA");
        }
        if (!this.useVertexColor) {
            options.uniforms.push("color");
            this._color4 = new Color4();
        }
        else {
            options.defines.push("#define VERTEXCOLOR");
            options.attributes.push(VertexBuffer.ColorKind);
        }
        if (material) {
            this.material = material;
        }
        else {
            const engine = this.getScene().getEngine();
            if (engine.isWebGPU && !LinesMesh.ForceGLSL) {
                this._shaderLanguage = 1 /* ShaderLanguage.WGSL */;
            }
            options.shaderLanguage = this._shaderLanguage;
            options.extraInitializationsAsync = async () => {
                if (this._shaderLanguage === 1 /* ShaderLanguage.WGSL */) {
                    await Promise.all([import("../ShadersWGSL/color.vertex.js"), import("../ShadersWGSL/color.fragment.js")]);
                }
                else {
                    await Promise.all([import("../Shaders/color.vertex.js"), import("../Shaders/color.fragment.js")]);
                }
            };
            this.material = new ShaderMaterial("colorShader", this.getScene(), "color", options, false);
            this.material.doNotSerialize = true;
        }
    }
    isReady() {
        if (!this._lineMaterial.isReady(this, !!this._userInstancedBuffersStorage || this.hasThinInstances)) {
            return false;
        }
        return super.isReady();
    }
    /**
     * @returns the string "LineMesh"
     */
    getClassName() {
        return "LinesMesh";
    }
    /**
     * @internal
     */
    get material() {
        return this._lineMaterial;
    }
    /**
     * @internal
     */
    set material(value) {
        this._lineMaterial = value;
        this._lineMaterial.fillMode = Material.LineListDrawMode;
    }
    /**
     * @internal
     */
    get checkCollisions() {
        return false;
    }
    set checkCollisions(value) {
        // Just ignore it
    }
    /**
     * @internal
     */
    _bind(_subMesh, colorEffect) {
        if (!this._geometry) {
            return this;
        }
        // VBOs
        const indexToBind = this.isUnIndexed ? null : this._geometry.getIndexBuffer();
        if (!this._userInstancedBuffersStorage || this.hasThinInstances) {
            this._geometry._bind(colorEffect, indexToBind);
        }
        else {
            this._geometry._bind(colorEffect, indexToBind, this._userInstancedBuffersStorage.vertexBuffers, this._userInstancedBuffersStorage.vertexArrayObjects);
        }
        // Color
        if (!this.useVertexColor && this._isShaderMaterial(this._lineMaterial)) {
            const { r, g, b } = this.color;
            this._color4.set(r, g, b, this.alpha);
            this._lineMaterial.setColor4("color", this._color4);
        }
        return this;
    }
    /**
     * @internal
     */
    _draw(subMesh, fillMode, instancesCount) {
        if (!this._geometry || !this._geometry.getVertexBuffers() || (!this._unIndexed && !this._geometry.getIndexBuffer())) {
            return this;
        }
        const engine = this.getScene().getEngine();
        // Draw order
        if (this._unIndexed) {
            engine.drawArraysType(Material.LineListDrawMode, subMesh.verticesStart, subMesh.verticesCount, instancesCount);
        }
        else {
            engine.drawElementsType(Material.LineListDrawMode, subMesh.indexStart, subMesh.indexCount, instancesCount);
        }
        return this;
    }
    /**
     * Disposes of the line mesh
     * @param doNotRecurse If children should be disposed
     * @param disposeMaterialAndTextures This parameter is not used by the LineMesh class
     * @param doNotDisposeMaterial If the material should not be disposed (default: false, meaning the material is disposed)
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    dispose(doNotRecurse, disposeMaterialAndTextures = false, doNotDisposeMaterial) {
        if (!doNotDisposeMaterial) {
            this._lineMaterial.dispose(false, false, true);
        }
        super.dispose(doNotRecurse);
    }
    /**
     * Returns a new LineMesh object cloned from the current one.
     * @param name defines the cloned mesh name
     * @param newParent defines the new mesh parent
     * @param doNotCloneChildren if set to true, none of the mesh children are cloned (false by default)
     * @returns the new mesh
     */
    clone(name, newParent = null, doNotCloneChildren) {
        return new LinesMesh(name, this.getScene(), newParent, this, doNotCloneChildren);
    }
    /**
     * Creates a new InstancedLinesMesh object from the mesh model.
     * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/copies/instances
     * @param name defines the name of the new instance
     * @returns a new InstancedLinesMesh
     */
    createInstance(name) {
        const instance = new InstancedLinesMesh(name, this);
        if (this.instancedBuffers) {
            instance.instancedBuffers = {};
            for (const key in this.instancedBuffers) {
                instance.instancedBuffers[key] = this.instancedBuffers[key];
            }
        }
        return instance;
    }
    /**
     * Serializes this ground mesh
     * @param serializationObject object to write serialization to
     */
    serialize(serializationObject) {
        super.serialize(serializationObject);
        serializationObject.color = this.color.asArray();
        serializationObject.alpha = this.alpha;
    }
    /**
     * Parses a serialized ground mesh
     * @param parsedMesh the serialized mesh
     * @param scene the scene to create the ground mesh in
     * @returns the created ground mesh
     */
    static Parse(parsedMesh, scene) {
        const result = new LinesMesh(parsedMesh.name, scene);
        result.color = Color3.FromArray(parsedMesh.color);
        result.alpha = parsedMesh.alpha;
        return result;
    }
}
/**
 * Force all the LineMeshes to compile their default color material to glsl even on WebGPU engines.
 * False by default. This is mostly meant for backward compatibility.
 */
LinesMesh.ForceGLSL = false;
/**
 * Creates an instance based on a source LinesMesh
 */
export class InstancedLinesMesh extends InstancedMesh {
    constructor(name, source) {
        super(name, source);
        this.intersectionThreshold = source.intersectionThreshold;
    }
    /**
     * @returns the string "InstancedLinesMesh".
     */
    getClassName() {
        return "InstancedLinesMesh";
    }
}
//# sourceMappingURL=linesMesh.js.map