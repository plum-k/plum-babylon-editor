// Do not edit.
import { ShaderStore } from "../Engines/shaderStore.js";
const name = "meshUVSpaceRendererFinaliserVertexShader";
const shader = `attribute position: vec3f;attribute uv: vec2f;uniform worldViewProjection: mat4x4f;varying vUV: vec2f;@vertex
fn main(input : VertexInputs)->FragmentInputs {vertexOutputs.position=uniforms.worldViewProjection* vec4f(input.position,1.0);vertexOutputs.positionvUV=input.uv;}
`;
// Sideeffect
ShaderStore.ShadersStoreWGSL[name] = shader;
/** @internal */
export const meshUVSpaceRendererFinaliserVertexShaderWGSL = { name, shader };
//# sourceMappingURL=meshUVSpaceRendererFinaliser.vertex.js.map