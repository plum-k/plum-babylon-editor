import { Vector2, Vector3 } from "../Maths/math.vector.js";
import { Texture } from "../Materials/Textures/texture.js";
import { RawTexture } from "../Materials/Textures/rawTexture.js";
import { ShaderMaterial } from "../Materials/shaderMaterial.js";
import { Effect } from "../Materials/effect.js";
import { CreatePlane } from "../Meshes/Builders/planeBuilder.js";
import "../Shaders/spriteMap.fragment.js";
import "../Shaders/spriteMap.vertex.js";

export var SpriteMapFrameRotationDirection;
(function (SpriteMapFrameRotationDirection) {
    SpriteMapFrameRotationDirection[SpriteMapFrameRotationDirection["CCW"] = 0] = "CCW";
    SpriteMapFrameRotationDirection[SpriteMapFrameRotationDirection["CW"] = 1] = "CW";
})(SpriteMapFrameRotationDirection || (SpriteMapFrameRotationDirection = {}));
/**
 * Class used to manage a grid restricted sprite deployment on an Output plane.
 */
export class SpriteMap {
    /** Returns the Number of Sprites in the System */
    get spriteCount() {
        return this.sprites.length;
    }
    /** Returns the Position of Output Plane*/
    get position() {
        return this._output.position;
    }
    /** Returns the Position of Output Plane*/
    set position(v) {
        this._output.position = v;
    }
    /** Returns the Rotation of Output Plane*/
    get rotation() {
        return this._output.rotation;
    }
    /** Returns the Rotation of Output Plane*/
    set rotation(v) {
        this._output.rotation = v;
    }
    /** Sets the AnimationMap*/
    get animationMap() {
        return this._animationMap;
    }
    /** Sets the AnimationMap*/
    set animationMap(v) {
        const buffer = v._texture._bufferView;
        const am = this._createTileAnimationBuffer(buffer);
        this._animationMap.dispose();
        this._animationMap = am;
        this._material.setTexture("animationMap", this._animationMap);
    }
    /** Gets or sets a boolean indicating if the sprite map must consider scene fog when rendering */
    get fogEnabled() {
        return this._material.fogEnabled;
    }
    set fogEnabled(value) {
        this._material.fogEnabled = value;
    }
    /** Gets or sets a boolean indicating if the sprite map must use logarithmic depth when rendering */
    get useLogarithmicDepth() {
        return this._material.useLogarithmicDepth;
    }
    set useLogarithmicDepth(value) {
        this._material.useLogarithmicDepth = value;
    }
    /**
     * Creates a new SpriteMap
     * @param name defines the SpriteMaps Name
     * @param atlasJSON is the JSON file that controls the Sprites Frames and Meta
     * @param spriteSheet is the Texture that the Sprites are on.
     * @param options a basic deployment configuration
     * @param scene The Scene that the map is deployed on
     */
    constructor(name, atlasJSON, spriteSheet, options, scene) {
        this.name = name;
        this.sprites = [];
        this.atlasJSON = atlasJSON;
        this.sprites = this.atlasJSON["frames"];
        this.spriteSheet = spriteSheet;
        /**
         * Run through the options and set what ever defaults are needed that where not declared.
         */
        this.options = options;
        options.stageSize = options.stageSize || new Vector2(1, 1);
        options.outputSize = options.outputSize || options.stageSize;
        options.outputPosition = options.outputPosition || Vector3.Zero();
        options.outputRotation = options.outputRotation || Vector3.Zero();
        options.layerCount = options.layerCount || 1;
        options.maxAnimationFrames = options.maxAnimationFrames || 0;
        options.baseTile = options.baseTile || 0;
        options.flipU = options.flipU || false;
        options.colorMultiply = options.colorMultiply || new Vector3(1, 1, 1);
        this._scene = scene;
        this._frameMap = this._createFrameBuffer();
        this._tileMaps = new Array();
        for (let i = 0; i < options.layerCount; i++) {
            this._tileMaps.push(this._createTileBuffer(null, i));
        }
        this._animationMap = this._createTileAnimationBuffer(null);
        const defines = [];
        defines.push("#define LAYERS " + options.layerCount);
        if (options?.frameRotationDirection === SpriteMapFrameRotationDirection.CW) {
            defines.push("#define FR_CW");
        }
        if (options.flipU) {
            defines.push("#define FLIPU");
        }
        defines.push(`#define MAX_ANIMATION_FRAMES ${options.maxAnimationFrames}.0`);
        const shaderString = Effect.ShadersStore["spriteMapPixelShader"];
        let layerSampleString;
        if (!scene.getEngine()._features.supportSwitchCaseInShader) {
            layerSampleString = "";
            for (let i = 0; i < options.layerCount; i++) {
                layerSampleString += `if (${i} == i) { frameID = texture2D(tileMaps[${i}], (tileID + 0.5) / stageSize, 0.).x; }`;
            }
        }
        else {
            layerSampleString = "switch(i) {";
            for (let i = 0; i < options.layerCount; i++) {
                layerSampleString += "case " + i + " : frameID = texture(tileMaps[" + i + "], (tileID + 0.5) / stageSize, 0.).x;";
                layerSampleString += "break;";
            }
            layerSampleString += "}";
        }
        Effect.ShadersStore["spriteMap" + this.name + "PixelShader"] = shaderString.replace("#define LAYER_ID_SWITCH", layerSampleString);
        this._material = new ShaderMaterial("spriteMap:" + this.name, this._scene, {
            vertex: "spriteMap",
            fragment: "spriteMap" + this.name,
        }, {
            defines,
            attributes: ["position", "normal", "uv"],
            uniforms: [
                "world",
                "view",
                "projection",
                "time",
                "stageSize",
                "outputSize",
                "spriteMapSize",
                "spriteCount",
                "time",
                "colorMul",
                "mousePosition",
                "curTile",
                "flipU",
            ],
            samplers: ["spriteSheet", "frameMap", "tileMaps", "animationMap"],
            needAlphaBlending: true,
        });
        this._time = 0;
        this._material.setFloat("spriteCount", this.spriteCount);
        this._material.setVector2("stageSize", options.stageSize);
        this._material.setVector2("outputSize", options.outputSize);
        this._material.setTexture("spriteSheet", this.spriteSheet);
        this._material.setVector2("spriteMapSize", new Vector2(1, 1));
        this._material.setVector3("colorMul", options.colorMultiply);
        let tickSave = 0;
        const bindSpriteTexture = () => {
            if (this.spriteSheet && this.spriteSheet.isReady()) {
                if (this.spriteSheet._texture) {
                    this._material.setVector2("spriteMapSize", new Vector2(this.spriteSheet._texture.baseWidth || 1, this.spriteSheet._texture.baseHeight || 1));
                    return;
                }
            }
            if (tickSave < 100) {
                setTimeout(() => {
                    tickSave++;
                    bindSpriteTexture();
                }, 100);
            }
        };
        bindSpriteTexture();
        this._material.setVector3("colorMul", options.colorMultiply);
        this._material.setTexture("frameMap", this._frameMap);
        this._material.setTextureArray("tileMaps", this._tileMaps);
        this._material.setTexture("animationMap", this._animationMap);
        this._material.setFloat("time", this._time);
        this._output = CreatePlane(name + ":output", { size: 1, updatable: true }, scene);
        this._output.scaling.x = options.outputSize.x;
        this._output.scaling.y = options.outputSize.y;
        this.position = options.outputPosition;
        this.rotation = options.outputRotation;
        const obfunction = () => {
            this._time += this._scene.getEngine().getDeltaTime();
            this._material.setFloat("time", this._time);
        };
        this._scene.onBeforeRenderObservable.add(obfunction);
        this._output.material = this._material;
    }
    /**
     * Returns the index of the frame for a given filename
     * @param name filename of the frame
     * @returns index of the frame
     */
    getTileIdxByName(name) {
        const idx = this.atlasJSON.frames.findIndex((f) => f.filename === name);
        return idx;
    }
    /**
     * Returns tileID location
     * @returns Vector2 the cell position ID
     */
    getTileID() {
        const p = this.getMousePosition();
        p.multiplyInPlace(this.options.stageSize || Vector2.Zero());
        p.x = Math.floor(p.x);
        p.y = Math.floor(p.y);
        return p;
    }
    /**
     * Gets the UV location of the mouse over the SpriteMap.
     * @returns Vector2 the UV position of the mouse interaction
     */
    getMousePosition() {
        const out = this._output;
        const pickinfo = this._scene.pick(this._scene.pointerX, this._scene.pointerY, (mesh) => {
            if (mesh !== out) {
                return false;
            }
            return true;
        });
        if (!pickinfo || !pickinfo.hit || !pickinfo.getTextureCoordinates) {
            return new Vector2(-1, -1);
        }
        const coords = pickinfo.getTextureCoordinates();
        if (coords) {
            return coords;
        }
        return new Vector2(-1, -1);
    }
    /**
     * Creates the "frame" texture Buffer
     * -------------------------------------
     * Structure of frames
     *  "filename": "Falling-Water-2.png",
     * "frame": {"x":69,"y":103,"w":24,"h":32},
     * "rotated": true,
     * "trimmed": true,
     * "spriteSourceSize": {"x":4,"y":0,"w":24,"h":32},
     * "sourceSize": {"w":32,"h":32}
     * @returns RawTexture of the frameMap
     */
    _createFrameBuffer() {
        const data = [];
        //Do two Passes
        for (let i = 0; i < this.spriteCount; i++) {
            data.push(0, 0, 0, 0); //frame
            data.push(0, 0, 0, 0); //spriteSourceSize
            data.push(0, 0, 0, 0); //sourceSize, rotated, trimmed
            data.push(0, 0, 0, 0); //Keep it pow2 cause I"m cool like that... it helps with sampling accuracy as well. Plus then we have 4 other parameters for future stuff.
        }
        //Second Pass
        for (let i = 0; i < this.spriteCount; i++) {
            const f = this.sprites[i]["frame"];
            const sss = this.sprites[i]["spriteSourceSize"];
            const ss = this.sprites[i]["sourceSize"];
            const r = this.sprites[i]["rotated"] ? 1 : 0;
            const t = this.sprites[i]["trimmed"] ? 1 : 0;
            //frame
            data[i * 4] = f.x;
            data[i * 4 + 1] = f.y;
            data[i * 4 + 2] = f.w;
            data[i * 4 + 3] = f.h;
            //spriteSourceSize
            data[i * 4 + this.spriteCount * 4] = sss.x;
            data[i * 4 + 1 + this.spriteCount * 4] = sss.y;
            data[i * 4 + 3 + this.spriteCount * 4] = sss.h;
            //sourceSize, rotated, trimmed
            data[i * 4 + this.spriteCount * 8] = ss.w;
            data[i * 4 + 1 + this.spriteCount * 8] = ss.h;
            data[i * 4 + 2 + this.spriteCount * 8] = r;
            data[i * 4 + 3 + this.spriteCount * 8] = t;
        }
        const floatArray = new Float32Array(data);
        const t = RawTexture.CreateRGBATexture(floatArray, this.spriteCount, 4, this._scene, false, false, Texture.NEAREST_NEAREST, 1);
        return t;
    }
    /**
     * Creates the tileMap texture Buffer
     * @param buffer normally and array of numbers, or a false to generate from scratch
     * @param _layer indicates what layer for a logic trigger dealing with the baseTile.  The system uses this
     * @returns RawTexture of the tileMap
     */
    _createTileBuffer(buffer, _layer = 0) {
        let data = [];
        const _ty = this.options.stageSize.y || 0;
        const _tx = this.options.stageSize.x || 0;
        if (!buffer) {
            let bt = this.options.baseTile;
            if (_layer != 0) {
                bt = 0;
            }
            for (let y = 0; y < _ty; y++) {
                for (let x = 0; x < _tx * 4; x += 4) {
                    data.push(bt, 0, 0, 0);
                }
            }
        }
        else {
            data = buffer;
        }
        const floatArray = new Float32Array(data);
        const t = RawTexture.CreateRGBATexture(floatArray, _tx, _ty, this._scene, false, false, Texture.NEAREST_NEAREST, 1);
        return t;
    }
    /**
     * Modifies the data of the tileMaps
     * @param _layer is the ID of the layer you want to edit on the SpriteMap
     * @param pos is the iVector2 Coordinates of the Tile
     * @param tile The SpriteIndex of the new Tile
     */
    changeTiles(_layer = 0, pos, tile = 0) {
        const buffer = this._tileMaps[_layer]._texture._bufferView;
        if (buffer === null) {
            return;
        }
        let p = [];
        if (pos instanceof Vector2) {
            p.push(pos);
        }
        else {
            p = pos;
        }
        const _tx = this.options.stageSize.x || 0;
        for (let i = 0; i < p.length; i++) {
            const _p = p[i];
            _p.x = Math.floor(_p.x);
            _p.y = Math.floor(_p.y);
            const id = _p.x * 4 + _p.y * (_tx * 4);
            buffer[id] = tile;
        }
        const t = this._createTileBuffer(buffer);
        this._tileMaps[_layer].dispose();
        this._tileMaps[_layer] = t;
        this._material.setTextureArray("tileMap", this._tileMaps);
    }
    /**
     * Creates the animationMap texture Buffer
     * @param buffer normally and array of numbers, or a false to generate from scratch
     * @returns RawTexture of the animationMap
     */
    _createTileAnimationBuffer(buffer) {
        const data = [];
        let floatArray;
        if (!buffer) {
            for (let i = 0; i < this.spriteCount; i++) {
                data.push(0, 0, 0, 0);
                let count = 1;
                while (count < (this.options.maxAnimationFrames || 4)) {
                    data.push(0, 0, 0, 0);
                    count++;
                }
            }
            floatArray = new Float32Array(data);
        }
        else {
            floatArray = buffer;
        }
        const t = RawTexture.CreateRGBATexture(floatArray, this.spriteCount, this.options.maxAnimationFrames || 4, this._scene, false, false, Texture.NEAREST_NEAREST, 1);
        return t;
    }
    /**
     * Modifies the data of the animationMap
     * @param cellID is the Index of the Sprite
     * @param _frame is the target Animation frame
     * @param toCell is the Target Index of the next frame of the animation
     * @param time is a value between 0-1 that is the trigger for when the frame should change tiles
     * @param speed is a global scalar of the time variable on the map.
     */
    addAnimationToTile(cellID = 0, _frame = 0, toCell = 0, time = 0, speed = 1) {
        const buffer = this._animationMap._texture._bufferView;
        const id = cellID * 4 + this.spriteCount * 4 * _frame;
        if (!buffer) {
            return;
        }
        buffer[id] = toCell;
        buffer[id + 1] = time;
        buffer[id + 2] = speed;
        const t = this._createTileAnimationBuffer(buffer);
        this._animationMap.dispose();
        this._animationMap = t;
        this._material.setTexture("animationMap", this._animationMap);
    }
    /**
     * Exports the .tilemaps file
     */
    saveTileMaps() {
        let maps = "";
        for (let i = 0; i < this._tileMaps.length; i++) {
            if (i > 0) {
                maps += "\n\r";
            }
            maps += this._tileMaps[i]._texture._bufferView.toString();
        }
        const hiddenElement = document.createElement("a");
        hiddenElement.href = "data:octet/stream;charset=utf-8," + encodeURI(maps);
        hiddenElement.target = "_blank";
        hiddenElement.download = this.name + ".tilemaps";
        hiddenElement.click();
        hiddenElement.remove();
    }
    /**
     * Imports the .tilemaps file
     * @param url of the .tilemaps file
     */
    loadTileMaps(url) {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", url);
        const _lc = this.options.layerCount || 0;
        xhr.onload = () => {
            const data = xhr.response.split("\n\r");
            for (let i = 0; i < _lc; i++) {
                const d = data[i].split(",").map(Number);
                const t = this._createTileBuffer(d);
                this._tileMaps[i].dispose();
                this._tileMaps[i] = t;
            }
            this._material.setTextureArray("tileMap", this._tileMaps);
        };
        xhr.send();
    }
    /**
     * Release associated resources
     */
    dispose() {
        this._output.dispose();
        this._material.dispose();
        this._animationMap.dispose();
        this._tileMaps.forEach((tm) => {
            tm.dispose();
        });
        this._frameMap.dispose();
    }
}
//# sourceMappingURL=spriteMap.js.map