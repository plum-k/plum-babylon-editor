// Do not edit.
import { ShaderStore } from "../../Engines/shaderStore.js";
const name = "bumpVertexDeclaration";
const shader = `#if defined(BUMP) || defined(PARALLAX) || defined(CLEARCOAT_BUMP) || defined(ANISOTROPIC)
#if defined(TANGENT) && defined(NORMAL) 
varying mat3 vTBN;
#endif
#endif
`;
// Sideeffect
ShaderStore.IncludesShadersStore[name] = shader;
/** @internal */
export const bumpVertexDeclaration = { name, shader };
//# sourceMappingURL=bumpVertexDeclaration.js.map