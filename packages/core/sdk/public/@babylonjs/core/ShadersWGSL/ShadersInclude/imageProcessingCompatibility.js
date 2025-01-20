// Do not edit.
import { ShaderStore } from "../../Engines/shaderStore.js";
const name = "imageProcessingCompatibility";
const shader = `#ifdef IMAGEPROCESSINGPOSTPROCESS
fragmentOutputs.color=vec4f(pow(fragmentOutputs.color.rgb, vec3f(2.2)),fragmentOutputs.color.a);
#endif
`;
// Sideeffect
ShaderStore.IncludesShadersStoreWGSL[name] = shader;
/** @internal */
export const imageProcessingCompatibilityWGSL = { name, shader };
//# sourceMappingURL=imageProcessingCompatibility.js.map