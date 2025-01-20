// Do not edit.
import { ShaderStore } from "../../Engines/shaderStore.js";
const name = "samplerVertexDeclaration";
const shader = `#if defined(_DEFINENAME_) && _DEFINENAME_DIRECTUV==0
varying v_VARYINGNAME_UV: vec2f;
#endif
`;
// Sideeffect
ShaderStore.IncludesShadersStoreWGSL[name] = shader;
/** @internal */
export const samplerVertexDeclarationWGSL = { name, shader };
//# sourceMappingURL=samplerVertexDeclaration.js.map