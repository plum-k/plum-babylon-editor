// Do not edit.
import { ShaderStore } from "../../Engines/shaderStore.js";
const name = "pbrBlockDirectLighting";
const shader = `var diffuseBase: vec3f=vec3f(0.,0.,0.);
#ifdef SPECULARTERM
var specularBase: vec3f=vec3f(0.,0.,0.);
#endif
#ifdef CLEARCOAT
var clearCoatBase: vec3f=vec3f(0.,0.,0.);
#endif
#ifdef SHEEN
var sheenBase: vec3f=vec3f(0.,0.,0.);
#endif
var preInfo: preLightingInfo;var info: lightingInfo;var shadow: f32=1.; 
var aggShadow: f32=0.;var numLights: f32=0.;
#if defined(CLEARCOAT) && defined(CLEARCOAT_TINT)
var absorption: vec3f=vec3f(0.);
#endif
`;
// Sideeffect
ShaderStore.IncludesShadersStoreWGSL[name] = shader;
/** @internal */
export const pbrBlockDirectLightingWGSL = { name, shader };
//# sourceMappingURL=pbrBlockDirectLighting.js.map