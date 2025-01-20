// Do not edit.
import { ShaderStore } from "../../Engines/shaderStore.js";
const name = "pbrBlockImageProcessing";
const shader = `#if defined(IMAGEPROCESSINGPOSTPROCESS) || defined(SS_SCATTERING)
#if !defined(SKIPFINALCOLORCLAMP)
finalColor=vec4f(clamp(finalColor.rgb,vec3f(0.),vec3f(30.0)),finalColor.a);
#endif
#else
finalColor=applyImageProcessing(finalColor);
#endif
finalColor=vec4f(finalColor.rgb,finalColor.a*mesh.visibility);
#ifdef PREMULTIPLYALPHA
finalColor=vec4f(finalColor.rgb*finalColor.a,finalColor.a);;
#endif
`;
// Sideeffect
ShaderStore.IncludesShadersStoreWGSL[name] = shader;
/** @internal */
export const pbrBlockImageProcessingWGSL = { name, shader };
//# sourceMappingURL=pbrBlockImageProcessing.js.map