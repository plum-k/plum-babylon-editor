// Do not edit.
import { ShaderStore } from "../../Engines/shaderStore.js";
const name = "fogVertex";
const shader = `#ifdef FOG
vFogDistance=(view*worldPos).xyz;
#endif
`;
// Sideeffect
ShaderStore.IncludesShadersStore[name] = shader;
/** @internal */
export const fogVertex = { name, shader };
//# sourceMappingURL=fogVertex.js.map