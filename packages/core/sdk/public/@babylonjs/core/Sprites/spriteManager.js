import { Observable } from "../Misc/observable.js";
import { Vector3, TmpVectors, Matrix } from "../Maths/math.vector.js";
import { Sprite } from "./sprite.js";
import { SpriteSceneComponent } from "./spriteSceneComponent.js";
import { PickingInfo } from "../Collisions/pickingInfo.js";
import { Texture } from "../Materials/Textures/texture.js";
import { SceneComponentConstants } from "../sceneComponent.js";
import { Logger } from "../Misc/logger.js";
import { Tools } from "../Misc/tools.js";
import { WebRequest } from "../Misc/webRequest.js";
import { SpriteRenderer } from "./spriteRenderer.js";
import { EngineStore } from "../Engines/engineStore.js";

/**
 * Class used to manage multiple sprites on the same spritesheet
 * @see https://doc.babylonjs.com/features/featuresDeepDive/sprites
 */
export class SpriteManager {
    /**
     * Callback called when the manager is disposed
     */
    set onDispose(callback) {
        if (this._onDisposeObserver) {
            this.onDisposeObservable.remove(this._onDisposeObserver);
        }
        this._onDisposeObserver = this.onDisposeObservable.add(callback);
    }
    /**
     * Gets the array of sprites
     */
    get children() {
        return this.sprites;
    }
    /**
     * Gets the hosting scene
     */
    get scene() {
        return this._scene;
    }
    /**
     * Gets the capacity of the manager
     */
    get capacity() {
        return this._spriteRenderer.capacity;
    }
    /**
     * Gets or sets the spritesheet texture
     */
    get texture() {
        return this._spriteRenderer.texture;
    }
    set texture(value) {
        value.wrapU = Texture.CLAMP_ADDRESSMODE;
        value.wrapV = Texture.CLAMP_ADDRESSMODE;
        this._spriteRenderer.texture = value;
        this._textureContent = null;
    }
    /** Defines the default width of a cell in the spritesheet */
    get cellWidth() {
        return this._spriteRenderer.cellWidth;
    }
    set cellWidth(value) {
        this._spriteRenderer.cellWidth = value;
    }
    /** Defines the default height of a cell in the spritesheet */
    get cellHeight() {
        return this._spriteRenderer.cellHeight;
    }
    set cellHeight(value) {
        this._spriteRenderer.cellHeight = value;
    }
    /** Gets or sets a boolean indicating if the manager must consider scene fog when rendering */
    get fogEnabled() {
        return this._spriteRenderer.fogEnabled;
    }
    set fogEnabled(value) {
        this._spriteRenderer.fogEnabled = value;
    }
    /** Gets or sets a boolean indicating if the manager must use logarithmic depth when rendering */
    get useLogarithmicDepth() {
        return this._spriteRenderer.useLogarithmicDepth;
    }
    set useLogarithmicDepth(value) {
        this._spriteRenderer.useLogarithmicDepth = value;
    }
    /**
     * Blend mode use to render the particle, it can be any of
     * the static undefined properties provided in this class.
     * Default value is 2
     */
    get blendMode() {
        return this._spriteRenderer.blendMode;
    }
    set blendMode(blendMode) {
        this._spriteRenderer.blendMode = blendMode;
    }
    /** Disables writing to the depth buffer when rendering the sprites.
     *  It can be handy to disable depth writing when using textures without alpha channel
     *  and setting some specific blend modes.
     */
    get disableDepthWrite() {
        return this._disableDepthWrite;
    }
    set disableDepthWrite(value) {
        this._disableDepthWrite = value;
        this._spriteRenderer.disableDepthWrite = value;
    }
    /**
     * Gets or sets a boolean indicating if the renderer must render sprites with pixel perfect rendering
     * In this mode, sprites are rendered as "pixel art", which means that they appear as pixelated but remain stable when moving or when rotated or scaled.
     * Note that for this mode to work as expected, the sprite texture must use the BILINEAR sampling mode, not NEAREST!
     */
    get pixelPerfect() {
        return this._spriteRenderer.pixelPerfect;
    }
    set pixelPerfect(value) {
        this._spriteRenderer.pixelPerfect = value;
        if (value && this.texture.samplingMode !== 3) {
            this.texture.updateSamplingMode(3);
        }
    }
    /**
     * Creates a new sprite manager
     * @param name defines the manager's name
     * @param imgUrl defines the sprite sheet url
     * @param capacity defines the maximum allowed number of sprites
     * @param cellSize defines the size of a sprite cell
     * @param scene defines the hosting scene
     * @param epsilon defines the epsilon value to align texture (0.01 by default)
     * @param samplingMode defines the sampling mode to use with spritesheet
     * @param fromPacked set to false; do not alter
     * @param spriteJSON null otherwise a JSON object defining sprite sheet data; do not alter
     * @param options options used to create the SpriteManager instance
     */
    constructor(
    /** defines the manager's name */
    name, imgUrl, capacity, cellSize, scene, epsilon = 0.01, samplingMode = Texture.TRILINEAR_SAMPLINGMODE, fromPacked = false, spriteJSON = null, options) {
        this.name = name;
        /** Gets the list of sprites */
        this.sprites = [];
        /** Gets or sets the rendering group id (0 by default) */
        this.renderingGroupId = 0;
        /** Gets or sets camera layer mask */
        this.layerMask = 0x0fffffff;
        /** Gets or sets a boolean indicating if the sprites are pickable */
        this.isPickable = false;
        /**
         * Gets or sets an object used to store user defined information for the sprite manager
         */
        this.metadata = null;
        /** @internal */
        this._wasDispatched = false;
        /**
         * An event triggered when the manager is disposed.
         */
        this.onDisposeObservable = new Observable();
        this._disableDepthWrite = false;
        /** True when packed cell data from JSON file is ready*/
        this._packedAndReady = false;
        this._customUpdate = (sprite, baseSize) => {
            if (!sprite.cellRef) {
                sprite.cellIndex = 0;
            }
            const num = sprite.cellIndex;
            if (typeof num === "number" && isFinite(num) && Math.floor(num) === num) {
                sprite.cellRef = this._spriteMap[sprite.cellIndex];
            }
            sprite._xOffset = this._cellData[sprite.cellRef].frame.x / baseSize.width;
            sprite._yOffset = this._cellData[sprite.cellRef].frame.y / baseSize.height;
            sprite._xSize = this._cellData[sprite.cellRef].frame.w;
            sprite._ySize = this._cellData[sprite.cellRef].frame.h;
        };
        if (!scene) {
            scene = EngineStore.LastCreatedScene;
        }
        if (!scene._getComponent(SceneComponentConstants.NAME_SPRITE)) {
            scene._addComponent(new SpriteSceneComponent(scene));
        }
        this._fromPacked = fromPacked;
        this._scene = scene;
        const engine = this._scene.getEngine();
        this._spriteRenderer = new SpriteRenderer(engine, capacity, epsilon, scene, options?.spriteRendererOptions);
        if (cellSize.width && cellSize.height) {
            this.cellWidth = cellSize.width;
            this.cellHeight = cellSize.height;
        }
        else if (cellSize !== undefined) {
            this.cellWidth = cellSize;
            this.cellHeight = cellSize;
        }
        else {
            this._spriteRenderer = null;
            return;
        }
        this._scene.spriteManagers && this._scene.spriteManagers.push(this);
        this.uniqueId = this.scene.getUniqueId();
        if (imgUrl) {
            this.texture = new Texture(imgUrl, scene, true, false, samplingMode);
        }
        if (this._fromPacked) {
            this._makePacked(imgUrl, spriteJSON);
        }
    }
    /**
     * Returns the string "SpriteManager"
     * @returns "SpriteManager"
     */
    getClassName() {
        return "SpriteManager";
    }
    _makePacked(imgUrl, spriteJSON) {
        if (spriteJSON !== null) {
            try {
                //Get the JSON and Check its structure.  If its an array parse it if its a JSON string etc...
                let celldata;
                if (typeof spriteJSON === "string") {
                    celldata = JSON.parse(spriteJSON);
                }
                else {
                    celldata = spriteJSON;
                }
                if (celldata.frames.length) {
                    const frametemp = {};
                    for (let i = 0; i < celldata.frames.length; i++) {
                        const _f = celldata.frames[i];
                        if (typeof Object.keys(_f)[0] !== "string") {
                            throw new Error("Invalid JSON Format.  Check the frame values and make sure the name is the first parameter.");
                        }
                        const name = _f[Object.keys(_f)[0]];
                        frametemp[name] = _f;
                    }
                    celldata.frames = frametemp;
                }
                const spritemap = Reflect.ownKeys(celldata.frames);
                this._spriteMap = spritemap;
                this._packedAndReady = true;
                this._cellData = celldata.frames;
            }
            catch (e) {
                this._fromPacked = false;
                this._packedAndReady = false;
                throw new Error("Invalid JSON from string. Spritesheet managed with constant cell size.");
            }
        }
        else {
            const re = /\./g;
            let li;
            do {
                li = re.lastIndex;
                re.test(imgUrl);
            } while (re.lastIndex > 0);
            const jsonUrl = imgUrl.substring(0, li - 1) + ".json";
            const onerror = () => {
                Logger.Error("JSON ERROR: Unable to load JSON file.");
                this._fromPacked = false;
                this._packedAndReady = false;
            };
            const onload = (data) => {
                try {
                    const celldata = JSON.parse(data);
                    const spritemap = Reflect.ownKeys(celldata.frames);
                    this._spriteMap = spritemap;
                    this._packedAndReady = true;
                    this._cellData = celldata.frames;
                }
                catch (e) {
                    this._fromPacked = false;
                    this._packedAndReady = false;
                    throw new Error("Invalid JSON format. Please check documentation for format specifications.");
                }
            };
            Tools.LoadFile(jsonUrl, onload, undefined, undefined, false, onerror);
        }
    }
    _checkTextureAlpha(sprite, ray, distance, min, max) {
        if (!sprite.useAlphaForPicking || !this.texture) {
            return true;
        }
        const textureSize = this.texture.getSize();
        if (!this._textureContent) {
            this._textureContent = new Uint8Array(textureSize.width * textureSize.height * 4);
            this.texture.readPixels(0, 0, this._textureContent);
        }
        const contactPoint = TmpVectors.Vector3[0];
        contactPoint.copyFrom(ray.direction);
        contactPoint.normalize();
        contactPoint.scaleInPlace(distance);
        contactPoint.addInPlace(ray.origin);
        const contactPointU = (contactPoint.x - min.x) / (max.x - min.x);
        const contactPointV = 1.0 - (contactPoint.y - min.y) / (max.y - min.y);
        const u = (sprite._xOffset * textureSize.width + contactPointU * sprite._xSize) | 0;
        const v = (sprite._yOffset * textureSize.height + contactPointV * sprite._ySize) | 0;
        const alpha = this._textureContent[(u + v * textureSize.width) * 4 + 3];
        return alpha > 0.5;
    }
    /**
     * Intersects the sprites with a ray
     * @param ray defines the ray to intersect with
     * @param camera defines the current active camera
     * @param predicate defines a predicate used to select candidate sprites
     * @param fastCheck defines if a fast check only must be done (the first potential sprite is will be used and not the closer)
     * @returns null if no hit or a PickingInfo
     */
    intersects(ray, camera, predicate, fastCheck) {
        const count = Math.min(this.capacity, this.sprites.length);
        const min = Vector3.Zero();
        const max = Vector3.Zero();
        let distance = Number.MAX_VALUE;
        let currentSprite = null;
        const pickedPoint = TmpVectors.Vector3[0];
        const cameraSpacePosition = TmpVectors.Vector3[1];
        const cameraView = camera.getViewMatrix();
        let activeRay = ray;
        let pickedRay = ray;
        for (let index = 0; index < count; index++) {
            const sprite = this.sprites[index];
            if (!sprite) {
                continue;
            }
            if (predicate) {
                if (!predicate(sprite)) {
                    continue;
                }
            }
            else if (!sprite.isPickable) {
                continue;
            }
            Vector3.TransformCoordinatesToRef(sprite.position, cameraView, cameraSpacePosition);
            if (sprite.angle) {
                // Create a rotation matrix to rotate the ray to the sprite's rotation
                Matrix.TranslationToRef(-cameraSpacePosition.x, -cameraSpacePosition.y, 0, TmpVectors.Matrix[1]);
                Matrix.TranslationToRef(cameraSpacePosition.x, cameraSpacePosition.y, 0, TmpVectors.Matrix[2]);
                Matrix.RotationZToRef(-sprite.angle, TmpVectors.Matrix[3]);
                // inv translation x rotation x translation
                TmpVectors.Matrix[1].multiplyToRef(TmpVectors.Matrix[3], TmpVectors.Matrix[4]);
                TmpVectors.Matrix[4].multiplyToRef(TmpVectors.Matrix[2], TmpVectors.Matrix[0]);
                activeRay = ray.clone();
                Vector3.TransformCoordinatesToRef(ray.origin, TmpVectors.Matrix[0], activeRay.origin);
                Vector3.TransformNormalToRef(ray.direction, TmpVectors.Matrix[0], activeRay.direction);
            }
            else {
                activeRay = ray;
            }
            min.copyFromFloats(cameraSpacePosition.x - sprite.width / 2, cameraSpacePosition.y - sprite.height / 2, cameraSpacePosition.z);
            max.copyFromFloats(cameraSpacePosition.x + sprite.width / 2, cameraSpacePosition.y + sprite.height / 2, cameraSpacePosition.z);
            if (activeRay.intersectsBoxMinMax(min, max)) {
                const currentDistance = Vector3.Distance(cameraSpacePosition, activeRay.origin);
                if (distance > currentDistance) {
                    if (!this._checkTextureAlpha(sprite, activeRay, currentDistance, min, max)) {
                        continue;
                    }
                    pickedRay = activeRay;
                    distance = currentDistance;
                    currentSprite = sprite;
                    if (fastCheck) {
                        break;
                    }
                }
            }
        }
        if (currentSprite) {
            const result = new PickingInfo();
            cameraView.invertToRef(TmpVectors.Matrix[0]);
            result.hit = true;
            result.pickedSprite = currentSprite;
            result.distance = distance;
            // Get picked point
            const direction = TmpVectors.Vector3[2];
            direction.copyFrom(pickedRay.direction);
            direction.normalize();
            direction.scaleInPlace(distance);
            pickedRay.origin.addToRef(direction, pickedPoint);
            result.pickedPoint = Vector3.TransformCoordinates(pickedPoint, TmpVectors.Matrix[0]);
            return result;
        }
        return null;
    }
    /**
     * Intersects the sprites with a ray
     * @param ray defines the ray to intersect with
     * @param camera defines the current active camera
     * @param predicate defines a predicate used to select candidate sprites
     * @returns null if no hit or a PickingInfo array
     */
    multiIntersects(ray, camera, predicate) {
        const count = Math.min(this.capacity, this.sprites.length);
        const min = Vector3.Zero();
        const max = Vector3.Zero();
        let distance;
        const results = [];
        const pickedPoint = TmpVectors.Vector3[0].copyFromFloats(0, 0, 0);
        const cameraSpacePosition = TmpVectors.Vector3[1].copyFromFloats(0, 0, 0);
        const cameraView = camera.getViewMatrix();
        for (let index = 0; index < count; index++) {
            const sprite = this.sprites[index];
            if (!sprite) {
                continue;
            }
            if (predicate) {
                if (!predicate(sprite)) {
                    continue;
                }
            }
            else if (!sprite.isPickable) {
                continue;
            }
            Vector3.TransformCoordinatesToRef(sprite.position, cameraView, cameraSpacePosition);
            min.copyFromFloats(cameraSpacePosition.x - sprite.width / 2, cameraSpacePosition.y - sprite.height / 2, cameraSpacePosition.z);
            max.copyFromFloats(cameraSpacePosition.x + sprite.width / 2, cameraSpacePosition.y + sprite.height / 2, cameraSpacePosition.z);
            if (ray.intersectsBoxMinMax(min, max)) {
                distance = Vector3.Distance(cameraSpacePosition, ray.origin);
                if (!this._checkTextureAlpha(sprite, ray, distance, min, max)) {
                    continue;
                }
                const result = new PickingInfo();
                results.push(result);
                cameraView.invertToRef(TmpVectors.Matrix[0]);
                result.hit = true;
                result.pickedSprite = sprite;
                result.distance = distance;
                // Get picked point
                const direction = TmpVectors.Vector3[2];
                direction.copyFrom(ray.direction);
                direction.normalize();
                direction.scaleInPlace(distance);
                ray.origin.addToRef(direction, pickedPoint);
                result.pickedPoint = Vector3.TransformCoordinates(pickedPoint, TmpVectors.Matrix[0]);
            }
        }
        return results;
    }
    /**
     * Render all child sprites
     */
    render() {
        // Check
        if (this._fromPacked && (!this._packedAndReady || !this._spriteMap || !this._cellData)) {
            return;
        }
        const engine = this._scene.getEngine();
        const deltaTime = engine.getDeltaTime();
        if (this._packedAndReady) {
            this._spriteRenderer.render(this.sprites, deltaTime, this._scene.getViewMatrix(), this._scene.getProjectionMatrix(), this._customUpdate);
        }
        else {
            this._spriteRenderer.render(this.sprites, deltaTime, this._scene.getViewMatrix(), this._scene.getProjectionMatrix());
        }
    }
    /**
     * Rebuilds the manager (after a context lost, for eg)
     */
    rebuild() {
        this._spriteRenderer?.rebuild();
    }
    /**
     * Release associated resources
     */
    dispose() {
        if (this._spriteRenderer) {
            this._spriteRenderer.dispose();
            this._spriteRenderer = null;
        }
        this._textureContent = null;
        // Remove from scene
        if (this._scene.spriteManagers) {
            const index = this._scene.spriteManagers.indexOf(this);
            this._scene.spriteManagers.splice(index, 1);
        }
        // Callback
        this.onDisposeObservable.notifyObservers(this);
        this.onDisposeObservable.clear();
        this.metadata = null;
    }
    /**
     * Serializes the sprite manager to a JSON object
     * @param serializeTexture defines if the texture must be serialized as well
     * @returns the JSON object
     */
    serialize(serializeTexture = false) {
        const serializationObject = {};
        serializationObject.name = this.name;
        serializationObject.capacity = this.capacity;
        serializationObject.cellWidth = this.cellWidth;
        serializationObject.cellHeight = this.cellHeight;
        serializationObject.fogEnabled = this.fogEnabled;
        serializationObject.blendMode = this.blendMode;
        serializationObject.disableDepthWrite = this.disableDepthWrite;
        serializationObject.pixelPerfect = this.pixelPerfect;
        serializationObject.useLogarithmicDepth = this.useLogarithmicDepth;
        if (this.texture) {
            if (serializeTexture) {
                serializationObject.texture = this.texture.serialize();
            }
            else {
                serializationObject.textureUrl = this.texture.name;
                serializationObject.invertY = this.texture._invertY;
            }
        }
        serializationObject.sprites = [];
        for (const sprite of this.sprites) {
            serializationObject.sprites.push(sprite.serialize());
        }
        serializationObject.metadata = this.metadata;
        return serializationObject;
    }
    /**
     * Parses a JSON object to create a new sprite manager.
     * @param parsedManager The JSON object to parse
     * @param scene The scene to create the sprite manager
     * @param rootUrl The root url to use to load external dependencies like texture
     * @returns the new sprite manager
     */
    static Parse(parsedManager, scene, rootUrl) {
        const manager = new SpriteManager(parsedManager.name, "", parsedManager.capacity, {
            width: parsedManager.cellWidth,
            height: parsedManager.cellHeight,
        }, scene);
        if (parsedManager.fogEnabled !== undefined) {
            manager.fogEnabled = parsedManager.fogEnabled;
        }
        if (parsedManager.blendMode !== undefined) {
            manager.blendMode = parsedManager.blendMode;
        }
        if (parsedManager.disableDepthWrite !== undefined) {
            manager.disableDepthWrite = parsedManager.disableDepthWrite;
        }
        if (parsedManager.pixelPerfect !== undefined) {
            manager.pixelPerfect = parsedManager.pixelPerfect;
        }
        if (parsedManager.useLogarithmicDepth !== undefined) {
            manager.useLogarithmicDepth = parsedManager.useLogarithmicDepth;
        }
        if (parsedManager.metadata !== undefined) {
            manager.metadata = parsedManager.metadata;
        }
        if (parsedManager.texture) {
            manager.texture = Texture.Parse(parsedManager.texture, scene, rootUrl);
        }
        else if (parsedManager.textureName) {
            manager.texture = new Texture(rootUrl + parsedManager.textureUrl, scene, false, parsedManager.invertY !== undefined ? parsedManager.invertY : true);
        }
        for (const parsedSprite of parsedManager.sprites) {
            Sprite.Parse(parsedSprite, manager);
        }
        return manager;
    }
    /**
     * Creates a sprite manager from a snippet saved in a remote file
     * @param name defines the name of the sprite manager to create (can be null or empty to use the one from the json data)
     * @param url defines the url to load from
     * @param scene defines the hosting scene
     * @param rootUrl defines the root URL to use to load textures and relative dependencies
     * @returns a promise that will resolve to the new sprite manager
     */
    static ParseFromFileAsync(name, url, scene, rootUrl = "") {
        return new Promise((resolve, reject) => {
            const request = new WebRequest();
            request.addEventListener("readystatechange", () => {
                if (request.readyState == 4) {
                    if (request.status == 200) {
                        const serializationObject = JSON.parse(request.responseText);
                        const output = SpriteManager.Parse(serializationObject, scene || EngineStore.LastCreatedScene, rootUrl);
                        if (name) {
                            output.name = name;
                        }
                        resolve(output);
                    }
                    else {
                        reject("Unable to load the sprite manager");
                    }
                }
            });
            request.open("GET", url);
            request.send();
        });
    }
    /**
     * Creates a sprite manager from a snippet saved by the sprite editor
     * @param snippetId defines the snippet to load (can be set to _BLANK to create a default one)
     * @param scene defines the hosting scene
     * @param rootUrl defines the root URL to use to load textures and relative dependencies
     * @returns a promise that will resolve to the new sprite manager
     */
    static ParseFromSnippetAsync(snippetId, scene, rootUrl = "") {
        if (snippetId === "_BLANK") {
            return Promise.resolve(new SpriteManager("Default sprite manager", "//playground.babylonjs.com/textures/player.png", 500, 64, scene));
        }
        return new Promise((resolve, reject) => {
            const request = new WebRequest();
            request.addEventListener("readystatechange", () => {
                if (request.readyState == 4) {
                    if (request.status == 200) {
                        const snippet = JSON.parse(JSON.parse(request.responseText).jsonPayload);
                        const serializationObject = JSON.parse(snippet.spriteManager);
                        const output = SpriteManager.Parse(serializationObject, scene || EngineStore.LastCreatedScene, rootUrl);
                        output.snippetId = snippetId;
                        resolve(output);
                    }
                    else {
                        reject("Unable to load the snippet " + snippetId);
                    }
                }
            });
            request.open("GET", this.SnippetUrl + "/" + snippetId.replace(/#/g, "/"));
            request.send();
        });
    }
}
/** Define the Url to load snippets */
SpriteManager.SnippetUrl = `https://snippet.babylonjs.com`;
/**
 * Creates a sprite manager from a snippet saved by the sprite editor
 * @deprecated Please use ParseFromSnippetAsync instead
 * @param snippetId defines the snippet to load (can be set to _BLANK to create a default one)
 * @param scene defines the hosting scene
 * @param rootUrl defines the root URL to use to load textures and relative dependencies
 * @returns a promise that will resolve to the new sprite manager
 */
SpriteManager.CreateFromSnippetAsync = SpriteManager.ParseFromSnippetAsync;
//# sourceMappingURL=spriteManager.js.map