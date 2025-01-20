// Do not edit.
import { ShaderStore } from "../Engines/shaderStore.js";
const name = "oitBackBlendPixelShader";
const shader = `var uBackColor: texture_2d<f32>;@fragment
fn main(input: FragmentInputs)->FragmentOutputs {fragmentOutputs.color=textureLoad(uBackColor,vec2i(fragmentInputs.position.xy),0);if (fragmentOutputs.color.a==0.0) {discard;}}
`;
// Sideeffect
ShaderStore.ShadersStoreWGSL[name] = shader;
/** @internal */
export const oitBackBlendPixelShaderWGSL = { name, shader };
//# sourceMappingURL=oitBackBlend.fragment.js.map