// Do not edit.
import { ShaderStore } from "../../Engines/shaderStore.js";
const name = "subSurfaceScatteringFunctions";
const shader = `bool testLightingForSSS(float diffusionProfile)
{return diffusionProfile<1.;}`;
// Sideeffect
ShaderStore.IncludesShadersStore[name] = shader;
/** @internal */
export const subSurfaceScatteringFunctions = { name, shader };
//# sourceMappingURL=subSurfaceScatteringFunctions.js.map