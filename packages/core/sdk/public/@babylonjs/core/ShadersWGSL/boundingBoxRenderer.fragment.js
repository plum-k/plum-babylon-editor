// Do not edit.
import { ShaderStore } from "../Engines/shaderStore.js";
const name = "boundingBoxRendererPixelShader";
const shader = `uniform color: vec4f;
#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {
#define CUSTOM_FRAGMENT_MAIN_BEGIN
fragmentOutputs.color=uniforms.color;
#define CUSTOM_FRAGMENT_MAIN_END
}`;
// Sideeffect
ShaderStore.ShadersStoreWGSL[name] = shader;
/** @internal */
export const boundingBoxRendererPixelShaderWGSL = { name, shader };
//# sourceMappingURL=boundingBoxRenderer.fragment.js.map