// Do not edit.
import { ShaderStore } from "../Engines/shaderStore.js";
const name = "equirectangularPanoramaPixelShader";
const shader = `#ifdef GL_ES
precision highp float;
#endif
#define M_PI 3.1415926535897932384626433832795
varying vec2 vUV;uniform samplerCube cubeMap;void main(void) {vec2 uv=vUV;float longitude=uv.x*2.*M_PI-M_PI+M_PI/2.;float latitude=(1.-uv.y)*M_PI;vec3 dir=vec3(
- sin( longitude )*sin( latitude ),
cos( latitude ),
- cos( longitude )*sin( latitude )
);normalize( dir );gl_FragColor=textureCube( cubeMap,dir );}`;
// Sideeffect
ShaderStore.ShadersStore[name] = shader;
/** @internal */
export const equirectangularPanoramaPixelShader = { name, shader };
//# sourceMappingURL=equirectangularPanorama.fragment.js.map