// Do not edit.
import { ShaderStore } from "@babylonjs/core/Engines/shaderStore.js";
import "@babylonjs/core/Shaders/ShadersInclude/bonesDeclaration.js";
import "@babylonjs/core/Shaders/ShadersInclude/bakedVertexAnimationDeclaration.js";
import "@babylonjs/core/Shaders/ShadersInclude/instancesDeclaration.js";
import "@babylonjs/core/Shaders/ShadersInclude/clipPlaneVertexDeclaration.js";
import "@babylonjs/core/Shaders/ShadersInclude/logDepthDeclaration.js";
import "@babylonjs/core/Shaders/ShadersInclude/fogVertexDeclaration.js";
import "@babylonjs/core/Shaders/ShadersInclude/instancesVertex.js";
import "@babylonjs/core/Shaders/ShadersInclude/bonesVertex.js";
import "@babylonjs/core/Shaders/ShadersInclude/bakedVertexAnimation.js";
import "@babylonjs/core/Shaders/ShadersInclude/clipPlaneVertex.js";
import "@babylonjs/core/Shaders/ShadersInclude/logDepthVertex.js";
import "@babylonjs/core/Shaders/ShadersInclude/fogVertex.js";
import "@babylonjs/core/Shaders/ShadersInclude/vertexColorMixing.js";
const name = "fireVertexShader";
const shader = `precision highp float;attribute vec3 position;
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
#ifdef DIFFUSE
varying vec2 vDiffuseUV;
#endif
#ifdef POINTSIZE
uniform float pointSize;
#endif
varying vec3 vPositionW;
#ifdef VERTEXCOLOR
varying vec4 vColor;
#endif
#include<clipPlaneVertexDeclaration>
#include<logDepthDeclaration>
#include<fogVertexDeclaration>
uniform float time;uniform float speed;
#ifdef DIFFUSE
varying vec2 vDistortionCoords1;varying vec2 vDistortionCoords2;varying vec2 vDistortionCoords3;
#endif
#define CUSTOM_VERTEX_DEFINITIONS
void main(void) {
#define CUSTOM_VERTEX_MAIN_BEGIN
#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>
vec4 worldPos=finalWorld*vec4(position,1.0);gl_Position=viewProjection*worldPos;vPositionW=vec3(worldPos);
#ifdef DIFFUSE
vDiffuseUV=uv;vDiffuseUV.y-=0.2;
#endif
#include<clipPlaneVertex>
#include<logDepthVertex>
#include<fogVertex>
#include<vertexColorMixing>
#if defined(POINTSIZE) && !defined(WEBGPU)
gl_PointSize=pointSize;
#endif
#ifdef DIFFUSE
vec3 layerSpeed=vec3(-0.2,-0.52,-0.1)*speed;vDistortionCoords1.x=uv.x;vDistortionCoords1.y=uv.y+layerSpeed.x*time/1000.0;vDistortionCoords2.x=uv.x;vDistortionCoords2.y=uv.y+layerSpeed.y*time/1000.0;vDistortionCoords3.x=uv.x;vDistortionCoords3.y=uv.y+layerSpeed.z*time/1000.0;
#endif
#define CUSTOM_VERTEX_MAIN_END
}
`;
// Sideeffect
ShaderStore.ShadersStore[name] = shader;
/** @internal */
export const fireVertexShader = { name, shader };
//# sourceMappingURL=fire.vertex.js.map