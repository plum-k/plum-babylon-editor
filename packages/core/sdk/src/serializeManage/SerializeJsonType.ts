export interface LocalMatrixJson {
    [key: string]: number
}

export interface MaterialJsonIndexRangeJson {
    MaterialJsonIndex: number;
    verticesStart: number;
    verticesCount: number;
    indexStart: number;
    indexCount: number;
}

export interface BoneJsonMatrixJson {
    0: number;
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
    6: number;
    7: number;
    8: number;
    9: number;
    10: number;
    11: number;
    12: number;
    13: number;
    14: number;
    15: number;
}

export interface BoneJson {
    parentBoneJsonIndex: number;
    index: number;
    name: string;
    id: string;
    matrix: BoneJsonMatrixJson;
    rest: BoneJsonMatrixJson;
    linkedTransformNodeJsonId: string;
}

export interface SkeletonJson {
    name: string;
    id: string;
    BoneJsons: BoneJson[];
    needInitialSkinMatrix: boolean;
    ranges: Array<any>;
}

export interface MeshJson {
    name: string;
    id: string;
    uniqueId: number;
    interface: string;
    position: Array<number>;
    rotation: Array<number>;
    scaling: Array<number>;
    LocalMatrixJson: LocalMatrixJson;
    isEnabled: boolean;
    isVisible: boolean;
    infiniteDistance: boolean;
    pickable: boolean;
    receiveShadows: boolean;
    billboardMode: number;
    visibility: number;
    alwaysSelectAsActiveMeshJson: boolean;
    checkCollisions: boolean;
    ellipsoid: [number, number, number];
    ellipsoidOffset: [number, number, number];
    doNotSyncBoundingInfo: boolean;
    isBlocker: boolean;
    sideOrientation: number;
    parentId: number;
    isUnIndexed: boolean;
    GeometryJsonUniqueId: number;
    GeometryJsonId: string;
    subMeshJsones: MaterialJsonIndexRangeJson[];
    MaterialJsonUniqueId: number;
    MaterialJsonId: string;
    SkeletonJsonId: string;
    numBoneJsonInfluencers: number;
    metadata: {
        uniqueId: number;
        parentId: number;
    }
    instances: Array<any>;
    animations: Array<any>;
    ranges: Array<any>;
    layerMask: number;
    alphaIndex: number;
    hasVertexAlpha: boolean;
    overlayAlpha: number;
    overlayColor: [number, number, number];
    applyFog: boolean;
}

export interface TransformNodeJson {
    tags: any;
    position: Array<number>;
    rotation: Array<number>;
    rotationQuaternion: [number, number, number, number];
    scaling: Array<number>;
    billboardMode: number;
    scalingDeterminant: number;
    infiniteDistance: boolean;
    ignoreNonUniformScaling: boolean;
    reIntegrateRotationIntoRotationQuaternion: boolean;
    name: string;
    id: string;
    state: string;
    metadata: {
        uniqueId: number;
        parentId: number;
    }
    interface: string;
    uniqueId: number;
    parentId: number;
    LocalMatrixJson: LocalMatrixJson;
    isEnabled: boolean;
    animations: Array<any>;
    ranges: Array<any>;
}

export interface MaterialJson {
    tags: any;
    directIntensity: number;
    emissiveIntensity: number;
    environmentIntensity: number;
    specularIntensity: number;
    disableBumpMap: boolean;
    ambientTextureStrength: number;
    ambientTextureImpactOnAnalyticalLights: number;
    metallic: number;
    roughness: number;
    metallicF0Factor: number;
    metallicReflectanceColor: [number, number, number];
    useOnlyMetallicFromMetallicReflectanceTexture: boolean;
    ambient: [number, number, number];
    albedo: [number, number, number];
    reflectivity: [number, number, number];
    reflection: [number, number, number];
    emissive: [number, number, number];
    microSurface: number;
    useLightmapAsShadowmap: boolean;
    useAlphaFromAlbedoTexture: boolean;
    forceAlphaTest: boolean;
    alphaCutOff: number;
    useSpecularOverAlpha: boolean;
    useMicroSurfaceFromReflectivityMapAlpha: boolean;
    useRoughnessFromMetallicTextureAlpha: boolean;
    useRoughnessFromMetallicTextureGreen: boolean;
    useMetallnessFromMetallicTextureBlue: boolean;
    useAmbientOcclusionFromMetallicTextureRed: boolean;
    useAmbientInGrayScale: boolean;
    useAutoMicroSurfaceFromReflectivityMap: boolean;
    usePhysicalLightFalloff: boolean;
    useGLTFLightFalloff: boolean;
    useRadianceOverAlpha: boolean;
    useObjectSpaceNormalMap: boolean;
    useParallax: boolean;
    useParallaxOcclusion: boolean;
    parallaxScaleBias: number;
    disableLighting: boolean;
    forceIrradianceInFragment: boolean;
    maxSimultaneousLights: number;
    invertNormalMapX: boolean;
    invertNormalMapY: boolean;
    twoSidedLighting: boolean;
    useAlphaFresnel: boolean;
    useLinearAlphaFresnel: boolean;
    forceNormalForward: boolean;
    enableSpecularAntiAliasing: boolean;
    useHorizonOcclusion: boolean;
    useRadianceOcclusion: boolean;
    unlit: boolean;
    applyDecalMapAfterDetailMap: boolean;
    _imageProcessingConfiguration: {
        tags: any;
        colorCurves: {
            tags: any;
            _globalHue: number;
            _globalDensity: number;
            _globalSaturation: number;
            _globalExposure: number;
            _highlightsHue: number;
            _highlightsDensity: number;
            _highlightsSaturation: number;
            _highlightsExposure: number;
            _midtonesHue: number;
            _midtonesDensity: number;
            _midtonesSaturation: number;
            _midtonesExposure: number;
        },
        _colorCurvesEnabled: boolean;
        _colorGradingEnabled: boolean;
        _colorGradingWithGreenDepth: boolean;
        _colorGradingBGR: boolean;
        _exposure: number;
        _toneMappingEnabled: boolean;
        _toneMappinginterface: number;
        _contrast: number;
        vignetteStretch: number;
        vignetteCenterX: number;
        vignetteCenterY: number;
        vignetteWeight: number;
        vignetteColor: [number, number, number, number];
        vignetteCameraFov: number;
        _vignetteBlendMode: number;
        _vignetteEnabled: boolean;
        _ditheringEnabled: boolean;
        _ditheringIntensity: number;
        _skipFinalColorClamp: boolean;
        _applyByPostProcess: boolean;
        _isEnabled: boolean;
    },
    id: string;
    name: string;
    metadata: {}
    checkReadyOnEveryCall: boolean;
    checkReadyOnlyOnce: boolean;
    state: string;
    alpha: number;
    backFaceCulling: boolean;
    cullBackFaces: boolean;
    alphaMode: number;
    _needDepthPrePass: boolean;
    disableDepthWrite: boolean;
    disableColorWrite: boolean;
    forceDepthWrite: boolean;
    depthFunction: number;
    separateCullingPass: boolean;
    fogEnabled: boolean;
    pointSize: number;
    zOffset: number;
    zOffsetUnits: number;
    pointsCloud: boolean;
    fillMode: number;
    transparencyMode: number;
    stencil: {
        tags: any;
        func: number;
        funcRef: number;
        funcMask: number;
        opStencilFail: number;
        opDepthFail: number;
        opStencilDepthPass: number;
        mask: number;
        enabled: boolean;
    },
    uniqueId: number;
    plugins: {
        PBRBRDFConfiguration: {
            tags: any;
            useEnergyConservation: boolean;
            useSmithVisibilityHeightCorrelated: boolean;
            useSphericalHarmonics: boolean;
            useSpecularGlossinessInputEnergyConservation: boolean;
            name: string;
            priority: number;
            resolveIncludes: boolean;
            registerForExtraEvents: boolean;
        },
        PBRClearCoatConfiguration: {
            tags: any;
            isEnabled: boolean;
            intensity: number;
            roughness: number;
            indexOfRefraction: number;
            useRoughnessFromMainTexture: boolean;
            remapF0OnInterfaceChange: boolean;
            isTintEnabled: boolean;
            tintColor: [number, number, number];
            tintColorAtDistance: number;
            tintThickness: number;
            name: string;
            priority: number;
            resolveIncludes: boolean;
            registerForExtraEvents: boolean;
        },
        PBRIridescenceConfiguration: {
            tags: any;
            isEnabled: boolean;
            intensity: number;
            minimumThickness: number;
            maximumThickness: number;
            indexOfRefraction: number;
            name: string;
            priority: number;
            resolveIncludes: boolean;
        },
        PBRAnisotropicConfiguration: {
            tags: any;
            isEnabled: boolean;
            intensity: number;
            direction: [number, number];
            legacy: boolean;
            name: string;
            priority: number;
            resolveIncludes: boolean;
            registerForExtraEvents: boolean;
        },
        PBRSheenConfiguration: {
            tags: any;
            isEnabled: boolean;
            linkSheenWithAlbedo: boolean;
            intensity: number;
            color: [number, number, number];
            useRoughnessFromMainTexture: boolean;
            albedoScaling: boolean;
            name: string;
            priority: number;
            resolveIncludes: boolean;
            registerForExtraEvents: boolean;
        },
        PBRSubSurfaceConfiguration: {
            tags: any;
            isRefractionEnabled: boolean;
            isTranslucencyEnabled: boolean;
            isDispersionEnabled: boolean;
            isScatteringEnabled: boolean;
            _scatteringDiffusionProfileIndex: number;
            refractionIntensity: number;
            translucencyIntensity: number;
            useAlbedoToTintRefraction: boolean;
            useAlbedoToTintTranslucency: boolean;
            indexOfRefraction: number;
            _volumeIndexOfRefraction: number;
            invertRefractionY: boolean;
            linkRefractionWithTransparency: boolean;
            minimumThickness: number;
            maximumThickness: number;
            useThicknessAsDepth: boolean;
            tintColor: [number, number, number];
            tintColorAtDistance: number;
            dispersion: number;
            diffusionDistance: [number, number, number];
            useMaskFromThicknessTexture: boolean;
            useGltfStyleTextures: boolean;
            name: string;
            priority: number;
            resolveIncludes: boolean;
            registerForExtraEvents: boolean;
        },
        DetailMapConfiguration: {
            tags: any;
            diffuseBlendLevel: number;
            roughnessBlendLevel: number;
            bumpLevel: number;
            normalBlendMethod: number;
            isEnabled: boolean;
            name: string;
            priority: number;
            resolveIncludes: boolean;
            registerForExtraEvents: boolean;
        }
    },
    custominterface: string;
}

export interface GeometryJson {
    boxes: Array<any>;
    spheres: Array<any>;
    cylinders: Array<any>;
    toruses: Array<any>;
    grounds: Array<any>;
    planes: Array<any>;
    torusKnots: Array<any>;
    vertexData: {
        id: string;
        uniqueId: number;
        updatable: boolean;
        positions: number[];
        normals: number[];
        uvs: number[];
        matricesIndices: number[];
        matricesWeights: number[];
        indices: number[];
    }[];
}

export interface SceneSerializeObject {
    animationGroups?: Array<any>;
    cameras: Array<any>;
    geometries: GeometryJson;
    lights: Array<any>;
    materials: MaterialJson[];
    meshes: MeshJson[];
    skeletons: SkeletonJson[];
    transformNodes: TransformNodeJson[];
}



