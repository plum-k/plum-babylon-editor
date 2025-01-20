// Do not edit.
import { ShaderStore } from "../../Engines/shaderStore.js";
const name = "samplerVertexDeclaration";
const shader = `#if defined(_DEFINENAME_) && _DEFINENAME_DIRECTUV==0
varying vec2 v_VARYINGNAME_UV;
#endif
`;
// Sideeffect
ShaderStore.IncludesShadersStore[name] = shader;
/** @internal */
export const samplerVertexDeclaration = { name, shader };
//# sourceMappingURL=samplerVertexDeclaration.js.map