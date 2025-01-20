// Do not edit.
import { ShaderStore } from "../Engines/shaderStore.js";
const name = "meshUVSpaceRendererMaskerVertexShader";
const shader = `attribute uv: vec2f;varying vUV: vec2f;@vertex
fn main(input : VertexInputs)->FragmentInputs {vertexOutputs.position= vec4f( vec2f(input.uv.x,input.uv.y)*2.0-1.0,0.,1.0);vertexOutputs.vUV=input.uv;}`;
// Sideeffect
ShaderStore.ShadersStoreWGSL[name] = shader;
/** @internal */
export const meshUVSpaceRendererMaskerVertexShaderWGSL = { name, shader };
//# sourceMappingURL=meshUVSpaceRendererMasker.vertex.js.map