// Do not edit.
import { ShaderStore } from "../Engines/shaderStore.js";
import "./ShadersInclude/fogVertexDeclaration.js";
import "./ShadersInclude/logDepthDeclaration.js";
import "./ShadersInclude/logDepthVertex.js";
const name = "spriteMapVertexShader";
const shader = `precision highp float;attribute vec3 position;attribute vec3 normal;attribute vec2 uv;varying vec3 vPosition;varying vec2 vUV;varying vec2 tUV;uniform float time;uniform mat4 world;uniform mat4 view;uniform mat4 projection;uniform vec2 stageSize;uniform float stageScale;
#include<fogVertexDeclaration>
#include<logDepthDeclaration>
void main() {vec4 p=vec4( position,1. );vPosition=p.xyz;vUV=uv;tUV=uv*stageSize; 
vec3 viewPos=(view*world*p).xyz; 
gl_Position=projection*vec4(viewPos,1.0); 
#ifdef FOG
vFogDistance=viewPos;
#endif
#include<logDepthVertex>
}`;
// Sideeffect
ShaderStore.ShadersStore[name] = shader;
/** @internal */
export const spriteMapVertexShader = { name, shader };
//# sourceMappingURL=spriteMap.vertex.js.map