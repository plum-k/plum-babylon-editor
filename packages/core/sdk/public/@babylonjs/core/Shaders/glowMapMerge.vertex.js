// Do not edit.
import { ShaderStore } from "../Engines/shaderStore.js";
const name = "glowMapMergeVertexShader";
const shader = `attribute vec2 position;varying vec2 vUV;const vec2 madd=vec2(0.5,0.5);
#define CUSTOM_VERTEX_DEFINITIONS
void main(void) {
#define CUSTOM_VERTEX_MAIN_BEGIN
vUV=position*madd+madd;gl_Position=vec4(position,0.0,1.0);
#define CUSTOM_VERTEX_MAIN_END
}`;
// Sideeffect
ShaderStore.ShadersStore[name] = shader;
/** @internal */
export const glowMapMergeVertexShader = { name, shader };
//# sourceMappingURL=glowMapMerge.vertex.js.map