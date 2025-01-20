// Do not edit.
import { ShaderStore } from "../Engines/shaderStore.js";
import "./ShadersInclude/gaussianSplattingVertexDeclaration.js";
import "./ShadersInclude/gaussianSplattingUboDeclaration.js";
import "./ShadersInclude/clipPlaneVertexDeclaration.js";
import "./ShadersInclude/fogVertexDeclaration.js";
import "./ShadersInclude/logDepthDeclaration.js";
import "./ShadersInclude/gaussianSplatting.js";
import "./ShadersInclude/clipPlaneVertex.js";
import "./ShadersInclude/fogVertex.js";
import "./ShadersInclude/logDepthVertex.js";
const name = "gaussianSplattingVertexShader";
const shader = `#include<__decl__gaussianSplattingVertex>
#ifdef LOGARITHMICDEPTH
#extension GL_EXT_frag_depth : enable
#endif
#include<clipPlaneVertexDeclaration>
#include<fogVertexDeclaration>
#include<logDepthDeclaration>
attribute float splatIndex;uniform vec2 invViewport;uniform vec2 dataTextureSize;uniform vec2 focal;uniform sampler2D covariancesATexture;uniform sampler2D covariancesBTexture;uniform sampler2D centersTexture;uniform sampler2D colorsTexture;
#if SH_DEGREE>0
uniform highp usampler2D shTexture0;
#endif
#if SH_DEGREE>1
uniform highp usampler2D shTexture1;
#endif
#if SH_DEGREE>2
uniform highp usampler2D shTexture2;
#endif
varying vec4 vColor;varying vec2 vPosition;
#include<gaussianSplatting>
void main () {Splat splat=readSplat(splatIndex);vec3 covA=splat.covA.xyz;vec3 covB=vec3(splat.covA.w,splat.covB.xy);vec4 worldPos=world*vec4(splat.center.xyz,1.0);vColor=splat.color;vPosition=position;
#if SH_DEGREE>0
vec3 dir=normalize(worldPos.xyz-vEyePosition.xyz);dir.y*=-1.; 
vColor.xyz=computeSH(splat,splat.color.xyz,dir);
#endif
gl_Position=gaussianSplatting(position,worldPos.xyz,vec2(1.,1.),covA,covB,world,view,projection);
#include<clipPlaneVertex>
#include<fogVertex>
#include<logDepthVertex>
}
`;
// Sideeffect
ShaderStore.ShadersStore[name] = shader;
/** @internal */
export const gaussianSplattingVertexShader = { name, shader };
//# sourceMappingURL=gaussianSplatting.vertex.js.map