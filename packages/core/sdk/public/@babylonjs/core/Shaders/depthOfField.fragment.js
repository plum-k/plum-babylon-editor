// Do not edit.
import { ShaderStore } from "../Engines/shaderStore.js";
const name = "depthOfFieldPixelShader";
const shader = `uniform sampler2D textureSampler;uniform sampler2D highlightsSampler;uniform sampler2D depthSampler;uniform sampler2D grainSampler;uniform float grain_amount;uniform bool blur_noise;uniform float screen_width;uniform float screen_height;uniform float distortion;uniform bool dof_enabled;uniform float screen_distance; 
uniform float aperture;uniform float darken;uniform float edge_blur;uniform bool highlights;uniform float near;uniform float far;varying vec2 vUV;
#define PI 3.14159265
#define TWOPI 6.28318530
#define inverse_focal_length 0.1 
vec2 centered_screen_pos;vec2 distorted_coords;float radius2;float radius;vec2 rand(vec2 co)
{float noise1=(fract(sin(dot(co,vec2(12.9898,78.233)))*43758.5453));float noise2=(fract(sin(dot(co,vec2(12.9898,78.233)*2.0))*43758.5453));return clamp(vec2(noise1,noise2),0.0,1.0);}
vec2 getDistortedCoords(vec2 coords) {if (distortion==0.0) { return coords; }
vec2 direction=1.0*normalize(centered_screen_pos);vec2 dist_coords=vec2(0.5,0.5);dist_coords.x=0.5+direction.x*radius2*1.0;dist_coords.y=0.5+direction.y*radius2*1.0;float dist_amount=clamp(distortion*0.23,0.0,1.0);dist_coords=mix(coords,dist_coords,dist_amount);return dist_coords;}
float sampleScreen(inout vec4 color,in vec2 offset,in float weight) {vec2 coords=distorted_coords;float angle=rand(coords*100.0).x*TWOPI;coords+=vec2(offset.x*cos(angle)-offset.y*sin(angle),offset.x*sin(angle)+offset.y*cos(angle));color+=texture2D(textureSampler,coords)*weight;return weight;}
float getBlurLevel(float size) {return min(3.0,ceil(size/1.0));}
vec4 getBlurColor(float size) {vec4 col=texture2D(textureSampler,distorted_coords);float blur_level=getBlurLevel(size);float w=(size/screen_width);float h=(size/screen_height);float total_weight=1.0;vec2 sample_coords;total_weight+=sampleScreen(col,vec2(-0.50*w,0.24*h),0.93);total_weight+=sampleScreen(col,vec2(0.30*w,-0.75*h),0.90);total_weight+=sampleScreen(col,vec2(0.36*w,0.96*h),0.87);total_weight+=sampleScreen(col,vec2(-1.08*w,-0.55*h),0.85);total_weight+=sampleScreen(col,vec2(1.33*w,-0.37*h),0.83);total_weight+=sampleScreen(col,vec2(-0.82*w,1.31*h),0.80);total_weight+=sampleScreen(col,vec2(-0.31*w,-1.67*h),0.78);total_weight+=sampleScreen(col,vec2(1.47*w,1.11*h),0.76);total_weight+=sampleScreen(col,vec2(-1.97*w,0.19*h),0.74);total_weight+=sampleScreen(col,vec2(1.42*w,-1.57*h),0.72);if (blur_level>1.0) {total_weight+=sampleScreen(col,vec2(0.01*w,2.25*h),0.70);total_weight+=sampleScreen(col,vec2(-1.62*w,-1.74*h),0.67);total_weight+=sampleScreen(col,vec2(2.49*w,0.20*h),0.65);total_weight+=sampleScreen(col,vec2(-2.07*w,1.61*h),0.63);total_weight+=sampleScreen(col,vec2(0.46*w,-2.70*h),0.61);total_weight+=sampleScreen(col,vec2(1.55*w,2.40*h),0.59);total_weight+=sampleScreen(col,vec2(-2.88*w,-0.75*h),0.56);total_weight+=sampleScreen(col,vec2(2.73*w,-1.44*h),0.54);total_weight+=sampleScreen(col,vec2(-1.08*w,3.02*h),0.52);total_weight+=sampleScreen(col,vec2(-1.28*w,-3.05*h),0.49);}
if (blur_level>2.0) {total_weight+=sampleScreen(col,vec2(3.11*w,1.43*h),0.46);total_weight+=sampleScreen(col,vec2(-3.36*w,1.08*h),0.44);total_weight+=sampleScreen(col,vec2(1.80*w,-3.16*h),0.41);total_weight+=sampleScreen(col,vec2(0.83*w,3.65*h),0.38);total_weight+=sampleScreen(col,vec2(-3.16*w,-2.19*h),0.34);total_weight+=sampleScreen(col,vec2(3.92*w,-0.53*h),0.31);total_weight+=sampleScreen(col,vec2(-2.59*w,3.12*h),0.26);total_weight+=sampleScreen(col,vec2(-0.20*w,-4.15*h),0.22);total_weight+=sampleScreen(col,vec2(3.02*w,3.00*h),0.15);}
col/=total_weight; 
if (darken>0.0) {col.rgb*=clamp(0.3,1.0,1.05-size*0.5*darken);}
return col;}
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void)
{centered_screen_pos=vec2(vUV.x-0.5,vUV.y-0.5);radius2=centered_screen_pos.x*centered_screen_pos.x+centered_screen_pos.y*centered_screen_pos.y;radius=sqrt(radius2);distorted_coords=getDistortedCoords(vUV); 
vec2 texels_coords=vec2(vUV.x*screen_width,vUV.y*screen_height); 
float depth=texture2D(depthSampler,distorted_coords).r; 
float distance=near+(far-near)*depth; 
vec4 color=texture2D(textureSampler,vUV); 
float coc=abs(aperture*(screen_distance*(inverse_focal_length-1.0/distance)-1.0));if (dof_enabled==false || coc<0.07) { coc=0.0; }
float edge_blur_amount=0.0;if (edge_blur>0.0) {edge_blur_amount=clamp((radius*2.0-1.0+0.15*edge_blur)*1.5,0.0,1.0)*1.3;}
float blur_amount=max(edge_blur_amount,coc);if (blur_amount==0.0) {gl_FragColor=texture2D(textureSampler,distorted_coords);}
else {gl_FragColor=getBlurColor(blur_amount*1.7);if (highlights) {gl_FragColor.rgb+=clamp(coc,0.0,1.0)*texture2D(highlightsSampler,distorted_coords).rgb;}
if (blur_noise) {vec2 noise=rand(distorted_coords)*0.01*blur_amount;vec2 blurred_coord=vec2(distorted_coords.x+noise.x,distorted_coords.y+noise.y);gl_FragColor=0.04*texture2D(textureSampler,blurred_coord)+0.96*gl_FragColor;}}
if (grain_amount>0.0) {vec4 grain_color=texture2D(grainSampler,texels_coords*0.003);gl_FragColor.rgb+=(-0.5+grain_color.rgb)*0.30*grain_amount;}}
`;
// Sideeffect
ShaderStore.ShadersStore[name] = shader;
/** @internal */
export const depthOfFieldPixelShader = { name, shader };
//# sourceMappingURL=depthOfField.fragment.js.map