// Do not edit.
import { ShaderStore } from "../../Engines/shaderStore.js";
const name = "pbrBlockReflectivity";
const shader = `struct reflectivityOutParams
{float microSurface;float roughness;vec3 surfaceReflectivityColor;
#ifdef METALLICWORKFLOW
vec3 surfaceAlbedo;
#endif
#if defined(METALLICWORKFLOW) && defined(REFLECTIVITY) && defined(AOSTOREINMETALMAPRED)
vec3 ambientOcclusionColor;
#endif
#if DEBUGMODE>0
#ifdef METALLICWORKFLOW
vec2 metallicRoughness;
#ifdef REFLECTIVITY
vec4 surfaceMetallicColorMap;
#endif
#ifndef FROSTBITE_REFLECTANCE
vec3 metallicF0;
#endif
#else
#ifdef REFLECTIVITY
vec4 surfaceReflectivityColorMap;
#endif
#endif
#endif
};
#define pbr_inline
reflectivityOutParams reflectivityBlock(
in vec4 vReflectivityColor
#ifdef METALLICWORKFLOW
,in vec3 surfaceAlbedo
,in vec4 metallicReflectanceFactors
#endif
#ifdef REFLECTIVITY
,in vec3 reflectivityInfos
,in vec4 surfaceMetallicOrReflectivityColorMap
#endif
#if defined(METALLICWORKFLOW) && defined(REFLECTIVITY) && defined(AOSTOREINMETALMAPRED)
,in vec3 ambientOcclusionColorIn
#endif
#ifdef MICROSURFACEMAP
,in vec4 microSurfaceTexel
#endif
#ifdef DETAIL
,in vec4 detailColor
,in vec4 vDetailInfos
#endif
)
{reflectivityOutParams outParams;float microSurface=vReflectivityColor.a;vec3 surfaceReflectivityColor=vReflectivityColor.rgb;
#ifdef METALLICWORKFLOW
vec2 metallicRoughness=surfaceReflectivityColor.rg;
#ifdef REFLECTIVITY
#if DEBUGMODE>0
outParams.surfaceMetallicColorMap=surfaceMetallicOrReflectivityColorMap;
#endif
#ifdef AOSTOREINMETALMAPRED
vec3 aoStoreInMetalMap=vec3(surfaceMetallicOrReflectivityColorMap.r,surfaceMetallicOrReflectivityColorMap.r,surfaceMetallicOrReflectivityColorMap.r);outParams.ambientOcclusionColor=mix(ambientOcclusionColorIn,aoStoreInMetalMap,reflectivityInfos.z);
#endif
#ifdef METALLNESSSTOREINMETALMAPBLUE
metallicRoughness.r*=surfaceMetallicOrReflectivityColorMap.b;
#else
metallicRoughness.r*=surfaceMetallicOrReflectivityColorMap.r;
#endif
#ifdef ROUGHNESSSTOREINMETALMAPALPHA
metallicRoughness.g*=surfaceMetallicOrReflectivityColorMap.a;
#else
#ifdef ROUGHNESSSTOREINMETALMAPGREEN
metallicRoughness.g*=surfaceMetallicOrReflectivityColorMap.g;
#endif
#endif
#endif
#ifdef DETAIL
float detailRoughness=mix(0.5,detailColor.b,vDetailInfos.w);float loLerp=mix(0.,metallicRoughness.g,detailRoughness*2.);float hiLerp=mix(metallicRoughness.g,1.,(detailRoughness-0.5)*2.);metallicRoughness.g=mix(loLerp,hiLerp,step(detailRoughness,0.5));
#endif
#ifdef MICROSURFACEMAP
metallicRoughness.g*=microSurfaceTexel.r;
#endif
#if DEBUGMODE>0
outParams.metallicRoughness=metallicRoughness;
#endif
#define CUSTOM_FRAGMENT_UPDATE_METALLICROUGHNESS
microSurface=1.0-metallicRoughness.g;vec3 baseColor=surfaceAlbedo;
#ifdef FROSTBITE_REFLECTANCE
outParams.surfaceAlbedo=baseColor.rgb*(1.0-metallicRoughness.r);surfaceReflectivityColor=mix(0.16*reflectance*reflectance,baseColor,metallicRoughness.r);
#else
vec3 metallicF0=metallicReflectanceFactors.rgb;
#if DEBUGMODE>0
outParams.metallicF0=metallicF0;
#endif
outParams.surfaceAlbedo=mix(baseColor.rgb*(1.0-metallicF0),vec3(0.,0.,0.),metallicRoughness.r);surfaceReflectivityColor=mix(metallicF0,baseColor,metallicRoughness.r);
#endif
#else
#ifdef REFLECTIVITY
surfaceReflectivityColor*=surfaceMetallicOrReflectivityColorMap.rgb;
#if DEBUGMODE>0
outParams.surfaceReflectivityColorMap=surfaceMetallicOrReflectivityColorMap;
#endif
#ifdef MICROSURFACEFROMREFLECTIVITYMAP
microSurface*=surfaceMetallicOrReflectivityColorMap.a;microSurface*=reflectivityInfos.z;
#else
#ifdef MICROSURFACEAUTOMATIC
microSurface*=computeDefaultMicroSurface(microSurface,surfaceReflectivityColor);
#endif
#ifdef MICROSURFACEMAP
microSurface*=microSurfaceTexel.r;
#endif
#define CUSTOM_FRAGMENT_UPDATE_MICROSURFACE
#endif
#endif
#endif
microSurface=saturate(microSurface);float roughness=1.-microSurface;outParams.microSurface=microSurface;outParams.roughness=roughness;outParams.surfaceReflectivityColor=surfaceReflectivityColor;return outParams;}
`;
// Sideeffect
ShaderStore.IncludesShadersStore[name] = shader;
/** @internal */
export const pbrBlockReflectivity = { name, shader };
//# sourceMappingURL=pbrBlockReflectivity.js.map