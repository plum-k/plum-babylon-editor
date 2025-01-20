// Do not edit.
import { ShaderStore } from "../Engines/shaderStore.js";
const name = "meshUVSpaceRendererMaskerVertexShader";
const shader = `attribute vec2 uv;varying vec2 vUV;void main(void) {gl_Position=vec4(vec2(uv.x,uv.y)*2.0-1.0,0.,1.0);vUV=uv;}`;
// Sideeffect
ShaderStore.ShadersStore[name] = shader;
/** @internal */
export const meshUVSpaceRendererMaskerVertexShader = { name, shader };
//# sourceMappingURL=meshUVSpaceRendererMasker.vertex.js.map