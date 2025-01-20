// Do not edit.
import { ShaderStore } from "../../Engines/shaderStore.js";
const name = "bumpVertexDeclaration";
const shader = `#if defined(BUMP) || defined(PARALLAX) || defined(CLEARCOAT_BUMP) || defined(ANISOTROPIC)
#if defined(TANGENT) && defined(NORMAL) 
varying vTBN0: vec3f;varying vTBN1: vec3f;varying vTBN2: vec3f;
#endif
#endif
`;
// Sideeffect
ShaderStore.IncludesShadersStoreWGSL[name] = shader;
/** @internal */
export const bumpVertexDeclarationWGSL = { name, shader };
//# sourceMappingURL=bumpVertexDeclaration.js.map