// Do not edit.
import { ShaderStore } from "../../Engines/shaderStore.js";
const name = "decalVertexDeclaration";
const shader = `#ifdef DECAL
uniform vec4 vDecalInfos;uniform mat4 decalMatrix;
#endif
`;
// Sideeffect
ShaderStore.IncludesShadersStore[name] = shader;
/** @internal */
export const decalVertexDeclaration = { name, shader };
//# sourceMappingURL=decalVertexDeclaration.js.map