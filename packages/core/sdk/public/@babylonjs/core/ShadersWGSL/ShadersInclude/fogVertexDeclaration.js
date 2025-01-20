// Do not edit.
import { ShaderStore } from "../../Engines/shaderStore.js";
const name = "fogVertexDeclaration";
const shader = `#ifdef FOG
varying vFogDistance: vec3f;
#endif
`;
// Sideeffect
ShaderStore.IncludesShadersStoreWGSL[name] = shader;
/** @internal */
export const fogVertexDeclarationWGSL = { name, shader };
//# sourceMappingURL=fogVertexDeclaration.js.map