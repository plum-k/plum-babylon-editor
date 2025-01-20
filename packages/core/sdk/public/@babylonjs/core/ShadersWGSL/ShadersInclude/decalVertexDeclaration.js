// Do not edit.
import { ShaderStore } from "../../Engines/shaderStore.js";
const name = "decalVertexDeclaration";
const shader = `#ifdef DECAL
uniform vDecalInfos: vec4f;uniform decalMatrix: mat4x4f;
#endif
`;
// Sideeffect
ShaderStore.IncludesShadersStoreWGSL[name] = shader;
/** @internal */
export const decalVertexDeclarationWGSL = { name, shader };
//# sourceMappingURL=decalVertexDeclaration.js.map