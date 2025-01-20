// Do not edit.
import { ShaderStore } from "@babylonjs/core/Engines/shaderStore.js";
import "@babylonjs/core/Shaders/ShadersInclude/clipPlaneFragmentDeclaration.js";
import "@babylonjs/core/Shaders/ShadersInclude/logDepthDeclaration.js";
import "@babylonjs/core/Shaders/ShadersInclude/fogFragmentDeclaration.js";
import "@babylonjs/core/Shaders/ShadersInclude/clipPlaneFragment.js";
import "@babylonjs/core/Shaders/ShadersInclude/fogFragment.js";
import "@babylonjs/core/Shaders/ShadersInclude/logDepthFragment.js";
import "@babylonjs/core/Shaders/ShadersInclude/imageProcessingCompatibility.js";
const name = "gridPixelShader";
const shader = `#extension GL_OES_standard_derivatives : enable
#define SQRT2 1.41421356
#define PI 3.14159
precision highp float;uniform float visibility;uniform vec3 mainColor;uniform vec3 lineColor;uniform vec4 gridControl;uniform vec3 gridOffset;varying vec3 vPosition;varying vec3 vNormal;
#ifdef LOGARITHMICDEPTH
#extension GL_EXT_frag_depth : enable
#endif
#include<clipPlaneFragmentDeclaration>
#include<logDepthDeclaration>
#include<fogFragmentDeclaration>
#ifdef OPACITY
varying vec2 vOpacityUV;uniform sampler2D opacitySampler;uniform vec2 vOpacityInfos;
#endif
float getDynamicVisibility(float position) {float majorGridFrequency=gridControl.y;if (floor(position+0.5)==floor(position/majorGridFrequency+0.5)*majorGridFrequency)
{return 1.0;}
return gridControl.z;}
float getAnisotropicAttenuation(float differentialLength) {const float maxNumberOfLines=10.0;return clamp(1.0/(differentialLength+1.0)-1.0/maxNumberOfLines,0.0,1.0);}
float isPointOnLine(float position,float differentialLength) {float fractionPartOfPosition=position-floor(position+0.5); 
fractionPartOfPosition/=differentialLength; 
#ifdef ANTIALIAS
fractionPartOfPosition=clamp(fractionPartOfPosition,-1.,1.);float result=0.5+0.5*cos(fractionPartOfPosition*PI); 
return result;
#else
return abs(fractionPartOfPosition)<SQRT2/4. ? 1. : 0.;
#endif
}
float contributionOnAxis(float position) {float differentialLength=length(vec2(dFdx(position),dFdy(position)));differentialLength*=SQRT2; 
float result=isPointOnLine(position,differentialLength);float dynamicVisibility=getDynamicVisibility(position);result*=dynamicVisibility;float anisotropicAttenuation=getAnisotropicAttenuation(differentialLength);result*=anisotropicAttenuation;return result;}
float normalImpactOnAxis(float x) {float normalImpact=clamp(1.0-3.0*abs(x*x*x),0.0,1.0);return normalImpact;}
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) {
#define CUSTOM_FRAGMENT_MAIN_BEGIN
#include<clipPlaneFragment>
float gridRatio=gridControl.x;vec3 gridPos=(vPosition+gridOffset.xyz)/gridRatio;float x=contributionOnAxis(gridPos.x);float y=contributionOnAxis(gridPos.y);float z=contributionOnAxis(gridPos.z);vec3 normal=normalize(vNormal);x*=normalImpactOnAxis(normal.x);y*=normalImpactOnAxis(normal.y);z*=normalImpactOnAxis(normal.z);
#ifdef MAX_LINE
float grid=clamp(max(max(x,y),z),0.,1.);
#else
float grid=clamp(x+y+z,0.,1.);
#endif
vec3 color=mix(mainColor,lineColor,grid);
#ifdef FOG
#include<fogFragment>
#endif
float opacity=1.0;
#ifdef TRANSPARENT
opacity=clamp(grid,0.08,gridControl.w*grid);
#endif
#ifdef OPACITY
opacity*=texture2D(opacitySampler,vOpacityUV).a;
#endif
gl_FragColor=vec4(color.rgb,opacity*visibility);
#ifdef TRANSPARENT
#ifdef PREMULTIPLYALPHA
gl_FragColor.rgb*=opacity;
#endif
#else
#endif
#include<logDepthFragment>
#include<imageProcessingCompatibility>
#define CUSTOM_FRAGMENT_MAIN_END
}
`;
// Sideeffect
ShaderStore.ShadersStore[name] = shader;
/** @internal */
export const gridPixelShader = { name, shader };
//# sourceMappingURL=grid.fragment.js.map