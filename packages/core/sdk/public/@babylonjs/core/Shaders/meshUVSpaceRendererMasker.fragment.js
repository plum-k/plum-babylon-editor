// Do not edit.
import { ShaderStore } from "../Engines/shaderStore.js";
const name = "meshUVSpaceRendererMaskerPixelShader";
const shader = `varying vec2 vUV;void main(void) {gl_FragColor=vec4(1.0,1.0,1.0,1.0);}
`;
// Sideeffect
ShaderStore.ShadersStore[name] = shader;
/** @internal */
export const meshUVSpaceRendererMaskerPixelShader = { name, shader };
//# sourceMappingURL=meshUVSpaceRendererMasker.fragment.js.map