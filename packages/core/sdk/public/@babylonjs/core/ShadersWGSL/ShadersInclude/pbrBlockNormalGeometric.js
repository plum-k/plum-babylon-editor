// Do not edit.
import { ShaderStore } from "../../Engines/shaderStore.js";
const name = "pbrBlockNormalGeometric";
const shader = `var viewDirectionW: vec3f=normalize(scene.vEyePosition.xyz-input.vPositionW);
#ifdef NORMAL
var normalW: vec3f=normalize(input.vNormalW);
#else
var normalW: vec3f=normalize(cross(dpdx(input.vPositionW),dpdy(input.vPositionW)))*scene.vEyePosition.w;
#endif
var geometricNormalW: vec3f=normalW;
#if defined(TWOSIDEDLIGHTING) && defined(NORMAL)
geometricNormalW=select(-geometricNormalW,geometricNormalW,fragmentInputs.frontFacing);
#endif
`;
// Sideeffect
ShaderStore.IncludesShadersStoreWGSL[name] = shader;
/** @internal */
export const pbrBlockNormalGeometricWGSL = { name, shader };
//# sourceMappingURL=pbrBlockNormalGeometric.js.map