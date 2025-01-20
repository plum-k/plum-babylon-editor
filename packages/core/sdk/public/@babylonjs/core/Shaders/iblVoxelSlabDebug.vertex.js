// Do not edit.
import { ShaderStore } from "../Engines/shaderStore.js";
const name = "iblVoxelSlabDebugVertexShader";
const shader = `attribute vec3 position;varying vec3 vNormalizedPosition;uniform mat4 world;uniform mat4 invWorldScale;uniform mat4 cameraViewMatrix;uniform mat4 projection;uniform mat4 viewMatrix;void main(void) {vec4 worldPosition=(world*vec4(position,1.));gl_Position=projection*cameraViewMatrix*worldPosition;vNormalizedPosition=(viewMatrix*invWorldScale*worldPosition).rgb;vNormalizedPosition.xyz=vNormalizedPosition.xyz*vec3(0.5)+vec3(0.5);}`;
// Sideeffect
ShaderStore.ShadersStore[name] = shader;
/** @internal */
export const iblVoxelSlabDebugVertexShader = { name, shader };
//# sourceMappingURL=iblVoxelSlabDebug.vertex.js.map