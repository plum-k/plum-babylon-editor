// Do not edit.
import { ShaderStore } from "../Engines/shaderStore.js";
const name = "fluidRenderingParticleThicknessVertexShader";
const shader = `attribute position: vec3f;attribute offset: vec2f;uniform view: mat4x4f;uniform projection: mat4x4f;uniform size: vec2f;varying uv: vec2f;@vertex
fn main(input: VertexInputs)->FragmentInputs {var cornerPos: vec3f=vec3f(
vec2f(input.offset.x-0.5,input.offset.y-0.5)*uniforms.size,
0.0
);var viewPos: vec3f=(uniforms.view*vec4f(input.position,1.0)).xyz+cornerPos;vertexOutputs.position=uniforms.projection*vec4f(viewPos,1.0);vertexOutputs.uv=input.offset;}
`;
// Sideeffect
ShaderStore.ShadersStoreWGSL[name] = shader;
/** @internal */
export const fluidRenderingParticleThicknessVertexShaderWGSL = { name, shader };
//# sourceMappingURL=fluidRenderingParticleThickness.vertex.js.map