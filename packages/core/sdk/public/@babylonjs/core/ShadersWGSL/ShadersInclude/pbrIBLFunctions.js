// Do not edit.
import { ShaderStore } from "../../Engines/shaderStore.js";
const name = "pbrIBLFunctions";
const shader = `#if defined(REFLECTION) || defined(SS_REFRACTION)
fn getLodFromAlphaG(cubeMapDimensionPixels: f32,microsurfaceAverageSlope: f32)->f32 {var microsurfaceAverageSlopeTexels: f32=cubeMapDimensionPixels*microsurfaceAverageSlope;var lod: f32=log2(microsurfaceAverageSlopeTexels);return lod;}
fn getLinearLodFromRoughness(cubeMapDimensionPixels: f32,roughness: f32)->f32 {var lod: f32=log2(cubeMapDimensionPixels)*roughness;return lod;}
#endif
#if defined(ENVIRONMENTBRDF) && defined(RADIANCEOCCLUSION)
fn environmentRadianceOcclusion(ambientOcclusion: f32,NdotVUnclamped: f32)->f32 {var temp: f32=NdotVUnclamped+ambientOcclusion;return saturate(temp*temp-1.0+ambientOcclusion);}
#endif
#if defined(ENVIRONMENTBRDF) && defined(HORIZONOCCLUSION)
fn environmentHorizonOcclusion(view: vec3f,normal: vec3f,geometricNormal: vec3f)->f32 {var reflection: vec3f=reflect(view,normal);var temp: f32=saturate(1.0+1.1*dot(reflection,geometricNormal));return temp*temp;}
#endif
#if defined(LODINREFLECTIONALPHA) || defined(SS_LODINREFRACTIONALPHA)
fn UNPACK_LOD(x: f32)->f32 {return (1.0-x)*255.0;}
fn getLodFromAlphaGNdotV(cubeMapDimensionPixels: f32,alphaG: f32,NdotV: f32)->f32 {var microsurfaceAverageSlope: f32=alphaG;microsurfaceAverageSlope*=sqrt(abs(NdotV));return getLodFromAlphaG(cubeMapDimensionPixels,microsurfaceAverageSlope);}
#endif
`;
// Sideeffect
ShaderStore.IncludesShadersStoreWGSL[name] = shader;
/** @internal */
export const pbrIBLFunctionsWGSL = { name, shader };
//# sourceMappingURL=pbrIBLFunctions.js.map