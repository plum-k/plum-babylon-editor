// Do not edit.
import { ShaderStore } from "../../Engines/shaderStore.js";
const name = "logDepthFragment";
const shader = `#ifdef LOGARITHMICDEPTH
fragmentOutputs.fragDepth=log2(fragmentInputs.vFragmentDepth)*uniforms.logarithmicDepthConstant*0.5;
#endif
`;
// Sideeffect
ShaderStore.IncludesShadersStoreWGSL[name] = shader;
/** @internal */
export const logDepthFragmentWGSL = { name, shader };
//# sourceMappingURL=logDepthFragment.js.map