// Do not edit.
import { ShaderStore } from "../../Engines/shaderStore.js";
const name = "pbrBlockReflectance0";
const shader = `var reflectance: f32=max(max(reflectivityOut.surfaceReflectivityColor.r,reflectivityOut.surfaceReflectivityColor.g),reflectivityOut.surfaceReflectivityColor.b);var specularEnvironmentR0: vec3f=reflectivityOut.surfaceReflectivityColor.rgb;
#ifdef METALLICWORKFLOW
var specularEnvironmentR90: vec3f= vec3f(metallicReflectanceFactors.a);
#else 
var specularEnvironmentR90: vec3f= vec3f(1.0,1.0,1.0);
#endif
#ifdef ALPHAFRESNEL
var reflectance90: f32=fresnelGrazingReflectance(reflectance);specularEnvironmentR90=specularEnvironmentR90*reflectance90;
#endif
`;
// Sideeffect
ShaderStore.IncludesShadersStoreWGSL[name] = shader;
/** @internal */
export const pbrBlockReflectance0WGSL = { name, shader };
//# sourceMappingURL=pbrBlockReflectance0.js.map