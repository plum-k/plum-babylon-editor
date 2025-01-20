// Do not edit.
import { ShaderStore } from "../Engines/shaderStore.js";
const name = "meshUVSpaceRendererMaskerPixelShader";
const shader = `varying vUV: vec2f;@fragment
fn main(input: FragmentInputs)->FragmentOutputs {fragmentOutputs.color= vec4f(1.0,1.0,1.0,1.0);}
`;
// Sideeffect
ShaderStore.ShadersStoreWGSL[name] = shader;
/** @internal */
export const meshUVSpaceRendererMaskerPixelShaderWGSL = { name, shader };
//# sourceMappingURL=meshUVSpaceRendererMasker.fragment.js.map