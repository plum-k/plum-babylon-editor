// Do not edit.
import { ShaderStore } from "../Engines/shaderStore.js";
import "./ShadersInclude/instancesDeclaration.js";
import "./ShadersInclude/instancesVertex.js";
const name = "velocityVertexShader";
const shader = `#define CUSTOM_VERTEX_BEGIN
#define VELOCITY
attribute vec3 position;
#include<instancesDeclaration>
uniform mat4 viewProjection;uniform mat4 previousViewProjection;
#ifdef MULTIVIEW
uniform mat4 viewProjectionR;uniform mat4 previousViewProjectionR;
#endif
varying vec4 clipPos;varying vec4 previousClipPos;
#define CUSTOM_VERTEX_DEFINITIONS
void main(void) {
#define CUSTOM_VERTEX_MAIN_BEGIN
vec3 positionUpdated=position;
#include<instancesVertex>
vec4 worldPos=finalWorld*vec4(positionUpdated,1.0);vec4 previousWorldPos=finalPreviousWorld*vec4(positionUpdated,1.0);
#ifdef MULTIVIEW
if (gl_ViewID_OVR==0u) {clipPos=viewProjection*worldPos;previousClipPos=previousViewProjection*previousWorldPos;gl_Position=clipPos;} else {clipPos=viewProjectionR*worldPos;previousClipPos=previousViewProjectionR*previousWorldPos;gl_Position=clipPos;}
#elif
clipPos=viewProjection*worldPos;previousClipPos=previousViewProjection*previousWorldPos;gl_Position=clipPos;
#endif
#define CUSTOM_VERTEX_MAIN_END
}`;
// Sideeffect
ShaderStore.ShadersStore[name] = shader;
/** @internal */
export const velocityVertexShader = { name, shader };
//# sourceMappingURL=velocity.vertex.js.map