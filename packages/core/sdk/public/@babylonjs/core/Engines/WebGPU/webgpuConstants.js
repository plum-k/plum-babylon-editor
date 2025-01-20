/** @internal */
// eslint-disable-next-line import/export
export var PowerPreference;
(function (PowerPreference) {
    PowerPreference["LowPower"] = "low-power";
    PowerPreference["HighPerformance"] = "high-performance";
})(PowerPreference || (PowerPreference = {}));
/** @internal */
export var FeatureName;
(function (FeatureName) {
    FeatureName["DepthClipControl"] = "depth-clip-control";
    FeatureName["Depth32FloatStencil8"] = "depth32float-stencil8";
    FeatureName["TextureCompressionBC"] = "texture-compression-bc";
    FeatureName["TextureCompressionBCSliced3D"] = "texture-compression-bc-sliced-3d";
    FeatureName["TextureCompressionETC2"] = "texture-compression-etc2";
    FeatureName["TextureCompressionASTC"] = "texture-compression-astc";
    FeatureName["TextureCompressionASTCSliced3D"] = "texture-compression-astc-sliced-3d";
    FeatureName["TimestampQuery"] = "timestamp-query";
    FeatureName["IndirectFirstInstance"] = "indirect-first-instance";
    FeatureName["ShaderF16"] = "shader-f16";
    FeatureName["RG11B10UFloatRenderable"] = "rg11b10ufloat-renderable";
    FeatureName["BGRA8UnormStorage"] = "bgra8unorm-storage";
    FeatureName["Float32Filterable"] = "float32-filterable";
    FeatureName["Float32Blendable"] = "float32-blendable";
    FeatureName["ClipDistances"] = "clip-distances";
    FeatureName["DualSourceBlending"] = "dual-source-blending";
})(FeatureName || (FeatureName = {}));
/** @internal */
export var BufferMapState;
(function (BufferMapState) {
    BufferMapState["Unmapped"] = "unmapped";
    BufferMapState["Pending"] = "pending";
    BufferMapState["Mapped"] = "mapped";
})(BufferMapState || (BufferMapState = {}));
/** @internal */
export var BufferUsage;
(function (BufferUsage) {
    BufferUsage[BufferUsage["MapRead"] = 1] = "MapRead";
    BufferUsage[BufferUsage["MapWrite"] = 2] = "MapWrite";
    BufferUsage[BufferUsage["CopySrc"] = 4] = "CopySrc";
    BufferUsage[BufferUsage["CopyDst"] = 8] = "CopyDst";
    BufferUsage[BufferUsage["Index"] = 16] = "Index";
    BufferUsage[BufferUsage["Vertex"] = 32] = "Vertex";
    BufferUsage[BufferUsage["Uniform"] = 64] = "Uniform";
    BufferUsage[BufferUsage["Storage"] = 128] = "Storage";
    BufferUsage[BufferUsage["Indirect"] = 256] = "Indirect";
    BufferUsage[BufferUsage["QueryResolve"] = 512] = "QueryResolve";
})(BufferUsage || (BufferUsage = {}));
/** @internal */
export var MapMode;
(function (MapMode) {
    MapMode[MapMode["Read"] = 1] = "Read";
    MapMode[MapMode["Write"] = 2] = "Write";
})(MapMode || (MapMode = {}));
/** @internal */
export var TextureDimension;
(function (TextureDimension) {
    TextureDimension["E1d"] = "1d";
    TextureDimension["E2d"] = "2d";
    TextureDimension["E3d"] = "3d";
})(TextureDimension || (TextureDimension = {}));
/** @internal */
export var TextureUsage;
(function (TextureUsage) {
    TextureUsage[TextureUsage["CopySrc"] = 1] = "CopySrc";
    TextureUsage[TextureUsage["CopyDst"] = 2] = "CopyDst";
    TextureUsage[TextureUsage["TextureBinding"] = 4] = "TextureBinding";
    TextureUsage[TextureUsage["StorageBinding"] = 8] = "StorageBinding";
    TextureUsage[TextureUsage["RenderAttachment"] = 16] = "RenderAttachment";
})(TextureUsage || (TextureUsage = {}));
/** @internal */
export var TextureViewDimension;
(function (TextureViewDimension) {
    TextureViewDimension["E1d"] = "1d";
    TextureViewDimension["E2d"] = "2d";
    TextureViewDimension["E2dArray"] = "2d-array";
    TextureViewDimension["Cube"] = "cube";
    TextureViewDimension["CubeArray"] = "cube-array";
    TextureViewDimension["E3d"] = "3d";
})(TextureViewDimension || (TextureViewDimension = {}));
/** @internal */
export var TextureAspect;
(function (TextureAspect) {
    TextureAspect["All"] = "all";
    TextureAspect["StencilOnly"] = "stencil-only";
    TextureAspect["DepthOnly"] = "depth-only";
})(TextureAspect || (TextureAspect = {}));
/**
 * Comments taken from https://github.com/gfx-rs/wgpu/blob/master/wgpu-types/src/lib.rs
 * @internal
 */
export var TextureFormat;
(function (TextureFormat) {
    // 8-bit formats
    TextureFormat["R8Unorm"] = "r8unorm";
    TextureFormat["R8Snorm"] = "r8snorm";
    TextureFormat["R8Uint"] = "r8uint";
    TextureFormat["R8Sint"] = "r8sint";
    // 16-bit formats
    TextureFormat["R16Uint"] = "r16uint";
    TextureFormat["R16Sint"] = "r16sint";
    TextureFormat["R16Float"] = "r16float";
    TextureFormat["RG8Unorm"] = "rg8unorm";
    TextureFormat["RG8Snorm"] = "rg8snorm";
    TextureFormat["RG8Uint"] = "rg8uint";
    TextureFormat["RG8Sint"] = "rg8sint";
    TextureFormat["R16Unorm"] = "r16unorm";
    TextureFormat["R16Snorm"] = "r16snorm";
    TextureFormat["RG16Unorm"] = "rg16unorm";
    TextureFormat["RG16Snorm"] = "rg16snorm";
    TextureFormat["RGBA16Unorm"] = "rgba16unorm";
    TextureFormat["RGBA16Snorm"] = "rgba16snorm";
    // 32-bit formats
    TextureFormat["R32Uint"] = "r32uint";
    TextureFormat["R32Sint"] = "r32sint";
    TextureFormat["R32Float"] = "r32float";
    TextureFormat["RG16Uint"] = "rg16uint";
    TextureFormat["RG16Sint"] = "rg16sint";
    TextureFormat["RG16Float"] = "rg16float";
    TextureFormat["RGBA8Unorm"] = "rgba8unorm";
    TextureFormat["RGBA8UnormSRGB"] = "rgba8unorm-srgb";
    TextureFormat["RGBA8Snorm"] = "rgba8snorm";
    TextureFormat["RGBA8Uint"] = "rgba8uint";
    TextureFormat["RGBA8Sint"] = "rgba8sint";
    TextureFormat["BGRA8Unorm"] = "bgra8unorm";
    TextureFormat["BGRA8UnormSRGB"] = "bgra8unorm-srgb";
    // Packed 32-bit formats
    TextureFormat["RGB9E5UFloat"] = "rgb9e5ufloat";
    TextureFormat["RGB10A2UINT"] = "rgb10a2uint";
    TextureFormat["RGB10A2Unorm"] = "rgb10a2unorm";
    TextureFormat["RG11B10UFloat"] = "rg11b10ufloat";
    // 64-bit formats
    TextureFormat["RG32Uint"] = "rg32uint";
    TextureFormat["RG32Sint"] = "rg32sint";
    TextureFormat["RG32Float"] = "rg32float";
    TextureFormat["RGBA16Uint"] = "rgba16uint";
    TextureFormat["RGBA16Sint"] = "rgba16sint";
    TextureFormat["RGBA16Float"] = "rgba16float";
    // 128-bit formats
    TextureFormat["RGBA32Uint"] = "rgba32uint";
    TextureFormat["RGBA32Sint"] = "rgba32sint";
    TextureFormat["RGBA32Float"] = "rgba32float";
    // Depth and stencil formats
    TextureFormat["Stencil8"] = "stencil8";
    TextureFormat["Depth16Unorm"] = "depth16unorm";
    TextureFormat["Depth24Plus"] = "depth24plus";
    TextureFormat["Depth24PlusStencil8"] = "depth24plus-stencil8";
    TextureFormat["Depth32Float"] = "depth32float";
    // BC compressed formats usable if "texture-compression-bc" is both
    // supported by the device/user agent and enabled in requestDevice.
    TextureFormat["BC1RGBAUnorm"] = "bc1-rgba-unorm";
    TextureFormat["BC1RGBAUnormSRGB"] = "bc1-rgba-unorm-srgb";
    TextureFormat["BC2RGBAUnorm"] = "bc2-rgba-unorm";
    TextureFormat["BC2RGBAUnormSRGB"] = "bc2-rgba-unorm-srgb";
    TextureFormat["BC3RGBAUnorm"] = "bc3-rgba-unorm";
    TextureFormat["BC3RGBAUnormSRGB"] = "bc3-rgba-unorm-srgb";
    TextureFormat["BC4RUnorm"] = "bc4-r-unorm";
    TextureFormat["BC4RSnorm"] = "bc4-r-snorm";
    TextureFormat["BC5RGUnorm"] = "bc5-rg-unorm";
    TextureFormat["BC5RGSnorm"] = "bc5-rg-snorm";
    TextureFormat["BC6HRGBUFloat"] = "bc6h-rgb-ufloat";
    TextureFormat["BC6HRGBFloat"] = "bc6h-rgb-float";
    TextureFormat["BC7RGBAUnorm"] = "bc7-rgba-unorm";
    TextureFormat["BC7RGBAUnormSRGB"] = "bc7-rgba-unorm-srgb";
    // ETC2 compressed formats usable if "texture-compression-etc2" is both
    // supported by the device/user agent and enabled in requestDevice.
    TextureFormat["ETC2RGB8Unorm"] = "etc2-rgb8unorm";
    TextureFormat["ETC2RGB8UnormSRGB"] = "etc2-rgb8unorm-srgb";
    TextureFormat["ETC2RGB8A1Unorm"] = "etc2-rgb8a1unorm";
    TextureFormat["ETC2RGB8A1UnormSRGB"] = "etc2-rgb8a1unorm-srgb";
    TextureFormat["ETC2RGBA8Unorm"] = "etc2-rgba8unorm";
    TextureFormat["ETC2RGBA8UnormSRGB"] = "etc2-rgba8unorm-srgb";
    TextureFormat["EACR11Unorm"] = "eac-r11unorm";
    TextureFormat["EACR11Snorm"] = "eac-r11snorm";
    TextureFormat["EACRG11Unorm"] = "eac-rg11unorm";
    TextureFormat["EACRG11Snorm"] = "eac-rg11snorm";
    // ASTC compressed formats usable if "texture-compression-astc" is both
    // supported by the device/user agent and enabled in requestDevice.
    TextureFormat["ASTC4x4Unorm"] = "astc-4x4-unorm";
    TextureFormat["ASTC4x4UnormSRGB"] = "astc-4x4-unorm-srgb";
    TextureFormat["ASTC5x4Unorm"] = "astc-5x4-unorm";
    TextureFormat["ASTC5x4UnormSRGB"] = "astc-5x4-unorm-srgb";
    TextureFormat["ASTC5x5Unorm"] = "astc-5x5-unorm";
    TextureFormat["ASTC5x5UnormSRGB"] = "astc-5x5-unorm-srgb";
    TextureFormat["ASTC6x5Unorm"] = "astc-6x5-unorm";
    TextureFormat["ASTC6x5UnormSRGB"] = "astc-6x5-unorm-srgb";
    TextureFormat["ASTC6x6Unorm"] = "astc-6x6-unorm";
    TextureFormat["ASTC6x6UnormSRGB"] = "astc-6x6-unorm-srgb";
    TextureFormat["ASTC8x5Unorm"] = "astc-8x5-unorm";
    TextureFormat["ASTC8x5UnormSRGB"] = "astc-8x5-unorm-srgb";
    TextureFormat["ASTC8x6Unorm"] = "astc-8x6-unorm";
    TextureFormat["ASTC8x6UnormSRGB"] = "astc-8x6-unorm-srgb";
    TextureFormat["ASTC8x8Unorm"] = "astc-8x8-unorm";
    TextureFormat["ASTC8x8UnormSRGB"] = "astc-8x8-unorm-srgb";
    TextureFormat["ASTC10x5Unorm"] = "astc-10x5-unorm";
    TextureFormat["ASTC10x5UnormSRGB"] = "astc-10x5-unorm-srgb";
    TextureFormat["ASTC10x6Unorm"] = "astc-10x6-unorm";
    TextureFormat["ASTC10x6UnormSRGB"] = "astc-10x6-unorm-srgb";
    TextureFormat["ASTC10x8Unorm"] = "astc-10x8-unorm";
    TextureFormat["ASTC10x8UnormSRGB"] = "astc-10x8-unorm-srgb";
    TextureFormat["ASTC10x10Unorm"] = "astc-10x10-unorm";
    TextureFormat["ASTC10x10UnormSRGB"] = "astc-10x10-unorm-srgb";
    TextureFormat["ASTC12x10Unorm"] = "astc-12x10-unorm";
    TextureFormat["ASTC12x10UnormSRGB"] = "astc-12x10-unorm-srgb";
    TextureFormat["ASTC12x12Unorm"] = "astc-12x12-unorm";
    TextureFormat["ASTC12x12UnormSRGB"] = "astc-12x12-unorm-srgb";
    // "depth32float-stencil8" feature
    TextureFormat["Depth32FloatStencil8"] = "depth32float-stencil8";
})(TextureFormat || (TextureFormat = {}));
/** @internal */
export var AddressMode;
(function (AddressMode) {
    AddressMode["ClampToEdge"] = "clamp-to-edge";
    AddressMode["Repeat"] = "repeat";
    AddressMode["MirrorRepeat"] = "mirror-repeat";
})(AddressMode || (AddressMode = {}));
/** @internal */
export var FilterMode;
(function (FilterMode) {
    FilterMode["Nearest"] = "nearest";
    FilterMode["Linear"] = "linear";
})(FilterMode || (FilterMode = {}));
/** @internal */
export var MipmapFilterMode;
(function (MipmapFilterMode) {
    MipmapFilterMode["Nearest"] = "nearest";
    MipmapFilterMode["Linear"] = "linear";
})(MipmapFilterMode || (MipmapFilterMode = {}));
/** @internal */
export var CompareFunction;
(function (CompareFunction) {
    CompareFunction["Never"] = "never";
    CompareFunction["Less"] = "less";
    CompareFunction["Equal"] = "equal";
    CompareFunction["LessEqual"] = "less-equal";
    CompareFunction["Greater"] = "greater";
    CompareFunction["NotEqual"] = "not-equal";
    CompareFunction["GreaterEqual"] = "greater-equal";
    CompareFunction["Always"] = "always";
})(CompareFunction || (CompareFunction = {}));
/** @internal */
export var ShaderStage;
(function (ShaderStage) {
    ShaderStage[ShaderStage["Vertex"] = 1] = "Vertex";
    ShaderStage[ShaderStage["Fragment"] = 2] = "Fragment";
    ShaderStage[ShaderStage["Compute"] = 4] = "Compute";
})(ShaderStage || (ShaderStage = {}));
/** @internal */
export var BufferBindingType;
(function (BufferBindingType) {
    BufferBindingType["Uniform"] = "uniform";
    BufferBindingType["Storage"] = "storage";
    BufferBindingType["ReadOnlyStorage"] = "read-only-storage";
})(BufferBindingType || (BufferBindingType = {}));
/** @internal */
export var SamplerBindingType;
(function (SamplerBindingType) {
    SamplerBindingType["Filtering"] = "filtering";
    SamplerBindingType["NonFiltering"] = "non-filtering";
    SamplerBindingType["Comparison"] = "comparison";
})(SamplerBindingType || (SamplerBindingType = {}));
/** @internal */
export var TextureSampleType;
(function (TextureSampleType) {
    TextureSampleType["Float"] = "float";
    TextureSampleType["UnfilterableFloat"] = "unfilterable-float";
    TextureSampleType["Depth"] = "depth";
    TextureSampleType["Sint"] = "sint";
    TextureSampleType["Uint"] = "uint";
})(TextureSampleType || (TextureSampleType = {}));
/** @internal */
export var StorageTextureAccess;
(function (StorageTextureAccess) {
    StorageTextureAccess["WriteOnly"] = "write-only";
    StorageTextureAccess["ReadOnly"] = "read-only";
    StorageTextureAccess["ReadWrite"] = "read-write";
})(StorageTextureAccess || (StorageTextureAccess = {}));
/** @internal */
export var CompilationMessageType;
(function (CompilationMessageType) {
    CompilationMessageType["Error"] = "error";
    CompilationMessageType["Warning"] = "warning";
    CompilationMessageType["Info"] = "info";
})(CompilationMessageType || (CompilationMessageType = {}));
/** @internal */
export var PipelineErrorReason;
(function (PipelineErrorReason) {
    PipelineErrorReason["Validation"] = "validation";
    PipelineErrorReason["Internal"] = "internal";
})(PipelineErrorReason || (PipelineErrorReason = {}));
/** @internal */
export var AutoLayoutMode;
(function (AutoLayoutMode) {
    AutoLayoutMode["Auto"] = "auto";
})(AutoLayoutMode || (AutoLayoutMode = {}));
/** @internal */
export var PrimitiveTopology;
(function (PrimitiveTopology) {
    PrimitiveTopology["PointList"] = "point-list";
    PrimitiveTopology["LineList"] = "line-list";
    PrimitiveTopology["LineStrip"] = "line-strip";
    PrimitiveTopology["TriangleList"] = "triangle-list";
    PrimitiveTopology["TriangleStrip"] = "triangle-strip";
})(PrimitiveTopology || (PrimitiveTopology = {}));
/** @internal */
export var FrontFace;
(function (FrontFace) {
    FrontFace["CCW"] = "ccw";
    FrontFace["CW"] = "cw";
})(FrontFace || (FrontFace = {}));
/** @internal */
export var CullMode;
(function (CullMode) {
    CullMode["None"] = "none";
    CullMode["Front"] = "front";
    CullMode["Back"] = "back";
})(CullMode || (CullMode = {}));
/** @internal */
export var ColorWrite;
(function (ColorWrite) {
    ColorWrite[ColorWrite["Red"] = 1] = "Red";
    ColorWrite[ColorWrite["Green"] = 2] = "Green";
    ColorWrite[ColorWrite["Blue"] = 4] = "Blue";
    ColorWrite[ColorWrite["Alpha"] = 8] = "Alpha";
    ColorWrite[ColorWrite["All"] = 15] = "All";
})(ColorWrite || (ColorWrite = {}));
/** @internal */
export var BlendFactor;
(function (BlendFactor) {
    BlendFactor["Zero"] = "zero";
    BlendFactor["One"] = "one";
    BlendFactor["Src"] = "src";
    BlendFactor["OneMinusSrc"] = "one-minus-src";
    BlendFactor["SrcAlpha"] = "src-alpha";
    BlendFactor["OneMinusSrcAlpha"] = "one-minus-src-alpha";
    BlendFactor["Dst"] = "dst";
    BlendFactor["OneMinusDst"] = "one-minus-dst";
    BlendFactor["DstAlpha"] = "dst-alpha";
    BlendFactor["OneMinusDstAlpha"] = "one-minus-dst-alpha";
    BlendFactor["SrcAlphaSaturated"] = "src-alpha-saturated";
    BlendFactor["Constant"] = "constant";
    BlendFactor["OneMinusConstant"] = "one-minus-constant";
    BlendFactor["Src1"] = "src1";
    BlendFactor["OneMinusSrc1"] = "one-minus-src1";
    BlendFactor["Src1Alpha"] = "src1-alpha";
    BlendFactor["OneMinusSrc1Alpha"] = "one-minus-src1-alpha";
})(BlendFactor || (BlendFactor = {}));
/** @internal */
export var BlendOperation;
(function (BlendOperation) {
    BlendOperation["Add"] = "add";
    BlendOperation["Subtract"] = "subtract";
    BlendOperation["ReverseSubtract"] = "reverse-subtract";
    BlendOperation["Min"] = "min";
    BlendOperation["Max"] = "max";
})(BlendOperation || (BlendOperation = {}));
/** @internal */
export var StencilOperation;
(function (StencilOperation) {
    StencilOperation["Keep"] = "keep";
    StencilOperation["Zero"] = "zero";
    StencilOperation["Replace"] = "replace";
    StencilOperation["Invert"] = "invert";
    StencilOperation["IncrementClamp"] = "increment-clamp";
    StencilOperation["DecrementClamp"] = "decrement-clamp";
    StencilOperation["IncrementWrap"] = "increment-wrap";
    StencilOperation["DecrementWrap"] = "decrement-wrap";
})(StencilOperation || (StencilOperation = {}));
/** @internal */
export var IndexFormat;
(function (IndexFormat) {
    IndexFormat["Uint16"] = "uint16";
    IndexFormat["Uint32"] = "uint32";
})(IndexFormat || (IndexFormat = {}));
/** @internal */
export var VertexFormat;
(function (VertexFormat) {
    VertexFormat["Uint8x2"] = "uint8x2";
    VertexFormat["Uint8x4"] = "uint8x4";
    VertexFormat["Sint8x2"] = "sint8x2";
    VertexFormat["Sint8x4"] = "sint8x4";
    VertexFormat["Unorm8x2"] = "unorm8x2";
    VertexFormat["Unorm8x4"] = "unorm8x4";
    VertexFormat["Snorm8x2"] = "snorm8x2";
    VertexFormat["Snorm8x4"] = "snorm8x4";
    VertexFormat["Uint16x2"] = "uint16x2";
    VertexFormat["Uint16x4"] = "uint16x4";
    VertexFormat["Sint16x2"] = "sint16x2";
    VertexFormat["Sint16x4"] = "sint16x4";
    VertexFormat["Unorm16x2"] = "unorm16x2";
    VertexFormat["Unorm16x4"] = "unorm16x4";
    VertexFormat["Snorm16x2"] = "snorm16x2";
    VertexFormat["Snorm16x4"] = "snorm16x4";
    VertexFormat["Float16x2"] = "float16x2";
    VertexFormat["Float16x4"] = "float16x4";
    VertexFormat["Float32"] = "float32";
    VertexFormat["Float32x2"] = "float32x2";
    VertexFormat["Float32x3"] = "float32x3";
    VertexFormat["Float32x4"] = "float32x4";
    VertexFormat["Uint32"] = "uint32";
    VertexFormat["Uint32x2"] = "uint32x2";
    VertexFormat["Uint32x3"] = "uint32x3";
    VertexFormat["Uint32x4"] = "uint32x4";
    VertexFormat["Sint32"] = "sint32";
    VertexFormat["Sint32x2"] = "sint32x2";
    VertexFormat["Sint32x3"] = "sint32x3";
    VertexFormat["Sint32x4"] = "sint32x4";
    VertexFormat["UNORM10x10x10x2"] = "unorm10-10-10-2";
})(VertexFormat || (VertexFormat = {}));
/** @internal */
export var VertexStepMode;
(function (VertexStepMode) {
    VertexStepMode["Vertex"] = "vertex";
    VertexStepMode["Instance"] = "instance";
})(VertexStepMode || (VertexStepMode = {}));
/** @internal */
export var ComputePassTimestampLocation;
(function (ComputePassTimestampLocation) {
    ComputePassTimestampLocation["Beginning"] = "beginning";
    ComputePassTimestampLocation["End"] = "end";
})(ComputePassTimestampLocation || (ComputePassTimestampLocation = {}));
/** @internal */
export var RenderPassTimestampLocation;
(function (RenderPassTimestampLocation) {
    RenderPassTimestampLocation["Beginning"] = "beginning";
    RenderPassTimestampLocation["End"] = "end";
})(RenderPassTimestampLocation || (RenderPassTimestampLocation = {}));
/** @internal */
export var LoadOp;
(function (LoadOp) {
    LoadOp["Load"] = "load";
    LoadOp["Clear"] = "clear";
})(LoadOp || (LoadOp = {}));
/** @internal */
export var StoreOp;
(function (StoreOp) {
    StoreOp["Store"] = "store";
    StoreOp["Discard"] = "discard";
})(StoreOp || (StoreOp = {}));
/** @internal */
export var QueryType;
(function (QueryType) {
    QueryType["Occlusion"] = "occlusion";
    QueryType["Timestamp"] = "timestamp";
})(QueryType || (QueryType = {}));
/** @internal */
export var CanvasAlphaMode;
(function (CanvasAlphaMode) {
    CanvasAlphaMode["Opaque"] = "opaque";
    CanvasAlphaMode["Premultiplied"] = "premultiplied";
})(CanvasAlphaMode || (CanvasAlphaMode = {}));
/** @internal */
export var CanvasToneMappingMode;
(function (CanvasToneMappingMode) {
    CanvasToneMappingMode["Standard"] = "standard";
    CanvasToneMappingMode["Extended"] = "extended";
})(CanvasToneMappingMode || (CanvasToneMappingMode = {}));
/** @internal */
export var DeviceLostReason;
(function (DeviceLostReason) {
    DeviceLostReason["Unknown"] = "unknown";
    DeviceLostReason["Destroyed"] = "destroyed";
})(DeviceLostReason || (DeviceLostReason = {}));
/** @internal */
export var ErrorFilter;
(function (ErrorFilter) {
    ErrorFilter["Validation"] = "validation";
    ErrorFilter["OutOfMemory"] = "out-of-memory";
    ErrorFilter["Internal"] = "internal";
})(ErrorFilter || (ErrorFilter = {}));
//# sourceMappingURL=webgpuConstants.js.map