// Do not edit.
import { ShaderStore } from "../Engines/shaderStore.js";
const name = "meshUVSpaceRendererPixelShader";
const shader = `precision highp float;varying vec2 vDecalTC;uniform sampler2D textureSampler;void main(void) {if (vDecalTC.x<0. || vDecalTC.x>1. || vDecalTC.y<0. || vDecalTC.y>1.) {discard;}
gl_FragColor=texture2D(textureSampler,vDecalTC);}
`;
// Sideeffect
ShaderStore.ShadersStore[name] = shader;
/** @internal */
export const meshUVSpaceRendererPixelShader = { name, shader };
//# sourceMappingURL=meshUVSpaceRenderer.fragment.js.map