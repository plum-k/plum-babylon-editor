// Do not edit.
import { ShaderStore } from "../../Engines/shaderStore.js";
const name = "shadowMapFragmentSoftTransparentShadow";
const shader = `#if SM_SOFTTRANSPARENTSHADOW==1
if ((bayerDither8(floor(((fragmentInputs.position.xy)%(8.0)))))/64.0>=uniforms.softTransparentShadowSM.x*alpha) {discard;}
#endif
`;
// Sideeffect
ShaderStore.IncludesShadersStoreWGSL[name] = shader;
/** @internal */
export const shadowMapFragmentSoftTransparentShadowWGSL = { name, shader };
//# sourceMappingURL=shadowMapFragmentSoftTransparentShadow.js.map