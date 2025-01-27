// Do not edit.
import { ShaderStore } from "../../Engines/shaderStore.js";
const name = "pbrBlockReflection";
const shader = `#ifdef REFLECTION
struct reflectionOutParams
{vec4 environmentRadiance;vec3 environmentIrradiance;
#ifdef REFLECTIONMAP_3D
vec3 reflectionCoords;
#else
vec2 reflectionCoords;
#endif
#ifdef SS_TRANSLUCENCY
#ifdef USESPHERICALFROMREFLECTIONMAP
#if !defined(NORMAL) || !defined(USESPHERICALINVERTEX)
vec3 irradianceVector;
#endif
#endif
#endif
};
#define pbr_inline
void createReflectionCoords(
in vec3 vPositionW,
in vec3 normalW,
#ifdef ANISOTROPIC
in anisotropicOutParams anisotropicOut,
#endif
#ifdef REFLECTIONMAP_3D
out vec3 reflectionCoords
#else
out vec2 reflectionCoords
#endif
)
{
#ifdef ANISOTROPIC
vec3 reflectionVector=computeReflectionCoords(vec4(vPositionW,1.0),anisotropicOut.anisotropicNormal);
#else
vec3 reflectionVector=computeReflectionCoords(vec4(vPositionW,1.0),normalW);
#endif
#ifdef REFLECTIONMAP_OPPOSITEZ
reflectionVector.z*=-1.0;
#endif
#ifdef REFLECTIONMAP_3D
reflectionCoords=reflectionVector;
#else
reflectionCoords=reflectionVector.xy;
#ifdef REFLECTIONMAP_PROJECTION
reflectionCoords/=reflectionVector.z;
#endif
reflectionCoords.y=1.0-reflectionCoords.y;
#endif
}
#define pbr_inline
#define inline
void sampleReflectionTexture(
in float alphaG,
in vec3 vReflectionMicrosurfaceInfos,
in vec2 vReflectionInfos,
in vec3 vReflectionColor,
#if defined(LODINREFLECTIONALPHA) && !defined(REFLECTIONMAP_SKYBOX)
in float NdotVUnclamped,
#endif
#ifdef LINEARSPECULARREFLECTION
in float roughness,
#endif
#ifdef REFLECTIONMAP_3D
in samplerCube reflectionSampler,
const vec3 reflectionCoords,
#else
in sampler2D reflectionSampler,
const vec2 reflectionCoords,
#endif
#ifndef LODBASEDMICROSFURACE
#ifdef REFLECTIONMAP_3D
in samplerCube reflectionSamplerLow,
in samplerCube reflectionSamplerHigh,
#else
in sampler2D reflectionSamplerLow,
in sampler2D reflectionSamplerHigh,
#endif
#endif
#ifdef REALTIME_FILTERING
in vec2 vReflectionFilteringInfo,
#endif
out vec4 environmentRadiance
)
{
#if defined(LODINREFLECTIONALPHA) && !defined(REFLECTIONMAP_SKYBOX)
float reflectionLOD=getLodFromAlphaG(vReflectionMicrosurfaceInfos.x,alphaG,NdotVUnclamped);
#elif defined(LINEARSPECULARREFLECTION)
float reflectionLOD=getLinearLodFromRoughness(vReflectionMicrosurfaceInfos.x,roughness);
#else
float reflectionLOD=getLodFromAlphaG(vReflectionMicrosurfaceInfos.x,alphaG);
#endif
#ifdef LODBASEDMICROSFURACE
reflectionLOD=reflectionLOD*vReflectionMicrosurfaceInfos.y+vReflectionMicrosurfaceInfos.z;
#ifdef LODINREFLECTIONALPHA
float automaticReflectionLOD=UNPACK_LOD(sampleReflection(reflectionSampler,reflectionCoords).a);float requestedReflectionLOD=max(automaticReflectionLOD,reflectionLOD);
#else
float requestedReflectionLOD=reflectionLOD;
#endif
#ifdef REALTIME_FILTERING
environmentRadiance=vec4(radiance(alphaG,reflectionSampler,reflectionCoords,vReflectionFilteringInfo),1.0);
#else
environmentRadiance=sampleReflectionLod(reflectionSampler,reflectionCoords,reflectionLOD);
#endif
#else
float lodReflectionNormalized=saturate(reflectionLOD/log2(vReflectionMicrosurfaceInfos.x));float lodReflectionNormalizedDoubled=lodReflectionNormalized*2.0;vec4 environmentMid=sampleReflection(reflectionSampler,reflectionCoords);if (lodReflectionNormalizedDoubled<1.0){environmentRadiance=mix(
sampleReflection(reflectionSamplerHigh,reflectionCoords),
environmentMid,
lodReflectionNormalizedDoubled
);} else {environmentRadiance=mix(
environmentMid,
sampleReflection(reflectionSamplerLow,reflectionCoords),
lodReflectionNormalizedDoubled-1.0
);}
#endif
#ifdef RGBDREFLECTION
environmentRadiance.rgb=fromRGBD(environmentRadiance);
#endif
#ifdef GAMMAREFLECTION
environmentRadiance.rgb=toLinearSpace(environmentRadiance.rgb);
#endif
environmentRadiance.rgb*=vReflectionInfos.x;environmentRadiance.rgb*=vReflectionColor.rgb;}
#define pbr_inline
#define inline
reflectionOutParams reflectionBlock(
in vec3 vPositionW
,in vec3 normalW
,in float alphaG
,in vec3 vReflectionMicrosurfaceInfos
,in vec2 vReflectionInfos
,in vec3 vReflectionColor
#ifdef ANISOTROPIC
,in anisotropicOutParams anisotropicOut
#endif
#if defined(LODINREFLECTIONALPHA) && !defined(REFLECTIONMAP_SKYBOX)
,in float NdotVUnclamped
#endif
#ifdef LINEARSPECULARREFLECTION
,in float roughness
#endif
#ifdef REFLECTIONMAP_3D
,in samplerCube reflectionSampler
#else
,in sampler2D reflectionSampler
#endif
#if defined(NORMAL) && defined(USESPHERICALINVERTEX)
,in vec3 vEnvironmentIrradiance
#endif
#if (defined(USESPHERICALFROMREFLECTIONMAP) && (!defined(NORMAL) || !defined(USESPHERICALINVERTEX))) || (defined(USEIRRADIANCEMAP) && defined(REFLECTIONMAP_3D))
,in mat4 reflectionMatrix
#endif
#ifdef USEIRRADIANCEMAP
#ifdef REFLECTIONMAP_3D
,in samplerCube irradianceSampler
#else
,in sampler2D irradianceSampler
#endif
#endif
#ifndef LODBASEDMICROSFURACE
#ifdef REFLECTIONMAP_3D
,in samplerCube reflectionSamplerLow
,in samplerCube reflectionSamplerHigh
#else
,in sampler2D reflectionSamplerLow
,in sampler2D reflectionSamplerHigh
#endif
#endif
#ifdef REALTIME_FILTERING
,in vec2 vReflectionFilteringInfo
#ifdef IBL_CDF_FILTERING
,in sampler2D icdfSampler
#endif
#endif
)
{reflectionOutParams outParams;vec4 environmentRadiance=vec4(0.,0.,0.,0.);
#ifdef REFLECTIONMAP_3D
vec3 reflectionCoords=vec3(0.);
#else
vec2 reflectionCoords=vec2(0.);
#endif
createReflectionCoords(
vPositionW,
normalW,
#ifdef ANISOTROPIC
anisotropicOut,
#endif
reflectionCoords
);sampleReflectionTexture(
alphaG,
vReflectionMicrosurfaceInfos,
vReflectionInfos,
vReflectionColor,
#if defined(LODINREFLECTIONALPHA) && !defined(REFLECTIONMAP_SKYBOX)
NdotVUnclamped,
#endif
#ifdef LINEARSPECULARREFLECTION
roughness,
#endif
#ifdef REFLECTIONMAP_3D
reflectionSampler,
reflectionCoords,
#else
reflectionSampler,
reflectionCoords,
#endif
#ifndef LODBASEDMICROSFURACE
reflectionSamplerLow,
reflectionSamplerHigh,
#endif
#ifdef REALTIME_FILTERING
vReflectionFilteringInfo,
#endif
environmentRadiance
);vec3 environmentIrradiance=vec3(0.,0.,0.);
#if (defined(USESPHERICALFROMREFLECTIONMAP) && (!defined(NORMAL) || !defined(USESPHERICALINVERTEX))) || (defined(USEIRRADIANCEMAP) && defined(REFLECTIONMAP_3D))
#ifdef ANISOTROPIC
vec3 irradianceVector=vec3(reflectionMatrix*vec4(anisotropicOut.anisotropicNormal,0)).xyz;
#else
vec3 irradianceVector=vec3(reflectionMatrix*vec4(normalW,0)).xyz;
#endif
#ifdef REFLECTIONMAP_OPPOSITEZ
irradianceVector.z*=-1.0;
#endif
#ifdef INVERTCUBICMAP
irradianceVector.y*=-1.0;
#endif
#endif
#ifdef USESPHERICALFROMREFLECTIONMAP
#if defined(NORMAL) && defined(USESPHERICALINVERTEX)
environmentIrradiance=vEnvironmentIrradiance;
#else
#if defined(REALTIME_FILTERING)
environmentIrradiance=irradiance(reflectionSampler,irradianceVector,vReflectionFilteringInfo
#ifdef IBL_CDF_FILTERING
,icdfSampler
#endif
);
#else
environmentIrradiance=computeEnvironmentIrradiance(irradianceVector);
#endif
#ifdef SS_TRANSLUCENCY
outParams.irradianceVector=irradianceVector;
#endif
#endif
#elif defined(USEIRRADIANCEMAP)
#ifdef REFLECTIONMAP_3D
vec4 environmentIrradiance4=sampleReflection(irradianceSampler,irradianceVector);
#else
vec4 environmentIrradiance4=sampleReflection(irradianceSampler,reflectionCoords);
#endif
environmentIrradiance=environmentIrradiance4.rgb;
#ifdef RGBDREFLECTION
environmentIrradiance.rgb=fromRGBD(environmentIrradiance4);
#endif
#ifdef GAMMAREFLECTION
environmentIrradiance.rgb=toLinearSpace(environmentIrradiance.rgb);
#endif
#endif
environmentIrradiance*=vReflectionColor.rgb;
#ifdef MIX_IBL_RADIANCE_WITH_IRRADIANCE
outParams.environmentRadiance=vec4(mix(environmentRadiance.rgb,environmentIrradiance,alphaG),environmentRadiance.a);
#else
outParams.environmentRadiance=environmentRadiance;
#endif
outParams.environmentIrradiance=environmentIrradiance;outParams.reflectionCoords=reflectionCoords;return outParams;}
#endif
`;
// Sideeffect
ShaderStore.IncludesShadersStore[name] = shader;
/** @internal */
export const pbrBlockReflection = { name, shader };
//# sourceMappingURL=pbrBlockReflection.js.map