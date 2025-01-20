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
const name = "normalPixelShader";
const shader = `precision highp float;uniform vec4 vEyePosition;uniform vec4 vDiffuseColor;varying vec3 vPositionW;
#ifdef NORMAL
varying vec3 vNormalW;
#endif
#ifdef LIGHTING
#include<helperFunctions>
#include<__decl__lightFragment>[0]
#include<__decl__lightFragment>[1]
#include<__decl__lightFragment>[2]
#include<__decl__lightFragment>[3]
#include<lightsFragmentFunctions>
#include<shadowsFragmentFunctions>
#endif
#ifdef DIFFUSE
varying vec2 vDiffuseUV;uniform sampler2D diffuseSampler;uniform vec2 vDiffuseInfos;
#endif
#include<clipPlaneFragmentDeclaration>
#ifdef LOGARITHMICDEPTH
#extension GL_EXT_frag_depth : enable
#endif
#include<logDepthDeclaration>
#include<fogFragmentDeclaration>
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) {
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
#ifdef NORMAL
baseColor=mix(baseColor,vec4(vNormalW,1.0),0.5);
#endif
#ifdef NORMAL
vec3 normalW=normalize(vNormalW);
#else
vec3 normalW=vec3(1.0,1.0,1.0);
#endif
#ifdef LIGHTING
vec3 diffuseBase=vec3(0.,0.,0.);lightingInfo info;float shadow=1.;float glossiness=0.;float aggShadow=0.;float numLights=0.;
#include<lightFragment>[0]
#include<lightFragment>[1]
#include<lightFragment>[2]
#include<lightFragment>[3]
vec3 finalDiffuse=clamp(diffuseBase*diffuseColor,0.0,1.0)*baseColor.rgb;
#else
vec3 finalDiffuse= baseColor.rgb;
#endif
vec4 color=vec4(finalDiffuse,alpha);
#include<logDepthFragment>
#include<fogFragment>
gl_FragColor=color;
#include<imageProcessingCompatibility>
#define CUSTOM_FRAGMENT_MAIN_END
}`;
// Sideeffect
ShaderStore.ShadersStore[name] = shader;
/** @internal */
export const normalPixelShader = { name, shader };
//# sourceMappingURL=normal.fragment.js.map