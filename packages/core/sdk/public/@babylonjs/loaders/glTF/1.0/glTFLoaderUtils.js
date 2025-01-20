import { EParameterType, ETextureWrapMode, ETextureFilterType, EComponentType } from "./glTFLoaderInterfaces.js";
import { Vector2, Vector3, Vector4, Matrix } from "@babylonjs/core/Maths/math.vector.js";
import { Color4 } from "@babylonjs/core/Maths/math.color.js";
import { Effect } from "@babylonjs/core/Materials/effect.js";
import { ShaderMaterial } from "@babylonjs/core/Materials/shaderMaterial.js";
import { Texture } from "@babylonjs/core/Materials/Textures/texture.js";
/**
 * Utils functions for GLTF
 * @internal
 * @deprecated
 */
export class GLTFUtils {
    /**
     * Sets the given "parameter" matrix
     * @param scene the Scene object
     * @param source the source node where to pick the matrix
     * @param parameter the GLTF technique parameter
     * @param uniformName the name of the shader's uniform
     * @param shaderMaterial the shader material
     */
    static SetMatrix(scene, source, parameter, uniformName, shaderMaterial) {
        let mat = null;
        if (parameter.semantic === "MODEL") {
            mat = source.getWorldMatrix();
        }
        else if (parameter.semantic === "PROJECTION") {
            mat = scene.getProjectionMatrix();
        }
        else if (parameter.semantic === "VIEW") {
            mat = scene.getViewMatrix();
        }
        else if (parameter.semantic === "MODELVIEWINVERSETRANSPOSE") {
            mat = Matrix.Transpose(source.getWorldMatrix().multiply(scene.getViewMatrix()).invert());
        }
        else if (parameter.semantic === "MODELVIEW") {
            mat = source.getWorldMatrix().multiply(scene.getViewMatrix());
        }
        else if (parameter.semantic === "MODELVIEWPROJECTION") {
            mat = source.getWorldMatrix().multiply(scene.getTransformMatrix());
        }
        else if (parameter.semantic === "MODELINVERSE") {
            mat = source.getWorldMatrix().invert();
        }
        else if (parameter.semantic === "VIEWINVERSE") {
            mat = scene.getViewMatrix().invert();
        }
        else if (parameter.semantic === "PROJECTIONINVERSE") {
            mat = scene.getProjectionMatrix().invert();
        }
        else if (parameter.semantic === "MODELVIEWINVERSE") {
            mat = source.getWorldMatrix().multiply(scene.getViewMatrix()).invert();
        }
        else if (parameter.semantic === "MODELVIEWPROJECTIONINVERSE") {
            mat = source.getWorldMatrix().multiply(scene.getTransformMatrix()).invert();
        }
        else if (parameter.semantic === "MODELINVERSETRANSPOSE") {
            mat = Matrix.Transpose(source.getWorldMatrix().invert());
        }
        if (mat) {
            switch (parameter.type) {
                case EParameterType.FLOAT_MAT2:
                    shaderMaterial.setMatrix2x2(uniformName, Matrix.GetAsMatrix2x2(mat));
                    break;
                case EParameterType.FLOAT_MAT3:
                    shaderMaterial.setMatrix3x3(uniformName, Matrix.GetAsMatrix3x3(mat));
                    break;
                case EParameterType.FLOAT_MAT4:
                    shaderMaterial.setMatrix(uniformName, mat);
                    break;
                default:
                    break;
            }
        }
    }
    /**
     * Sets the given "parameter" matrix
     * @param shaderMaterial the shader material
     * @param uniform the name of the shader's uniform
     * @param value the value of the uniform
     * @param type the uniform's type (EParameterType FLOAT, VEC2, VEC3 or VEC4)
     * @returns true if set, else false
     */
    static SetUniform(shaderMaterial, uniform, value, type) {
        switch (type) {
            case EParameterType.FLOAT:
                shaderMaterial.setFloat(uniform, value);
                return true;
            case EParameterType.FLOAT_VEC2:
                shaderMaterial.setVector2(uniform, Vector2.FromArray(value));
                return true;
            case EParameterType.FLOAT_VEC3:
                shaderMaterial.setVector3(uniform, Vector3.FromArray(value));
                return true;
            case EParameterType.FLOAT_VEC4:
                shaderMaterial.setVector4(uniform, Vector4.FromArray(value));
                return true;
            default:
                return false;
        }
    }
    /**
     * Returns the wrap mode of the texture
     * @param mode the mode value
     * @returns the wrap mode (TEXTURE_WRAP_ADDRESSMODE, MIRROR_ADDRESSMODE or CLAMP_ADDRESSMODE)
     */
    static GetWrapMode(mode) {
        switch (mode) {
            case ETextureWrapMode.CLAMP_TO_EDGE:
                return Texture.CLAMP_ADDRESSMODE;
            case ETextureWrapMode.MIRRORED_REPEAT:
                return Texture.MIRROR_ADDRESSMODE;
            case ETextureWrapMode.REPEAT:
                return Texture.WRAP_ADDRESSMODE;
            default:
                return Texture.WRAP_ADDRESSMODE;
        }
    }
    /**
     * Returns the byte stride giving an accessor
     * @param accessor the GLTF accessor objet
     * @returns the byte stride
     */
    static GetByteStrideFromType(accessor) {
        // Needs this function since "byteStride" isn't requiered in glTF format
        const type = accessor.type;
        switch (type) {
            case "VEC2":
                return 2;
            case "VEC3":
                return 3;
            case "VEC4":
                return 4;
            case "MAT2":
                return 4;
            case "MAT3":
                return 9;
            case "MAT4":
                return 16;
            default:
                return 1;
        }
    }
    /**
     * Returns the texture filter mode giving a mode value
     * @param mode the filter mode value
     * @returns the filter mode (TODO - needs to be a type?)
     */
    static GetTextureFilterMode(mode) {
        switch (mode) {
            case ETextureFilterType.LINEAR:
            case ETextureFilterType.LINEAR_MIPMAP_NEAREST:
            case ETextureFilterType.LINEAR_MIPMAP_LINEAR:
                return Texture.TRILINEAR_SAMPLINGMODE;
            case ETextureFilterType.NEAREST:
            case ETextureFilterType.NEAREST_MIPMAP_NEAREST:
                return Texture.NEAREST_SAMPLINGMODE;
            default:
                return Texture.BILINEAR_SAMPLINGMODE;
        }
    }
    static GetBufferFromBufferView(gltfRuntime, bufferView, byteOffset, byteLength, componentType) {
        byteOffset = bufferView.byteOffset + byteOffset;
        const loadedBufferView = gltfRuntime.loadedBufferViews[bufferView.buffer];
        if (byteOffset + byteLength > loadedBufferView.byteLength) {
            throw new Error("Buffer access is out of range");
        }
        const buffer = loadedBufferView.buffer;
        byteOffset += loadedBufferView.byteOffset;
        switch (componentType) {
            case EComponentType.BYTE:
                return new Int8Array(buffer, byteOffset, byteLength);
            case EComponentType.UNSIGNED_BYTE:
                return new Uint8Array(buffer, byteOffset, byteLength);
            case EComponentType.SHORT:
                return new Int16Array(buffer, byteOffset, byteLength);
            case EComponentType.UNSIGNED_SHORT:
                return new Uint16Array(buffer, byteOffset, byteLength);
            default:
                return new Float32Array(buffer, byteOffset, byteLength);
        }
    }
    /**
     * Returns a buffer from its accessor
     * @param gltfRuntime the GLTF runtime
     * @param accessor the GLTF accessor
     * @returns an array buffer view
     */
    static GetBufferFromAccessor(gltfRuntime, accessor) {
        const bufferView = gltfRuntime.bufferViews[accessor.bufferView];
        const byteLength = accessor.count * GLTFUtils.GetByteStrideFromType(accessor);
        return GLTFUtils.GetBufferFromBufferView(gltfRuntime, bufferView, accessor.byteOffset, byteLength, accessor.componentType);
    }
    /**
     * Decodes a buffer view into a string
     * @param view the buffer view
     * @returns a string
     */
    static DecodeBufferToText(view) {
        let result = "";
        const length = view.byteLength;
        for (let i = 0; i < length; ++i) {
            result += String.fromCharCode(view[i]);
        }
        return result;
    }
    /**
     * Returns the default material of gltf. Related to
     * https://github.com/KhronosGroup/glTF/tree/master/specification/1.0#appendix-a-default-material
     * @param scene the Babylon.js scene
     * @returns the default Babylon material
     */
    static GetDefaultMaterial(scene) {
        if (!GLTFUtils._DefaultMaterial) {
            Effect.ShadersStore["GLTFDefaultMaterialVertexShader"] = [
                "precision highp float;",
                "",
                "uniform mat4 worldView;",
                "uniform mat4 projection;",
                "",
                "attribute vec3 position;",
                "",
                "void main(void)",
                "{",
                "    gl_Position = projection * worldView * vec4(position, 1.0);",
                "}",
            ].join("\n");
            Effect.ShadersStore["GLTFDefaultMaterialPixelShader"] = [
                "precision highp float;",
                "",
                "uniform vec4 u_emission;",
                "",
                "void main(void)",
                "{",
                "    gl_FragColor = u_emission;",
                "}",
            ].join("\n");
            const shaderPath = {
                vertex: "GLTFDefaultMaterial",
                fragment: "GLTFDefaultMaterial",
            };
            const options = {
                attributes: ["position"],
                uniforms: ["worldView", "projection", "u_emission"],
                samplers: new Array(),
                needAlphaBlending: false,
            };
            GLTFUtils._DefaultMaterial = new ShaderMaterial("GLTFDefaultMaterial", scene, shaderPath, options);
            GLTFUtils._DefaultMaterial.setColor4("u_emission", new Color4(0.5, 0.5, 0.5, 1.0));
        }
        return GLTFUtils._DefaultMaterial;
    }
}
// The GLTF default material
GLTFUtils._DefaultMaterial = null;
//# sourceMappingURL=glTFLoaderUtils.js.map