// Do not edit.
import { ShaderStore } from "../../Engines/shaderStore.js";
const name = "shadowMapFragmentSoftTransparentShadow";
const shader = `#if SM_SOFTTRANSPARENTSHADOW==1
if ((bayerDither8(floor(mod(gl_FragCoord.xy,8.0))))/64.0>=softTransparentShadowSM.x*alpha) discard;
#endif
`;
// Sideeffect
ShaderStore.IncludesShadersStore[name] = shader;
/** @internal */
export const shadowMapFragmentSoftTransparentShadow = { name, shader };
//# sourceMappingURL=shadowMapFragmentSoftTransparentShadow.js.map