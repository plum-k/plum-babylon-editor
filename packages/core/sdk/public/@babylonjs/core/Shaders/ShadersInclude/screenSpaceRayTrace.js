// Do not edit.
import { ShaderStore } from "../../Engines/shaderStore.js";
const name = "screenSpaceRayTrace";
const shader = `float distanceSquared(vec2 a,vec2 b) { a-=b; return dot(a,a); }
#ifdef SSRAYTRACE_SCREENSPACE_DEPTH
float linearizeDepth(float depth,float near,float far) {
#ifdef SSRAYTRACE_RIGHT_HANDED_SCENE
return -(near*far)/(far-depth*(far-near));
#else
return (near*far)/(far-depth*(far-near));
#endif
}
#endif
/**
\param csOrigin Camera-space ray origin,which must be 
within the view volume and must have z>0.01 and project within the valid screen rectangle
\param csDirection Unit length camera-space ray direction
\param projectToPixelMatrix A projection matrix that maps to **pixel** coordinates 
(**not** [-1,+1] normalized device coordinates).
\param csZBuffer The camera-space Z buffer
\param csZBufferSize Dimensions of csZBuffer
\param csZThickness Camera space csZThickness to ascribe to each pixel in the depth buffer
\param nearPlaneZ Positive number. Doesn't have to be THE actual near plane,just a reasonable value
for clipping rays headed towards the camera
\param stride Step in horizontal or vertical pixels between samples. This is a float
because integer math is slow on GPUs,but should be set to an integer>=1
\param jitterFraction Number between 0 and 1 for how far to bump the ray in stride units
to conceal banding artifacts,plus the stride ray offset.
\param maxSteps Maximum number of iterations. Higher gives better images but may be slow
\param maxRayTraceDistance Maximum camera-space distance to trace before returning a miss
\param selfCollisionNumSkip Number of steps to skip at start when raytracing to avoid self collisions.
1 is a reasonable value,depending on the scene you may need to set this value to 2
\param hitPixel Pixel coordinates of the first intersection with the scene
\param numIterations number of iterations performed
\param csHitPoint Camera space location of the ray hit
*/
#define inline
bool traceScreenSpaceRay1(
vec3 csOrigin,
vec3 csDirection,
mat4 projectToPixelMatrix,
sampler2D csZBuffer,
vec2 csZBufferSize,
#ifdef SSRAYTRACE_USE_BACK_DEPTHBUFFER
sampler2D csZBackBuffer,
float csZBackSizeFactor,
#endif
float csZThickness,
float nearPlaneZ,
float farPlaneZ,
float stride,
float jitterFraction,
float maxSteps,
float maxRayTraceDistance,
float selfCollisionNumSkip,
out vec2 startPixel,
out vec2 hitPixel,
out vec3 csHitPoint,
out float numIterations
#ifdef SSRAYTRACE_DEBUG
,out vec3 debugColor
#endif
)
{
#ifdef SSRAYTRACE_RIGHT_HANDED_SCENE
float rayLength=(csOrigin.z+csDirection.z*maxRayTraceDistance)>-nearPlaneZ ? (-nearPlaneZ-csOrigin.z)/csDirection.z : maxRayTraceDistance;
#else
float rayLength=(csOrigin.z+csDirection.z*maxRayTraceDistance)<nearPlaneZ ? (nearPlaneZ-csOrigin.z)/csDirection.z : maxRayTraceDistance;
#endif
vec3 csEndPoint=csOrigin+csDirection*rayLength;hitPixel=vec2(-1.0,-1.0);vec4 H0=projectToPixelMatrix*vec4(csOrigin,1.0);vec4 H1=projectToPixelMatrix*vec4(csEndPoint,1.0);float k0=1.0/H0.w;float k1=1.0/H1.w;vec3 Q0=csOrigin*k0;vec3 Q1=csEndPoint*k1;vec2 P0=H0.xy*k0;vec2 P1=H1.xy*k1;
#ifdef SSRAYTRACE_CLIP_TO_FRUSTUM
float xMax=csZBufferSize.x-0.5,xMin=0.5,yMax=csZBufferSize.y-0.5,yMin=0.5;float alpha=0.0;if ((P1.y>yMax) || (P1.y<yMin)) {alpha=(P1.y-((P1.y>yMax) ? yMax : yMin))/(P1.y-P0.y);}
if ((P1.x>xMax) || (P1.x<xMin)) {alpha=max(alpha,(P1.x-((P1.x>xMax) ? xMax : xMin))/(P1.x-P0.x));}
P1=mix(P1,P0,alpha); k1=mix(k1,k0,alpha); Q1=mix(Q1,Q0,alpha);
#endif
P1+=vec2((distanceSquared(P0,P1)<0.0001) ? 0.01 : 0.0);vec2 delta=P1-P0;bool permute=false;if (abs(delta.x)<abs(delta.y)) { 
permute=true;delta=delta.yx;P0=P0.yx;P1=P1.yx; }
float stepDirection=sign(delta.x);float invdx=stepDirection/delta.x;vec2 dP=vec2(stepDirection,delta.y*invdx);vec3 dQ=(Q1-Q0)*invdx;float dk=(k1-k0)*invdx;float zMin=min(csEndPoint.z,csOrigin.z);float zMax=max(csEndPoint.z,csOrigin.z);dP*=stride; dQ*=stride; dk*=stride;P0+=dP*jitterFraction; Q0+=dQ*jitterFraction; k0+=dk*jitterFraction;vec4 pqk=vec4(P0,Q0.z,k0);vec4 dPQK=vec4(dP,dQ.z,dk);startPixel=permute ? P0.yx : P0.xy;float prevZMaxEstimate=csOrigin.z;float rayZMin=prevZMaxEstimate,rayZMax=prevZMaxEstimate;float sceneZMax=rayZMax+1e4;float end=P1.x*stepDirection;bool hit=false;float stepCount;for (stepCount=0.0;stepCount<=selfCollisionNumSkip ||
(pqk.x*stepDirection)<=end &&
stepCount<maxSteps &&
!hit &&
sceneZMax != 0.0; 
pqk+=dPQK,++stepCount)
{hitPixel=permute ? pqk.yx : pqk.xy;rayZMin=prevZMaxEstimate;rayZMax=(dPQK.z*0.5+pqk.z)/(dPQK.w*0.5+pqk.w);rayZMax=clamp(rayZMax,zMin,zMax);prevZMaxEstimate=rayZMax;if (rayZMin>rayZMax) { 
float t=rayZMin; rayZMin=rayZMax; rayZMax=t;}
sceneZMax=texelFetch(csZBuffer,ivec2(hitPixel),0).r;
#ifdef SSRAYTRACE_SCREENSPACE_DEPTH
sceneZMax=linearizeDepth(sceneZMax,nearPlaneZ,farPlaneZ);
#endif
#ifdef SSRAYTRACE_RIGHT_HANDED_SCENE
#ifdef SSRAYTRACE_USE_BACK_DEPTHBUFFER
float sceneBackZ=texelFetch(csZBackBuffer,ivec2(hitPixel/csZBackSizeFactor),0).r;
#ifdef SSRAYTRACE_SCREENSPACE_DEPTH
sceneBackZ=linearizeDepth(sceneBackZ,nearPlaneZ,farPlaneZ);
#endif
hit=(rayZMax>=sceneBackZ-csZThickness) && (rayZMin<=sceneZMax);
#else
hit=(rayZMax>=sceneZMax-csZThickness) && (rayZMin<=sceneZMax);
#endif
#else
#ifdef SSRAYTRACE_USE_BACK_DEPTHBUFFER
float sceneBackZ=texelFetch(csZBackBuffer,ivec2(hitPixel/csZBackSizeFactor),0).r;
#ifdef SSRAYTRACE_SCREENSPACE_DEPTH
sceneBackZ=linearizeDepth(sceneBackZ,nearPlaneZ,farPlaneZ);
#endif
hit=(rayZMin<=sceneBackZ+csZThickness) && (rayZMax>=sceneZMax) && (sceneZMax != 0.0);
#else
hit=(rayZMin<=sceneZMax+csZThickness) && (rayZMax>=sceneZMax);
#endif
#endif
}
pqk-=dPQK;stepCount-=1.0;if (((pqk.x+dPQK.x)*stepDirection)>end || (stepCount+1.0)>=maxSteps || sceneZMax==0.0) {hit=false;}
#ifdef SSRAYTRACE_ENABLE_REFINEMENT
if (stride>1.0 && hit) {pqk-=dPQK;stepCount-=1.0;float invStride=1.0/stride;dPQK*=invStride;float refinementStepCount=0.0;prevZMaxEstimate=pqk.z/pqk.w;rayZMax=prevZMaxEstimate;sceneZMax=rayZMax+1e7;for (;refinementStepCount<=1.0 ||
(refinementStepCount<=stride*1.4) &&
(rayZMax<sceneZMax) && (sceneZMax != 0.0);pqk+=dPQK,refinementStepCount+=1.0)
{rayZMin=prevZMaxEstimate;rayZMax=(dPQK.z*0.5+pqk.z)/(dPQK.w*0.5+pqk.w);rayZMax=clamp(rayZMax,zMin,zMax);prevZMaxEstimate=rayZMax;rayZMax=max(rayZMax,rayZMin);hitPixel=permute ? pqk.yx : pqk.xy;sceneZMax=texelFetch(csZBuffer,ivec2(hitPixel),0).r;
#ifdef SSRAYTRACE_SCREENSPACE_DEPTH
sceneZMax=linearizeDepth(sceneZMax,nearPlaneZ,farPlaneZ);
#endif
}
pqk-=dPQK;refinementStepCount-=1.0;stepCount+=refinementStepCount/stride;}
#endif
Q0.xy+=dQ.xy*stepCount;Q0.z=pqk.z;csHitPoint=Q0/pqk.w;numIterations=stepCount+1.0;
#ifdef SSRAYTRACE_DEBUG
if (((pqk.x+dPQK.x)*stepDirection)>end) {debugColor=vec3(0,0,1);} else if ((stepCount+1.0)>=maxSteps) {debugColor=vec3(1,0,0);} else if (sceneZMax==0.0) {debugColor=vec3(1,1,0);} else {debugColor=vec3(0,stepCount/maxSteps,0);}
#endif
return hit;}
/**
texCoord: in the [0,1] range
depth: depth in view space (range [znear,zfar]])
*/
vec3 computeViewPosFromUVDepth(vec2 texCoord,float depth,mat4 projection,mat4 invProjectionMatrix) {vec4 ndc;ndc.xy=texCoord*2.0-1.0;
#ifdef SSRAYTRACE_RIGHT_HANDED_SCENE
#ifdef ORTHOGRAPHIC_CAMERA
ndc.z=-projection[2].z*depth+projection[3].z;
#else
ndc.z=-projection[2].z-projection[3].z/depth;
#endif
#else
#ifdef ORTHOGRAPHIC_CAMERA
ndc.z=projection[2].z*depth+projection[3].z;
#else
ndc.z=projection[2].z+projection[3].z/depth;
#endif
#endif
ndc.w=1.0;vec4 eyePos=invProjectionMatrix*ndc;eyePos.xyz/=eyePos.w;return eyePos.xyz;}
`;
// Sideeffect
ShaderStore.IncludesShadersStore[name] = shader;
/** @internal */
export const screenSpaceRayTrace = { name, shader };
//# sourceMappingURL=screenSpaceRayTrace.js.map