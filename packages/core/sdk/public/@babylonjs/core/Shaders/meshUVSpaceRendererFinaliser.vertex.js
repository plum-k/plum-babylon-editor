// Do not edit.
import { ShaderStore } from "../Engines/shaderStore.js";
const name = "meshUVSpaceRendererFinaliserVertexShader";
const shader = `precision highp float;attribute vec3 position;attribute vec2 uv;uniform mat4 worldViewProjection;varying vec2 vUV;void main() {gl_Position=worldViewProjection*vec4(position,1.0);vUV=uv;}
`;
// Sideeffect
ShaderStore.ShadersStore[name] = shader;
/** @internal */
export const meshUVSpaceRendererFinaliserVertexShader = { name, shader };
//# sourceMappingURL=meshUVSpaceRendererFinaliser.vertex.js.map