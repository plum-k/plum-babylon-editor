// Do not edit.
import { ShaderStore } from "../Engines/shaderStore.js";
const name = "hdrFilteringVertexShader";
const shader = `attribute vec2 position;varying vec3 direction;uniform vec3 up;uniform vec3 right;uniform vec3 front;
#define CUSTOM_VERTEX_DEFINITIONS
void main(void) {
#define CUSTOM_VERTEX_MAIN_BEGIN
mat3 view=mat3(up,right,front);direction=view*vec3(position,1.0);gl_Position=vec4(position,0.0,1.0);
#define CUSTOM_VERTEX_MAIN_END
}`;
// Sideeffect
ShaderStore.ShadersStore[name] = shader;
/** @internal */
export const hdrFilteringVertexShader = { name, shader };
//# sourceMappingURL=hdrFiltering.vertex.js.map