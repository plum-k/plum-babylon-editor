// Do not edit.
import { ShaderStore } from "../../Engines/shaderStore.js";
const name = "fogFragment";
const shader = `#ifdef FOG
var fog: f32=CalcFogFactor();
#ifdef PBR
fog=toLinearSpace(fog);
#endif
color= vec4f(mix(uniforms.vFogColor,color.rgb,fog),color.a);
#endif
`;
// Sideeffect
ShaderStore.IncludesShadersStoreWGSL[name] = shader;
/** @internal */
export const fogFragmentWGSL = { name, shader };
//# sourceMappingURL=fogFragment.js.map