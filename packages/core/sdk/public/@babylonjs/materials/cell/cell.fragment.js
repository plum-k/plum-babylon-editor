// Do not edit.
import { ShaderStore } from "@babylonjs/core/Engines/shaderStore.js";
import "@babylonjs/core/Shaders/ShadersInclude/helperFunctions.js";
import "@babylonjs/core/Shaders/ShadersInclude/lightFragmentDeclaration.js";
import "@babylonjs/core/Shaders/ShadersInclude/lightUboDeclaration.js";
import "@babylonjs/core/Shaders/ShadersInclude/lightsFragmentFunctions.js";
import "@babylonjs/core/Shaders/ShadersInclude/shadowsFragmentFunctions.js";
import "@babylonjs/core/Shaders/ShadersInclude/clipPlaneFragmentDeclaration.js";
import "@babylonjs/core/Shaders/ShadersInclude/logDepthDeclaration.js";
import "@babylonjs/core/Shaders/ShadersInclude/fogFragmentDeclaration.js";
import "@babylonjs/core/Shaders/ShadersInclude/clipPlaneFragment.js";
import "@babylonjs/core/Shaders/ShadersInclude/depthPrePass.js";
import "@babylonjs/core/Shaders/ShadersInclude/lightFragment.js";
import "@babylonjs/core/Shaders/ShadersInclude/logDepthFragment.js";
import "@babylonjs/core/Shaders/ShadersInclude/fogFragment.js";
import "@babylonjs/core/Shaders/ShadersInclude/imageProcessingCompatibility.js";
const name = "cellPixelShader";
const shader = `precision highp float;uniform vec4 vEyePosition;uniform vec4 vDiffuseColor;varying vec3 vPositionW;
#ifdef NORMAL
varying vec3 vNormalW;
#endif
#ifdef VERTEXCOLOR
varying vec4 vColor;
#endif
#include<helperFunctions>
#include<__decl__lightFragment>[0..maxSimultaneousLights]
#include<lightsFragmentFunctions>
#include<shadowsFragmentFunctions>
#ifdef DIFFUSE
varying vec2 vDiffuseUV;uniform sampler2D diffuseSampler;uniform vec2 vDiffuseInfos;
#endif
#include<clipPlaneFragmentDeclaration>
#ifdef LOGARITHMICDEPTH
#extension GL_EXT_frag_depth : enable
#endif
#include<logDepthDeclaration>
#include<fogFragmentDeclaration>
vec3 computeCustomDiffuseLighting(lightingInfo info,vec3 diffuseBase,float shadow)
{diffuseBase=info.diffuse*shadow;
#ifdef CELLBASIC
float level=1.0;if (info.ndl<0.5)
level=0.5;diffuseBase.rgb*vec3(level,level,level);
#else
float ToonThresholds[4];ToonThresholds[0]=0.95;ToonThresholds[1]=0.5;ToonThresholds[2]=0.2;ToonThresholds[3]=0.03;float ToonBrightnessLevels[5];ToonBrightnessLevels[0]=1.0;ToonBrightnessLevels[1]=0.8;ToonBrightnessLevels[2]=0.6;ToonBrightnessLevels[3]=0.35;ToonBrightnessLevels[4]=0.2;if (info.ndl>ToonThresholds[0])
{diffuseBase.rgb*=ToonBrightnessLevels[0];}
else if (info.ndl>ToonThresholds[1])
{diffuseBase.rgb*=ToonBrightnessLevels[1];}
else if (info.ndl>ToonThresholds[2])
{diffuseBase.rgb*=ToonBrightnessLevels[2];}
else if (info.ndl>ToonThresholds[3])
{diffuseBase.rgb*=ToonBrightnessLevels[3];}
else
{diffuseBase.rgb*=ToonBrightnessLevels[4];}
#endif
return max(diffuseBase,vec3(0.2));}
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void)
{
#define CUSTOM_FRAGMENT_MAIN_BEGIN
#include<clipPlaneFragment>
vec3 viewDirectionW=normalize(vEyePosition.xyz-vPositionW);vec4 baseColor=vec4(1.,1.,1.,1.);vec3 diffuseColor=vDiffuseColor.rgb;float alpha=vDiffuseColor.a;
#ifdef DIFFUSE
baseColor=texture2D(diffuseSampler,vDiffuseUV);
#ifdef ALPHATEST
if (baseColor.a<0.4)
discard;
#endif
#include<depthPrePass>
baseColor.rgb*=vDiffuseInfos.y;
#endif
#ifdef VERTEXCOLOR
baseColor.rgb*=vColor.rgb;
#endif
#ifdef NORMAL
vec3 normalW=normalize(vNormalW);
#else
vec3 normalW=vec3(1.0,1.0,1.0);
#endif
lightingInfo info;vec3 diffuseBase=vec3(0.,0.,0.);float shadow=1.;float glossiness=0.;float aggShadow=0.;float numLights=0.;
#ifdef SPECULARTERM
vec3 specularBase=vec3(0.,0.,0.);
#endif 
#include<lightFragment>[0..maxSimultaneousLights]
#if defined(VERTEXALPHA) || defined(INSTANCESCOLOR) && defined(INSTANCES)
alpha*=vColor.a;
#endif
vec3 finalDiffuse=clamp(diffuseBase*diffuseColor,0.0,1.0)*baseColor.rgb;vec4 color=vec4(finalDiffuse,alpha);
#include<logDepthFragment>
#include<fogFragment>
gl_FragColor=color;
#include<imageProcessingCompatibility>
#define CUSTOM_FRAGMENT_MAIN_END
}`;
// Sideeffect
ShaderStore.ShadersStore[name] = shader;
/** @internal */
export const cellPixelShader = { name, shader };
//# sourceMappingURL=cell.fragment.js.map