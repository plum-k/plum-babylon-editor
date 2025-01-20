// Do not edit.
import { ShaderStore } from "../Engines/shaderStore.js";
const name = "pickingPixelShader";
const shader = `#if defined(INSTANCES)
varying vec4 vMeshID;
#else
uniform vec4 meshID;
#endif
void main(void) {
#if defined(INSTANCES)
gl_FragColor=vMeshID;
#else
gl_FragColor=meshID;
#endif
}`;
// Sideeffect
ShaderStore.ShadersStore[name] = shader;
/** @internal */
export const pickingPixelShader = { name, shader };
//# sourceMappingURL=picking.fragment.js.map