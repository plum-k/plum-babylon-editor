// Do not edit.
import { ShaderStore } from "../../Engines/shaderStore.js";
const name = "pointCloudVertex";
const shader = `#if defined(POINTSIZE) && !defined(WEBGPU)
gl_PointSize=pointSize;
#endif
`;
// Sideeffect
ShaderStore.IncludesShadersStore[name] = shader;
/** @internal */
export const pointCloudVertex = { name, shader };
//# sourceMappingURL=pointCloudVertex.js.map