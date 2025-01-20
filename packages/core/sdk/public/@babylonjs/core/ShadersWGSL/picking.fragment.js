// Do not edit.
import { ShaderStore } from "../Engines/shaderStore.js";
const name = "pickingPixelShader";
const shader = `#if defined(INSTANCES)
varying vMeshID: vec4f;
#else
uniform meshID: vec4f;
#endif
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {
#if defined(INSTANCES)
fragmentOutputs.color=input.vMeshID;
#else
fragmentOutputs.color=uniforms.meshID;
#endif
}`;
// Sideeffect
ShaderStore.ShadersStoreWGSL[name] = shader;
/** @internal */
export const pickingPixelShaderWGSL = { name, shader };
//# sourceMappingURL=picking.fragment.js.map