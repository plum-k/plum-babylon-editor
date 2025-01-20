// Do not edit.
import { ShaderStore } from "@babylonjs/core/Engines/shaderStore.js";
import "@babylonjs/core/Shaders/ShadersInclude/bonesDeclaration.js";
import "@babylonjs/core/Shaders/ShadersInclude/bakedVertexAnimationDeclaration.js";
import "@babylonjs/core/Shaders/ShadersInclude/instancesDeclaration.js";
import "@babylonjs/core/Shaders/ShadersInclude/clipPlaneVertexDeclaration.js";
import "@babylonjs/core/Shaders/ShadersInclude/logDepthDeclaration.js";
import "@babylonjs/core/Shaders/ShadersInclude/fogVertexDeclaration.js";
import "@babylonjs/core/Shaders/ShadersInclude/lightFragmentDeclaration.js";
import "@babylonjs/core/Shaders/ShadersInclude/lightUboDeclaration.js";
import "@babylonjs/core/Shaders/ShadersInclude/instancesVertex.js";
import "@babylonjs/core/Shaders/ShadersInclude/bonesVertex.js";
import "@babylonjs/core/Shaders/ShadersInclude/bakedVertexAnimation.js";
import "@babylonjs/core/Shaders/ShadersInclude/clipPlaneVertex.js";
import "@babylonjs/core/Shaders/ShadersInclude/logDepthVertex.js";
import "@babylonjs/core/Shaders/ShadersInclude/fogVertex.js";
import "@babylonjs/core/Shaders/ShadersInclude/shadowsVertex.js";
import "@babylonjs/core/Shaders/ShadersInclude/vertexColorMixing.js";
const name = "gradientVertexShader";
const shader = `precision highp float;attribute vec3 position;
#ifdef NORMAL
attribute vec3 normal;
#endif
#ifdef UV1
attribute vec2 uv;
#endif
#ifdef UV2
attribute vec2 uv2;
#endif
#ifdef VERTEXCOLOR
attribute vec4 color;
#endif
#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>
#include<instancesDeclaration>
uniform mat4 view;uniform mat4 viewProjection;
#ifdef POINTSIZE
uniform float pointSize;
#endif
varying vec3 vPositionW;varying vec3 vPosition;
#ifdef NORMAL
varying vec3 vNormalW;
#endif
#ifdef VERTEXCOLOR
varying vec4 vColor;
#endif
#include<clipPlaneVertexDeclaration>
#include<logDepthDeclaration>
#include<fogVertexDeclaration>
#include<__decl__lightFragment>[0..maxSimultaneousLights]
#define CUSTOM_VERTEX_DEFINITIONS
void main(void) {
#define CUSTOM_VERTEX_MAIN_BEGIN
#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>
vec4 worldPos=finalWorld*vec4(position,1.0);gl_Position=viewProjection*worldPos;vPositionW=vec3(worldPos);vPosition=position;
#ifdef NORMAL
vNormalW=normalize(vec3(finalWorld*vec4(normal,0.0)));
#endif
#ifndef UV1
vec2 uv=vec2(0.,0.);
#endif
#ifndef UV2
vec2 uv2=vec2(0.,0.);
#endif
#include<clipPlaneVertex>
#include<logDepthVertex>
#include<fogVertex>
#include<shadowsVertex>[0..maxSimultaneousLights]
#include<vertexColorMixing>
#if defined(POINTSIZE) && !defined(WEBGPU)
gl_PointSize=pointSize;
#endif
#define CUSTOM_VERTEX_MAIN_END
}
`;
// Sideeffect
ShaderStore.ShadersStore[name] = shader;
/** @internal */
export const gradientVertexShader = { name, shader };
//# sourceMappingURL=gradient.vertex.js.map