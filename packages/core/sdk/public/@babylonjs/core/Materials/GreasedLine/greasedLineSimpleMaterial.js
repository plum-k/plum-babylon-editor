import { RawTexture } from "../Textures/rawTexture.js";
import { ShaderMaterial } from "../shaderMaterial.js";
import { Color3 } from "../../Maths/math.color.js";
import { Vector2 } from "../../Maths/math.vector.js";
import { TextureSampler } from "../Textures/textureSampler.js";
import { GreasedLineTools } from "../../Misc/greasedLineTools.js";
import { GreasedLineMaterialDefaults } from "./greasedLineMaterialDefaults.js";
export const GreasedLineUseOffsetsSimpleMaterialDefine = "GREASED_LINE_USE_OFFSETS";
/**
 * GreasedLineSimpleMaterial
 */
export class GreasedLineSimpleMaterial extends ShaderMaterial {
    /**
     * GreasedLineSimple material constructor
     * @param name material name
     * @param scene the scene
     * @param options material options
     */
    constructor(name, scene, options) {
        const engine = scene.getEngine();
        const isWGSL = engine.isWebGPU && !(options.forceGLSL || GreasedLineSimpleMaterial.ForceGLSL);
        const defines = [
            `COLOR_DISTRIBUTION_TYPE_LINE ${1 /* GreasedLineMeshColorDistributionType.COLOR_DISTRIBUTION_TYPE_LINE */}.`,
            `COLOR_DISTRIBUTION_TYPE_SEGMENT ${0 /* GreasedLineMeshColorDistributionType.COLOR_DISTRIBUTION_TYPE_SEGMENT */}.`,
            `COLOR_MODE_SET ${0 /* GreasedLineMeshColorMode.COLOR_MODE_SET */}.`,
            `COLOR_MODE_ADD ${1 /* GreasedLineMeshColorMode.COLOR_MODE_ADD */}.`,
            `COLOR_MODE_MULTIPLY ${2 /* GreasedLineMeshColorMode.COLOR_MODE_MULTIPLY */}.`,
        ];
        scene.useRightHandedSystem && defines.push("GREASED_LINE_RIGHT_HANDED_COORDINATE_SYSTEM");
        const attributes = ["position", "grl_widths", "grl_offsets", "grl_colorPointers"];
        if (options.cameraFacing) {
            defines.push("GREASED_LINE_CAMERA_FACING");
            attributes.push("grl_previousAndSide", "grl_nextAndCounters");
        }
        else {
            attributes.push("grl_slopes");
            attributes.push("grl_counters");
        }
        const uniforms = [
            "grlColorsWidth",
            "grlUseColors",
            "grlWidth",
            "grlColor",
            "grl_colorModeAndColorDistributionType",
            "grlResolution",
            "grlAspect",
            "grlAizeAttenuation",
            "grlDashArray",
            "grlDashOffset",
            "grlDashRatio",
            "grlUseDash",
            "grlVisibility",
            "grlColors",
        ];
        if (!isWGSL) {
            uniforms.push("world", "viewProjection", "view", "projection");
        }
        super(name, scene, {
            vertex: "greasedLine",
            fragment: "greasedLine",
        }, {
            uniformBuffers: isWGSL ? ["Scene", "Mesh"] : undefined,
            attributes,
            uniforms,
            samplers: isWGSL ? [] : ["grlColors"],
            defines,
            extraInitializationsAsync: async () => {
                if (isWGSL) {
                    await Promise.all([import("../../ShadersWGSL/greasedLine.vertex.js"), import("../../ShadersWGSL/greasedLine.fragment.js")]);
                }
                else {
                    await Promise.all([import("../../Shaders/greasedLine.vertex.js"), import("../../Shaders/greasedLine.fragment.js")]);
                }
            },
            shaderLanguage: isWGSL ? 1 /* ShaderLanguage.WGSL */ : 0 /* ShaderLanguage.GLSL */,
        });
        this._color = Color3.White();
        this._colorsDistributionType = 0 /* GreasedLineMeshColorDistributionType.COLOR_DISTRIBUTION_TYPE_SEGMENT */;
        this._colorsTexture = null;
        options = options || {
            color: GreasedLineMaterialDefaults.DEFAULT_COLOR,
        };
        this.visibility = options.visibility ?? 1;
        this.useDash = options.useDash ?? false;
        this.dashRatio = options.dashRatio ?? 0.5;
        this.dashOffset = options.dashOffset ?? 0;
        this.dashCount = options.dashCount ?? 1; // calculate the _dashArray value, call the setter
        this.width = options.width
            ? options.width
            : options.sizeAttenuation && options.cameraFacing
                ? GreasedLineMaterialDefaults.DEFAULT_WIDTH_ATTENUATED
                : GreasedLineMaterialDefaults.DEFAULT_WIDTH;
        this.sizeAttenuation = options.sizeAttenuation ?? false;
        this.color = options.color ?? Color3.White();
        this.useColors = options.useColors ?? false;
        this.colorsDistributionType = options.colorDistributionType ?? 0 /* GreasedLineMeshColorDistributionType.COLOR_DISTRIBUTION_TYPE_SEGMENT */;
        this.colorsSampling = options.colorsSampling ?? RawTexture.NEAREST_NEAREST;
        this.colorMode = options.colorMode ?? 0 /* GreasedLineMeshColorMode.COLOR_MODE_SET */;
        this._colors = options.colors ?? null;
        this._cameraFacing = options.cameraFacing ?? true;
        this.resolution = options.resolution ?? new Vector2(engine.getRenderWidth(), engine.getRenderHeight()); // calculate aspect call the setter
        if (options.colorsTexture) {
            this.colorsTexture = options.colorsTexture;
        }
        else {
            this.colorsTexture = GreasedLineTools.PrepareEmptyColorsTexture(scene);
        }
        if (this._colors) {
            if (this.useColors) {
                this.colorsTexture = GreasedLineTools.CreateColorsTexture(`${this.name}-colors-texture`, this._colors, this.colorsSampling, scene);
            }
        }
        if (isWGSL) {
            const sampler = new TextureSampler();
            sampler.setParameters(); // use the default values
            sampler.samplingMode = this.colorsSampling;
            this.setTextureSampler("grlColorsSampler", sampler);
        }
        engine.onDisposeObservable.add(() => {
            GreasedLineTools.DisposeEmptyColorsTexture();
        });
    }
    /**
     * Disposes the plugin material.
     */
    dispose() {
        this._colorsTexture?.dispose();
        super.dispose();
    }
    _setColorModeAndColorDistributionType() {
        this.setVector2("grl_colorModeAndColorDistributionType", new Vector2(this._colorMode, this._colorsDistributionType));
    }
    /**
     * Updates the material. Use when material created in lazy mode.
     */
    updateLazy() {
        if (this._colors) {
            this.setColors(this._colors, false, true);
        }
    }
    /**
     * Returns the colors used to colorize the line
     */
    get colors() {
        return this._colors;
    }
    /**
     * Sets the colors used to colorize the line
     */
    set colors(value) {
        this.setColors(value);
    }
    /**
     * Creates or updates the colors texture
     * @param colors color table RGBA
     * @param lazy if lazy, the colors are not updated
     * @param forceNewTexture force creation of a new texture
     */
    setColors(colors, lazy = false, forceNewTexture = false) {
        const origColorsCount = this._colors?.length ?? 0;
        this._colors = colors;
        if (colors === null || colors.length === 0) {
            this._colorsTexture?.dispose();
            return;
        }
        if (lazy && !forceNewTexture) {
            return;
        }
        if (this._colorsTexture && origColorsCount === colors.length && !forceNewTexture) {
            const colorArray = GreasedLineTools.Color3toRGBAUint8(colors);
            this._colorsTexture.update(colorArray);
        }
        else {
            this._colorsTexture?.dispose();
            this.colorsTexture = GreasedLineTools.CreateColorsTexture(`${this.name}-colors-texture`, colors, this.colorsSampling, this.getScene());
        }
    }
    /**
     * Gets the colors texture
     */
    get colorsTexture() {
        return this._colorsTexture ?? null;
    }
    /**
     * Sets the colorsTexture
     */
    set colorsTexture(value) {
        this._colorsTexture = value;
        this.setFloat("grlColorsWidth", this._colorsTexture.getSize().width);
        this.setTexture("grlColors", this._colorsTexture);
    }
    /**
     * Line base width. At each point the line width is calculated by widths[pointIndex] * width
     */
    get width() {
        return this._width;
    }
    /**
     * Line base width. At each point the line width is calculated by widths[pointIndex] * width
     */
    set width(value) {
        this._width = value;
        this.setFloat("grlWidth", value);
    }
    /**
     * Whether to use the colors option to colorize the line
     */
    get useColors() {
        return this._useColors;
    }
    set useColors(value) {
        this._useColors = value;
        this.setFloat("grlUseColors", GreasedLineTools.BooleanToNumber(value));
    }
    /**
     * The type of sampling of the colors texture. The values are the same when using with textures.
     */
    get colorsSampling() {
        return this._colorsSampling;
    }
    /**
     * The type of sampling of the colors texture. The values are the same when using with textures.
     */
    set colorsSampling(value) {
        this._colorsSampling = value;
    }
    /**
     * Normalized value of how much of the line will be visible
     * 0 - 0% of the line will be visible
     * 1 - 100% of the line will be visible
     */
    get visibility() {
        return this._visibility;
    }
    set visibility(value) {
        this._visibility = value;
        this.setFloat("grlVisibility", value);
    }
    /**
     * Turns on/off dash mode
     */
    get useDash() {
        return this._useDash;
    }
    /**
     * Turns on/off dash mode
     */
    set useDash(value) {
        this._useDash = value;
        this.setFloat("grlUseDash", GreasedLineTools.BooleanToNumber(value));
    }
    /**
     * Gets the dash offset
     */
    get dashOffset() {
        return this._dashOffset;
    }
    /**
     * Sets the dash offset
     */
    set dashOffset(value) {
        this._dashOffset = value;
        this.setFloat("grlDashOffset", value);
    }
    /**
     * Length of the dash. 0 to 1. 0.5 means half empty, half drawn.
     */
    get dashRatio() {
        return this._dashRatio;
    }
    /**
     * Length of the dash. 0 to 1. 0.5 means half empty, half drawn.
     */
    set dashRatio(value) {
        this._dashRatio = value;
        this.setFloat("grlDashRatio", value);
    }
    /**
     * Gets the number of dashes in the line
     */
    get dashCount() {
        return this._dashCount;
    }
    /**
     * Sets the number of dashes in the line
     * @param value dash
     */
    set dashCount(value) {
        this._dashCount = value;
        this._dashArray = 1 / value;
        this.setFloat("grlDashArray", this._dashArray);
    }
    /**
     * False means 1 unit in width = 1 unit on scene, true means 1 unit in width is reduced on the screen to make better looking lines
     */
    get sizeAttenuation() {
        return this._sizeAttenuation;
    }
    /**
     * Turn on/off attenuation of the width option and widths array.
     * @param value false means 1 unit in width = 1 unit on scene, true means 1 unit in width is reduced on the screen to make better looking lines
     */
    set sizeAttenuation(value) {
        this._sizeAttenuation = value;
        this.setFloat("grlSizeAttenuation", GreasedLineTools.BooleanToNumber(value));
    }
    /**
     * Gets the color of the line
     */
    get color() {
        return this._color;
    }
    /**
     * Sets the color of the line
     * @param value Color3
     */
    set color(value) {
        this.setColor(value);
    }
    /**
     * Sets the color of the line. If set the whole line will be mixed with this color according to the colorMode option.
     * The simple material always needs a color to be set. If you set it to null it will set the color to the default color (GreasedLineSimpleMaterial.DEFAULT_COLOR).
     * @param value color
     */
    setColor(value) {
        value = value ?? GreasedLineMaterialDefaults.DEFAULT_COLOR;
        this._color = value;
        this.setColor3("grlColor", value);
    }
    /**
     * Gets the color distributiopn type
     */
    get colorsDistributionType() {
        return this._colorsDistributionType;
    }
    /**
     * Sets the color distribution type
     * @see GreasedLineMeshColorDistributionType
     * @param value color distribution type
     */
    set colorsDistributionType(value) {
        this._colorsDistributionType = value;
        this._setColorModeAndColorDistributionType();
    }
    /**
     * Gets the mixing mode of the color and colors paramaters. Default value is GreasedLineMeshColorMode.SET.
     * MATERIAL_TYPE_SIMPLE mixes the color and colors of the greased line material.
     * @see GreasedLineMeshColorMode
     */
    get colorMode() {
        return this._colorMode;
    }
    /**
     * Sets the mixing mode of the color and colors paramaters. Default value is GreasedLineMeshColorMode.SET.
     * MATERIAL_TYPE_SIMPLE mixes the color and colors of the greased line material.
     * @see GreasedLineMeshColorMode
     */
    set colorMode(value) {
        this._colorMode = value;
        this._setColorModeAndColorDistributionType();
    }
    /**
     * Gets the resolution
     */
    get resolution() {
        return this._resolution;
    }
    /**
     * Sets the resolution
     * @param value resolution of the screen for GreasedLine
     */
    set resolution(value) {
        this._resolution = value;
        this.setVector2("grlResolution", value);
        this.setFloat("grlAspect", value.x / value.y);
    }
    /**
     * Serializes this plugin material
     * @returns serializationObjec
     */
    serialize() {
        const serializationObject = super.serialize();
        const greasedLineMaterialOptions = {
            colorDistributionType: this._colorsDistributionType,
            colorsSampling: this._colorsSampling,
            colorMode: this._colorMode,
            color: this._color,
            dashCount: this._dashCount,
            dashOffset: this._dashOffset,
            dashRatio: this._dashRatio,
            resolution: this._resolution,
            sizeAttenuation: this._sizeAttenuation,
            useColors: this._useColors,
            useDash: this._useDash,
            visibility: this._visibility,
            width: this._width,
            cameraFacing: this._cameraFacing,
        };
        this._colors && (greasedLineMaterialOptions.colors = this._colors);
        serializationObject.greasedLineMaterialOptions = greasedLineMaterialOptions;
        return serializationObject;
    }
    /**
     * Parses a serialized objects
     * @param source serialized object
     * @param scene scene
     * @param _rootUrl root url for textures
     */
    parse(source, scene, _rootUrl) {
        const greasedLineMaterialOptions = source.greasedLineMaterialOptions;
        this._colorsTexture?.dispose();
        greasedLineMaterialOptions.color && (this.color = greasedLineMaterialOptions.color);
        greasedLineMaterialOptions.colorDistributionType && (this.colorsDistributionType = greasedLineMaterialOptions.colorDistributionType);
        greasedLineMaterialOptions.colorsSampling && (this.colorsSampling = greasedLineMaterialOptions.colorsSampling);
        greasedLineMaterialOptions.colorMode && (this.colorMode = greasedLineMaterialOptions.colorMode);
        greasedLineMaterialOptions.useColors && (this.useColors = greasedLineMaterialOptions.useColors);
        greasedLineMaterialOptions.visibility && (this.visibility = greasedLineMaterialOptions.visibility);
        greasedLineMaterialOptions.useDash && (this.useDash = greasedLineMaterialOptions.useDash);
        greasedLineMaterialOptions.dashCount && (this.dashCount = greasedLineMaterialOptions.dashCount);
        greasedLineMaterialOptions.dashRatio && (this.dashRatio = greasedLineMaterialOptions.dashRatio);
        greasedLineMaterialOptions.dashOffset && (this.dashOffset = greasedLineMaterialOptions.dashOffset);
        greasedLineMaterialOptions.width && (this.width = greasedLineMaterialOptions.width);
        greasedLineMaterialOptions.sizeAttenuation && (this.sizeAttenuation = greasedLineMaterialOptions.sizeAttenuation);
        greasedLineMaterialOptions.resolution && (this.resolution = greasedLineMaterialOptions.resolution);
        if (greasedLineMaterialOptions.colors) {
            this.colorsTexture = GreasedLineTools.CreateColorsTexture(`${this.name}-colors-texture`, greasedLineMaterialOptions.colors, this.colorsSampling, this.getScene());
        }
        else {
            this.colorsTexture = GreasedLineTools.PrepareEmptyColorsTexture(scene);
        }
        this._cameraFacing = greasedLineMaterialOptions.cameraFacing ?? true;
        this.setDefine("GREASED_LINE_CAMERA_FACING", this._cameraFacing);
    }
}
/**
 * Force to use GLSL in WebGPU
 */
GreasedLineSimpleMaterial.ForceGLSL = false;
//# sourceMappingURL=greasedLineSimpleMaterial.js.map