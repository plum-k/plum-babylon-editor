// Do not edit.
import { ShaderStore } from "../Engines/shaderStore.js";
const name = "iblVoxelGridVertexShader";
const shader = `attribute vec3 position;attribute vec3 normal;varying vec3 vNormalizedPosition;uniform mat4 world;uniform mat4 invWorldScale;uniform mat4 viewMatrix;void main(void) {gl_Position=viewMatrix*invWorldScale*world*vec4(position,1.);vNormalizedPosition.xyz=gl_Position.xyz*0.5+0.5;
#ifdef IS_NDC_HALF_ZRANGE
gl_Position.z=gl_Position.z*0.5+0.5;
#endif
}`;
// Sideeffect
ShaderStore.ShadersStore[name] = shader;
/** @internal */
export const iblVoxelGridVertexShader = { name, shader };
//# sourceMappingURL=iblVoxelGrid.vertex.js.map