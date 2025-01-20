import { Tools } from "../Misc/tools.js";
import { Observable } from "../Misc/observable.js";
import { Vector3 } from "../Maths/math.vector.js";
import { Logger } from "../Misc/logger.js";
import { _WarnImport } from "../Misc/devTools.js";
import { EngineStore } from "../Engines/engineStore.js";
import { RegisterClass } from "../Misc/typeStore.js";
import { AbstractEngine } from "../Engines/abstractEngine.js";
import { _retryWithInterval } from "../Misc/timingTools.js";
/**
 * Defines a sound that can be played in the application.
 * The sound can either be an ambient track or a simple sound played in reaction to a user action.
 * @see https://doc.babylonjs.com/features/featuresDeepDive/audio/playingSoundsMusic
 */
export class Sound {
    /**
     * Does the sound loop after it finishes playing once.
     */
    get loop() {
        return this._loop;
    }
    set loop(value) {
        if (value === this._loop) {
            return;
        }
        this._loop = value;
        this.updateOptions({ loop: value });
    }
    /**
     * Gets the current time for the sound.
     */
    get currentTime() {
        if (this._htmlAudioElement) {
            return this._htmlAudioElement.currentTime;
        }
        if (AbstractEngine.audioEngine?.audioContext && (this.isPlaying || this.isPaused)) {
            // The `_currentTime` member is only updated when the sound is paused. Add the time since the last start
            // to get the actual current time.
            const timeSinceLastStart = this.isPaused ? 0 : AbstractEngine.audioEngine.audioContext.currentTime - this._startTime;
            return this._currentTime + timeSinceLastStart;
        }
        return 0;
    }
    /**
     * Does this sound enables spatial sound.
     * @see https://doc.babylonjs.com/features/featuresDeepDive/audio/playingSoundsMusic#creating-a-spatial-3d-sound
     */
    get spatialSound() {
        return this._spatialSound;
    }
    /**
     * Does this sound enables spatial sound.
     * @see https://doc.babylonjs.com/features/featuresDeepDive/audio/playingSoundsMusic#creating-a-spatial-3d-sound
     */
    set spatialSound(newValue) {
        if (newValue == this._spatialSound) {
            return;
        }
        const wasPlaying = this.isPlaying;
        this.pause();
        if (newValue) {
            this._spatialSound = newValue;
            this._updateSpatialParameters();
        }
        else {
            this._disableSpatialSound();
        }
        if (wasPlaying) {
            this.play();
        }
    }
    /**
     * Create a sound and attach it to a scene
     * @param name Name of your sound
     * @param urlOrArrayBuffer Url to the sound to load async or ArrayBuffer, it also works with MediaStreams and AudioBuffers
     * @param scene defines the scene the sound belongs to
     * @param readyToPlayCallback Provide a callback function if you'd like to load your code once the sound is ready to be played
     * @param options Objects to provide with the current available options: autoplay, loop, volume, spatialSound, maxDistance, rolloffFactor, refDistance, distanceModel, panningModel, streaming
     */
    constructor(name, urlOrArrayBuffer, scene, readyToPlayCallback = null, options) {
        /**
         * Does the sound autoplay once loaded.
         */
        this.autoplay = false;
        this._loop = false;
        /**
         * Does the sound use a custom attenuation curve to simulate the falloff
         * happening when the source gets further away from the camera.
         * @see https://doc.babylonjs.com/features/featuresDeepDive/audio/playingSoundsMusic#creating-your-own-custom-attenuation-function
         */
        this.useCustomAttenuation = false;
        /**
         * Is this sound currently played.
         */
        this.isPlaying = false;
        /**
         * Is this sound currently paused.
         */
        this.isPaused = false;
        /**
         * Define the reference distance the sound should be heard perfectly.
         * @see https://doc.babylonjs.com/features/featuresDeepDive/audio/playingSoundsMusic#creating-a-spatial-3d-sound
         */
        this.refDistance = 1;
        /**
         * Define the roll off factor of spatial sounds.
         * @see https://doc.babylonjs.com/features/featuresDeepDive/audio/playingSoundsMusic#creating-a-spatial-3d-sound
         */
        this.rolloffFactor = 1;
        /**
         * Define the max distance the sound should be heard (intensity just became 0 at this point).
         * @see https://doc.babylonjs.com/features/featuresDeepDive/audio/playingSoundsMusic#creating-a-spatial-3d-sound
         */
        this.maxDistance = 100;
        /**
         * Define the distance attenuation model the sound will follow.
         * @see https://doc.babylonjs.com/features/featuresDeepDive/audio/playingSoundsMusic#creating-a-spatial-3d-sound
         */
        this.distanceModel = "linear";
        /**
         * Gets or sets an object used to store user defined information for the sound.
         */
        this.metadata = null;
        /**
         * Observable event when the current playing sound finishes.
         */
        this.onEndedObservable = new Observable();
        this._spatialSound = false;
        this._panningModel = "equalpower";
        this._playbackRate = 1;
        this._streaming = false;
        this._startTime = 0;
        this._currentTime = 0;
        this._position = Vector3.Zero();
        this._localDirection = new Vector3(1, 0, 0);
        this._volume = 1;
        this._isReadyToPlay = false;
        this._isDirectional = false;
        // Used if you'd like to create a directional sound.
        // If not set, the sound will be omnidirectional
        this._coneInnerAngle = 360;
        this._coneOuterAngle = 360;
        this._coneOuterGain = 0;
        this._isOutputConnected = false;
        this._urlType = "Unknown";
        this.name = name;
        scene = scene || EngineStore.LastCreatedScene;
        if (!scene) {
            return;
        }
        this._scene = scene;
        Sound._SceneComponentInitialization(scene);
        this._readyToPlayCallback = readyToPlayCallback;
        // Default custom attenuation function is a linear attenuation
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        this._customAttenuationFunction = (currentVolume, currentDistance, maxDistance, refDistance, rolloffFactor) => {
            if (currentDistance < maxDistance) {
                return currentVolume * (1 - currentDistance / maxDistance);
            }
            else {
                return 0;
            }
        };
        if (options) {
            this.autoplay = options.autoplay || false;
            this._loop = options.loop || false;
            // if volume === 0, we need another way to check this option
            if (options.volume !== undefined) {
                this._volume = options.volume;
            }
            this._spatialSound = options.spatialSound ?? false;
            this.maxDistance = options.maxDistance ?? 100;
            this.useCustomAttenuation = options.useCustomAttenuation ?? false;
            this.rolloffFactor = options.rolloffFactor || 1;
            this.refDistance = options.refDistance || 1;
            this.distanceModel = options.distanceModel || "linear";
            this._playbackRate = options.playbackRate || 1;
            this._streaming = options.streaming ?? false;
            this._length = options.length;
            this._offset = options.offset;
        }
        if (AbstractEngine.audioEngine?.canUseWebAudio && AbstractEngine.audioEngine.audioContext) {
            this._soundGain = AbstractEngine.audioEngine.audioContext.createGain();
            this._soundGain.gain.value = this._volume;
            this._inputAudioNode = this._soundGain;
            this._outputAudioNode = this._soundGain;
            if (this._spatialSound) {
                this._createSpatialParameters();
            }
            this._scene.mainSoundTrack.addSound(this);
            let validParameter = true;
            // if no parameter is passed, you need to call setAudioBuffer yourself to prepare the sound
            if (urlOrArrayBuffer) {
                try {
                    if (typeof urlOrArrayBuffer === "string") {
                        this._urlType = "String";
                        this._url = urlOrArrayBuffer;
                    }
                    else if (urlOrArrayBuffer instanceof ArrayBuffer) {
                        this._urlType = "ArrayBuffer";
                    }
                    else if (urlOrArrayBuffer instanceof HTMLMediaElement) {
                        this._urlType = "MediaElement";
                    }
                    else if (urlOrArrayBuffer instanceof MediaStream) {
                        this._urlType = "MediaStream";
                    }
                    else if (urlOrArrayBuffer instanceof AudioBuffer) {
                        this._urlType = "AudioBuffer";
                    }
                    else if (Array.isArray(urlOrArrayBuffer)) {
                        this._urlType = "Array";
                    }
                    let urls = [];
                    let codecSupportedFound = false;
                    switch (this._urlType) {
                        case "MediaElement":
                            this._streaming = true;
                            this._isReadyToPlay = true;
                            this._streamingSource = AbstractEngine.audioEngine.audioContext.createMediaElementSource(urlOrArrayBuffer);
                            if (this.autoplay) {
                                this.play(0, this._offset, this._length);
                            }
                            if (this._readyToPlayCallback) {
                                this._readyToPlayCallback();
                            }
                            break;
                        case "MediaStream":
                            this._streaming = true;
                            this._isReadyToPlay = true;
                            this._streamingSource = AbstractEngine.audioEngine.audioContext.createMediaStreamSource(urlOrArrayBuffer);
                            if (this.autoplay) {
                                this.play(0, this._offset, this._length);
                            }
                            if (this._readyToPlayCallback) {
                                this._readyToPlayCallback();
                            }
                            break;
                        case "ArrayBuffer":
                            if (urlOrArrayBuffer.byteLength > 0) {
                                codecSupportedFound = true;
                                this._soundLoaded(urlOrArrayBuffer);
                            }
                            break;
                        case "AudioBuffer":
                            this._audioBufferLoaded(urlOrArrayBuffer);
                            break;
                        case "String":
                            urls.push(urlOrArrayBuffer);
                        // eslint-disable-next-line no-fallthrough
                        case "Array":
                            if (urls.length === 0) {
                                urls = urlOrArrayBuffer;
                            }
                            // If we found a supported format, we load it immediately and stop the loop
                            for (let i = 0; i < urls.length; i++) {
                                const url = urls[i];
                                codecSupportedFound =
                                    (options && options.skipCodecCheck) ||
                                        (url.indexOf(".mp3", url.length - 4) !== -1 && AbstractEngine.audioEngine.isMP3supported) ||
                                        (url.indexOf(".ogg", url.length - 4) !== -1 && AbstractEngine.audioEngine.isOGGsupported) ||
                                        url.indexOf(".wav", url.length - 4) !== -1 ||
                                        url.indexOf(".m4a", url.length - 4) !== -1 ||
                                        url.indexOf(".mp4", url.length - 4) !== -1 ||
                                        url.indexOf("blob:") !== -1;
                                if (codecSupportedFound) {
                                    // Loading sound
                                    if (!this._streaming) {
                                        this._scene._loadFile(url, (data) => {
                                            this._soundLoaded(data);
                                        }, undefined, true, true, (exception) => {
                                            if (exception) {
                                                Logger.Error("XHR " + exception.status + " error on: " + url + ".");
                                            }
                                            Logger.Error("Sound creation aborted.");
                                            this._scene.mainSoundTrack.removeSound(this);
                                        });
                                    }
                                    // Streaming sound using HTML5 Audio tag
                                    else {
                                        this._htmlAudioElement = new Audio(url);
                                        this._htmlAudioElement.controls = false;
                                        this._htmlAudioElement.loop = this.loop;
                                        Tools.SetCorsBehavior(url, this._htmlAudioElement);
                                        this._htmlAudioElement.preload = "auto";
                                        this._htmlAudioElement.addEventListener("canplaythrough", () => {
                                            this._isReadyToPlay = true;
                                            if (this.autoplay) {
                                                this.play(0, this._offset, this._length);
                                            }
                                            if (this._readyToPlayCallback) {
                                                this._readyToPlayCallback();
                                            }
                                        }, { once: true });
                                        document.body.appendChild(this._htmlAudioElement);
                                        this._htmlAudioElement.load();
                                    }
                                    break;
                                }
                            }
                            break;
                        default:
                            validParameter = false;
                            break;
                    }
                    if (!validParameter) {
                        Logger.Error("Parameter must be a URL to the sound, an Array of URLs (.mp3 & .ogg) or an ArrayBuffer of the sound.");
                    }
                    else {
                        if (!codecSupportedFound) {
                            this._isReadyToPlay = true;
                            // Simulating a ready to play event to avoid breaking code path
                            if (this._readyToPlayCallback) {
                                setTimeout(() => {
                                    if (this._readyToPlayCallback) {
                                        this._readyToPlayCallback();
                                    }
                                }, 1000);
                            }
                        }
                    }
                }
                catch (ex) {
                    Logger.Error("Unexpected error. Sound creation aborted.");
                    this._scene.mainSoundTrack.removeSound(this);
                }
            }
        }
        else {
            // Adding an empty sound to avoid breaking audio calls for non Web Audio browsers
            this._scene.mainSoundTrack.addSound(this);
            if (AbstractEngine.audioEngine && !AbstractEngine.audioEngine.WarnedWebAudioUnsupported) {
                Logger.Error("Web Audio is not supported by your browser.");
                AbstractEngine.audioEngine.WarnedWebAudioUnsupported = true;
            }
            // Simulating a ready to play event to avoid breaking code for non web audio browsers
            if (this._readyToPlayCallback) {
                setTimeout(() => {
                    if (this._readyToPlayCallback) {
                        this._readyToPlayCallback();
                    }
                }, 1000);
            }
        }
    }
    /**
     * Release the sound and its associated resources
     */
    dispose() {
        if (AbstractEngine.audioEngine?.canUseWebAudio) {
            if (this.isPlaying) {
                this.stop();
            }
            this._isReadyToPlay = false;
            if (this.soundTrackId === -1) {
                this._scene.mainSoundTrack.removeSound(this);
            }
            else if (this._scene.soundTracks) {
                this._scene.soundTracks[this.soundTrackId].removeSound(this);
            }
            if (this._soundGain) {
                this._soundGain.disconnect();
                this._soundGain = null;
            }
            if (this._soundPanner) {
                this._soundPanner.disconnect();
                this._soundPanner = null;
            }
            if (this._soundSource) {
                this._soundSource.disconnect();
                this._soundSource = null;
            }
            this._audioBuffer = null;
            if (this._htmlAudioElement) {
                this._htmlAudioElement.pause();
                this._htmlAudioElement.src = "";
                document.body.removeChild(this._htmlAudioElement);
                this._htmlAudioElement = null;
            }
            if (this._streamingSource) {
                this._streamingSource.disconnect();
                this._streamingSource = null;
            }
            if (this._connectedTransformNode && this._registerFunc) {
                this._connectedTransformNode.unregisterAfterWorldMatrixUpdate(this._registerFunc);
                this._connectedTransformNode = null;
            }
            this._clearTimeoutsAndObservers();
        }
    }
    /**
     * Gets if the sounds is ready to be played or not.
     * @returns true if ready, otherwise false
     */
    isReady() {
        return this._isReadyToPlay;
    }
    /**
     * Get the current class name.
     * @returns current class name
     */
    getClassName() {
        return "Sound";
    }
    _audioBufferLoaded(buffer) {
        if (!AbstractEngine.audioEngine?.audioContext) {
            return;
        }
        this._audioBuffer = buffer;
        this._isReadyToPlay = true;
        if (this.autoplay) {
            this.play(0, this._offset, this._length);
        }
        if (this._readyToPlayCallback) {
            this._readyToPlayCallback();
        }
    }
    _soundLoaded(audioData) {
        if (!AbstractEngine.audioEngine?.audioContext) {
            return;
        }
        AbstractEngine.audioEngine.audioContext.decodeAudioData(audioData, (buffer) => {
            this._audioBufferLoaded(buffer);
        }, (err) => {
            Logger.Error("Error while decoding audio data for: " + this.name + " / Error: " + err);
        });
    }
    /**
     * Sets the data of the sound from an audiobuffer
     * @param audioBuffer The audioBuffer containing the data
     */
    setAudioBuffer(audioBuffer) {
        if (AbstractEngine.audioEngine?.canUseWebAudio) {
            this._audioBuffer = audioBuffer;
            this._isReadyToPlay = true;
        }
    }
    /**
     * Updates the current sounds options such as maxdistance, loop...
     * @param options A JSON object containing values named as the object properties
     */
    updateOptions(options) {
        if (options) {
            this.loop = options.loop ?? this.loop;
            this.maxDistance = options.maxDistance ?? this.maxDistance;
            this.useCustomAttenuation = options.useCustomAttenuation ?? this.useCustomAttenuation;
            this.rolloffFactor = options.rolloffFactor ?? this.rolloffFactor;
            this.refDistance = options.refDistance ?? this.refDistance;
            this.distanceModel = options.distanceModel ?? this.distanceModel;
            this._playbackRate = options.playbackRate ?? this._playbackRate;
            this._length = options.length ?? undefined;
            this.spatialSound = options.spatialSound ?? this._spatialSound;
            this._setOffset(options.offset ?? undefined);
            this.setVolume(options.volume ?? this._volume);
            this._updateSpatialParameters();
            if (this.isPlaying) {
                if (this._streaming && this._htmlAudioElement) {
                    this._htmlAudioElement.playbackRate = this._playbackRate;
                    if (this._htmlAudioElement.loop !== this.loop) {
                        this._htmlAudioElement.loop = this.loop;
                    }
                }
                else {
                    if (this._soundSource) {
                        this._soundSource.playbackRate.value = this._playbackRate;
                        if (this._soundSource.loop !== this.loop) {
                            this._soundSource.loop = this.loop;
                        }
                        if (this._offset !== undefined && this._soundSource.loopStart !== this._offset) {
                            this._soundSource.loopStart = this._offset;
                        }
                        if (this._length !== undefined && this._length !== this._soundSource.loopEnd) {
                            this._soundSource.loopEnd = (this._offset | 0) + this._length;
                        }
                    }
                }
            }
        }
    }
    _createSpatialParameters() {
        if (AbstractEngine.audioEngine?.canUseWebAudio && AbstractEngine.audioEngine.audioContext) {
            if (this._scene.headphone) {
                this._panningModel = "HRTF";
            }
            this._soundPanner = this._soundPanner ?? AbstractEngine.audioEngine.audioContext.createPanner();
            if (this._soundPanner && this._outputAudioNode) {
                this._updateSpatialParameters();
                this._soundPanner.connect(this._outputAudioNode);
                this._inputAudioNode = this._soundPanner;
            }
        }
    }
    _disableSpatialSound() {
        if (!this._spatialSound) {
            return;
        }
        this._inputAudioNode = this._soundGain;
        this._soundPanner?.disconnect();
        this._soundPanner = null;
        this._spatialSound = false;
    }
    _updateSpatialParameters() {
        if (!this._spatialSound) {
            return;
        }
        if (this._soundPanner) {
            if (this.useCustomAttenuation) {
                // Tricks to disable in a way embedded Web Audio attenuation
                this._soundPanner.distanceModel = "linear";
                this._soundPanner.maxDistance = Number.MAX_VALUE;
                this._soundPanner.refDistance = 1;
                this._soundPanner.rolloffFactor = 1;
                this._soundPanner.panningModel = this._panningModel;
            }
            else {
                this._soundPanner.distanceModel = this.distanceModel;
                this._soundPanner.maxDistance = this.maxDistance;
                this._soundPanner.refDistance = this.refDistance;
                this._soundPanner.rolloffFactor = this.rolloffFactor;
                this._soundPanner.panningModel = this._panningModel;
            }
        }
        else {
            this._createSpatialParameters();
        }
    }
    /**
     * Switch the panning model to HRTF:
     * Renders a stereo output of higher quality than equalpower — it uses a convolution with measured impulse responses from human subjects.
     * @see https://doc.babylonjs.com/features/featuresDeepDive/audio/playingSoundsMusic#creating-a-spatial-3d-sound
     */
    switchPanningModelToHRTF() {
        this._panningModel = "HRTF";
        this._switchPanningModel();
    }
    /**
     * Switch the panning model to Equal Power:
     * Represents the equal-power panning algorithm, generally regarded as simple and efficient. equalpower is the default value.
     * @see https://doc.babylonjs.com/features/featuresDeepDive/audio/playingSoundsMusic#creating-a-spatial-3d-sound
     */
    switchPanningModelToEqualPower() {
        this._panningModel = "equalpower";
        this._switchPanningModel();
    }
    _switchPanningModel() {
        if (AbstractEngine.audioEngine?.canUseWebAudio && this._spatialSound && this._soundPanner) {
            this._soundPanner.panningModel = this._panningModel;
        }
    }
    /**
     * Connect this sound to a sound track audio node like gain...
     * @param soundTrackAudioNode the sound track audio node to connect to
     */
    connectToSoundTrackAudioNode(soundTrackAudioNode) {
        if (AbstractEngine.audioEngine?.canUseWebAudio && this._outputAudioNode) {
            if (this._isOutputConnected) {
                this._outputAudioNode.disconnect();
            }
            this._outputAudioNode.connect(soundTrackAudioNode);
            this._isOutputConnected = true;
        }
    }
    /**
     * Transform this sound into a directional source
     * @param coneInnerAngle Size of the inner cone in degree
     * @param coneOuterAngle Size of the outer cone in degree
     * @param coneOuterGain Volume of the sound outside the outer cone (between 0.0 and 1.0)
     */
    setDirectionalCone(coneInnerAngle, coneOuterAngle, coneOuterGain) {
        if (coneOuterAngle < coneInnerAngle) {
            Logger.Error("setDirectionalCone(): outer angle of the cone must be superior or equal to the inner angle.");
            return;
        }
        this._coneInnerAngle = coneInnerAngle;
        this._coneOuterAngle = coneOuterAngle;
        this._coneOuterGain = coneOuterGain;
        this._isDirectional = true;
        if (this.isPlaying && this.loop) {
            this.stop();
            this.play(0, this._offset, this._length);
        }
    }
    /**
     * Gets or sets the inner angle for the directional cone.
     */
    get directionalConeInnerAngle() {
        return this._coneInnerAngle;
    }
    /**
     * Gets or sets the inner angle for the directional cone.
     */
    set directionalConeInnerAngle(value) {
        if (value != this._coneInnerAngle) {
            if (this._coneOuterAngle < value) {
                Logger.Error("directionalConeInnerAngle: outer angle of the cone must be superior or equal to the inner angle.");
                return;
            }
            this._coneInnerAngle = value;
            if (AbstractEngine.audioEngine?.canUseWebAudio && this._spatialSound && this._soundPanner) {
                this._soundPanner.coneInnerAngle = this._coneInnerAngle;
            }
        }
    }
    /**
     * Gets or sets the outer angle for the directional cone.
     */
    get directionalConeOuterAngle() {
        return this._coneOuterAngle;
    }
    /**
     * Gets or sets the outer angle for the directional cone.
     */
    set directionalConeOuterAngle(value) {
        if (value != this._coneOuterAngle) {
            if (value < this._coneInnerAngle) {
                Logger.Error("directionalConeOuterAngle: outer angle of the cone must be superior or equal to the inner angle.");
                return;
            }
            this._coneOuterAngle = value;
            if (AbstractEngine.audioEngine?.canUseWebAudio && this._spatialSound && this._soundPanner) {
                this._soundPanner.coneOuterAngle = this._coneOuterAngle;
            }
        }
    }
    /**
     * Sets the position of the emitter if spatial sound is enabled
     * @param newPosition Defines the new position
     */
    setPosition(newPosition) {
        if (newPosition.equals(this._position)) {
            return;
        }
        this._position.copyFrom(newPosition);
        if (AbstractEngine.audioEngine?.canUseWebAudio &&
            this._spatialSound &&
            this._soundPanner &&
            !isNaN(this._position.x) &&
            !isNaN(this._position.y) &&
            !isNaN(this._position.z)) {
            this._soundPanner.positionX.value = this._position.x;
            this._soundPanner.positionY.value = this._position.y;
            this._soundPanner.positionZ.value = this._position.z;
        }
    }
    /**
     * Sets the local direction of the emitter if spatial sound is enabled
     * @param newLocalDirection Defines the new local direction
     */
    setLocalDirectionToMesh(newLocalDirection) {
        this._localDirection = newLocalDirection;
        if (AbstractEngine.audioEngine?.canUseWebAudio && this._connectedTransformNode && this.isPlaying) {
            this._updateDirection();
        }
    }
    _updateDirection() {
        if (!this._connectedTransformNode || !this._soundPanner) {
            return;
        }
        const mat = this._connectedTransformNode.getWorldMatrix();
        const direction = Vector3.TransformNormal(this._localDirection, mat);
        direction.normalize();
        this._soundPanner.orientationX.value = direction.x;
        this._soundPanner.orientationY.value = direction.y;
        this._soundPanner.orientationZ.value = direction.z;
    }
    /** @internal */
    updateDistanceFromListener() {
        if (AbstractEngine.audioEngine?.canUseWebAudio && this._connectedTransformNode && this.useCustomAttenuation && this._soundGain && this._scene.activeCamera) {
            const distance = this._scene.audioListenerPositionProvider
                ? this._connectedTransformNode.position.subtract(this._scene.audioListenerPositionProvider()).length()
                : this._connectedTransformNode.getDistanceToCamera(this._scene.activeCamera);
            this._soundGain.gain.value = this._customAttenuationFunction(this._volume, distance, this.maxDistance, this.refDistance, this.rolloffFactor);
        }
    }
    /**
     * Sets a new custom attenuation function for the sound.
     * @param callback Defines the function used for the attenuation
     * @see https://doc.babylonjs.com/features/featuresDeepDive/audio/playingSoundsMusic#creating-your-own-custom-attenuation-function
     */
    setAttenuationFunction(callback) {
        this._customAttenuationFunction = callback;
    }
    /**
     * Play the sound
     * @param time (optional) Start the sound after X seconds. Start immediately (0) by default.
     * @param offset (optional) Start the sound at a specific time in seconds
     * @param length (optional) Sound duration (in seconds)
     */
    play(time, offset, length) {
        if (this._isReadyToPlay && this._scene.audioEnabled && AbstractEngine.audioEngine?.audioContext) {
            try {
                this._clearTimeoutsAndObservers();
                let startTime = time ? AbstractEngine.audioEngine?.audioContext.currentTime + time : AbstractEngine.audioEngine?.audioContext.currentTime;
                if (!this._soundSource || !this._streamingSource) {
                    if (this._spatialSound && this._soundPanner) {
                        if (!isNaN(this._position.x) && !isNaN(this._position.y) && !isNaN(this._position.z)) {
                            this._soundPanner.positionX.value = this._position.x;
                            this._soundPanner.positionY.value = this._position.y;
                            this._soundPanner.positionZ.value = this._position.z;
                        }
                        if (this._isDirectional) {
                            this._soundPanner.coneInnerAngle = this._coneInnerAngle;
                            this._soundPanner.coneOuterAngle = this._coneOuterAngle;
                            this._soundPanner.coneOuterGain = this._coneOuterGain;
                            if (this._connectedTransformNode) {
                                this._updateDirection();
                            }
                            else {
                                this._soundPanner.setOrientation(this._localDirection.x, this._localDirection.y, this._localDirection.z);
                            }
                        }
                    }
                }
                if (this._streaming) {
                    if (!this._streamingSource && this._htmlAudioElement) {
                        this._streamingSource = AbstractEngine.audioEngine.audioContext.createMediaElementSource(this._htmlAudioElement);
                        this._htmlAudioElement.onended = () => {
                            this._onended();
                        };
                        this._htmlAudioElement.playbackRate = this._playbackRate;
                    }
                    if (this._streamingSource) {
                        this._streamingSource.disconnect();
                        if (this._inputAudioNode) {
                            this._streamingSource.connect(this._inputAudioNode);
                        }
                    }
                    if (this._htmlAudioElement) {
                        // required to manage properly the new suspended default state of Chrome
                        // When the option 'streaming: true' is used, we need first to wait for
                        // the audio engine to be unlocked by a user gesture before trying to play
                        // an HTML Audio element
                        const tryToPlay = () => {
                            if (AbstractEngine.audioEngine?.unlocked) {
                                if (!this._htmlAudioElement) {
                                    return;
                                }
                                this._htmlAudioElement.currentTime = offset ?? 0;
                                const playPromise = this._htmlAudioElement.play();
                                // In browsers that don’t yet support this functionality,
                                // playPromise won’t be defined.
                                if (playPromise !== undefined) {
                                    playPromise.catch(() => {
                                        // Automatic playback failed.
                                        // Waiting for the audio engine to be unlocked by user click on unmute
                                        AbstractEngine.audioEngine?.lock();
                                        if (this.loop || this.autoplay) {
                                            this._audioUnlockedObserver = AbstractEngine.audioEngine?.onAudioUnlockedObservable.addOnce(() => {
                                                tryToPlay();
                                            });
                                        }
                                    });
                                }
                            }
                            else {
                                if (this.loop || this.autoplay) {
                                    this._audioUnlockedObserver = AbstractEngine.audioEngine?.onAudioUnlockedObservable.addOnce(() => {
                                        tryToPlay();
                                    });
                                }
                            }
                        };
                        tryToPlay();
                    }
                }
                else {
                    const tryToPlay = () => {
                        if (AbstractEngine.audioEngine?.audioContext) {
                            length = length || this._length;
                            if (offset !== undefined) {
                                this._setOffset(offset);
                            }
                            if (this._soundSource) {
                                const oldSource = this._soundSource;
                                oldSource.onended = () => {
                                    oldSource.disconnect();
                                };
                            }
                            this._soundSource = AbstractEngine.audioEngine?.audioContext.createBufferSource();
                            if (this._soundSource && this._inputAudioNode) {
                                this._soundSource.buffer = this._audioBuffer;
                                this._soundSource.connect(this._inputAudioNode);
                                this._soundSource.loop = this.loop;
                                if (offset !== undefined) {
                                    this._soundSource.loopStart = offset;
                                }
                                if (length !== undefined) {
                                    this._soundSource.loopEnd = (offset | 0) + length;
                                }
                                this._soundSource.playbackRate.value = this._playbackRate;
                                this._soundSource.onended = () => {
                                    this._onended();
                                };
                                startTime = time ? AbstractEngine.audioEngine?.audioContext.currentTime + time : AbstractEngine.audioEngine.audioContext.currentTime;
                                const actualOffset = ((this.isPaused ? this.currentTime : 0) + (this._offset ?? 0)) % this._soundSource.buffer.duration;
                                this._soundSource.start(startTime, actualOffset, this.loop ? undefined : length);
                            }
                        }
                    };
                    if (AbstractEngine.audioEngine?.audioContext.state === "suspended") {
                        // Wait a bit for FF as context seems late to be ready.
                        this._tryToPlayTimeout = setTimeout(() => {
                            if (AbstractEngine.audioEngine?.audioContext.state === "suspended") {
                                // Automatic playback failed.
                                // Waiting for the audio engine to be unlocked by user click on unmute
                                AbstractEngine.audioEngine.lock();
                                if (this.loop || this.autoplay) {
                                    this._audioUnlockedObserver = AbstractEngine.audioEngine.onAudioUnlockedObservable.addOnce(() => {
                                        tryToPlay();
                                    });
                                }
                            }
                            else {
                                tryToPlay();
                            }
                        }, 500);
                    }
                    else {
                        tryToPlay();
                    }
                }
                this._startTime = startTime;
                this.isPlaying = true;
                this.isPaused = false;
            }
            catch (ex) {
                Logger.Error("Error while trying to play audio: " + this.name + ", " + ex.message);
            }
        }
    }
    _onended() {
        this.isPlaying = false;
        this._startTime = 0;
        this._currentTime = 0;
        if (this.onended) {
            this.onended();
        }
        this.onEndedObservable.notifyObservers(this);
    }
    /**
     * Stop the sound
     * @param time (optional) Stop the sound after X seconds. Stop immediately (0) by default.
     */
    stop(time) {
        if (this.isPlaying) {
            this._clearTimeoutsAndObservers();
            if (this._streaming) {
                if (this._htmlAudioElement) {
                    this._htmlAudioElement.pause();
                    // Test needed for Firefox or it will generate an Invalid State Error
                    if (this._htmlAudioElement.currentTime > 0) {
                        this._htmlAudioElement.currentTime = 0;
                    }
                }
                else {
                    this._streamingSource?.disconnect();
                }
                this.isPlaying = false;
            }
            else if (AbstractEngine.audioEngine?.audioContext && this._soundSource) {
                const stopTime = time ? AbstractEngine.audioEngine.audioContext.currentTime + time : undefined;
                this._soundSource.onended = () => {
                    this.isPlaying = false;
                    this.isPaused = false;
                    this._startTime = 0;
                    this._currentTime = 0;
                    if (this._soundSource) {
                        this._soundSource.onended = () => void 0;
                    }
                    this._onended();
                };
                this._soundSource.stop(stopTime);
            }
            else {
                this.isPlaying = false;
            }
        }
        else if (this.isPaused) {
            this.isPaused = false;
            this._startTime = 0;
            this._currentTime = 0;
        }
    }
    /**
     * Put the sound in pause
     */
    pause() {
        if (this.isPlaying) {
            this._clearTimeoutsAndObservers();
            if (this._streaming) {
                if (this._htmlAudioElement) {
                    this._htmlAudioElement.pause();
                }
                else {
                    this._streamingSource?.disconnect();
                }
                this.isPlaying = false;
                this.isPaused = true;
            }
            else if (AbstractEngine.audioEngine?.audioContext && this._soundSource) {
                this._soundSource.onended = () => void 0;
                this._soundSource.stop();
                this.isPlaying = false;
                this.isPaused = true;
                this._currentTime += AbstractEngine.audioEngine.audioContext.currentTime - this._startTime;
            }
        }
    }
    /**
     * Sets a dedicated volume for this sounds
     * @param newVolume Define the new volume of the sound
     * @param time Define time for gradual change to new volume
     */
    setVolume(newVolume, time) {
        if (AbstractEngine.audioEngine?.canUseWebAudio && this._soundGain) {
            if (time && AbstractEngine.audioEngine.audioContext) {
                this._soundGain.gain.cancelScheduledValues(AbstractEngine.audioEngine.audioContext.currentTime);
                this._soundGain.gain.setValueAtTime(this._soundGain.gain.value, AbstractEngine.audioEngine.audioContext.currentTime);
                this._soundGain.gain.linearRampToValueAtTime(newVolume, AbstractEngine.audioEngine.audioContext.currentTime + time);
            }
            else {
                this._soundGain.gain.value = newVolume;
            }
        }
        this._volume = newVolume;
    }
    /**
     * Set the sound play back rate
     * @param newPlaybackRate Define the playback rate the sound should be played at
     */
    setPlaybackRate(newPlaybackRate) {
        this._playbackRate = newPlaybackRate;
        if (this.isPlaying) {
            if (this._streaming && this._htmlAudioElement) {
                this._htmlAudioElement.playbackRate = this._playbackRate;
            }
            else if (this._soundSource) {
                this._soundSource.playbackRate.value = this._playbackRate;
            }
        }
    }
    /**
     * Gets the sound play back rate.
     * @returns the  play back rate of the sound
     */
    getPlaybackRate() {
        return this._playbackRate;
    }
    /**
     * Gets the volume of the sound.
     * @returns the volume of the sound
     */
    getVolume() {
        return this._volume;
    }
    /**
     * Attach the sound to a dedicated mesh
     * @param transformNode The transform node to connect the sound with
     * @see https://doc.babylonjs.com/features/featuresDeepDive/audio/playingSoundsMusic#attaching-a-sound-to-a-mesh
     */
    attachToMesh(transformNode) {
        if (this._connectedTransformNode && this._registerFunc) {
            this._connectedTransformNode.unregisterAfterWorldMatrixUpdate(this._registerFunc);
            this._registerFunc = null;
        }
        this._connectedTransformNode = transformNode;
        if (!this._spatialSound) {
            this._spatialSound = true;
            this._createSpatialParameters();
            if (this.isPlaying && this.loop) {
                this.stop();
                this.play(0, this._offset, this._length);
            }
        }
        this._onRegisterAfterWorldMatrixUpdate(this._connectedTransformNode);
        this._registerFunc = (transformNode) => this._onRegisterAfterWorldMatrixUpdate(transformNode);
        this._connectedTransformNode.registerAfterWorldMatrixUpdate(this._registerFunc);
    }
    /**
     * Detach the sound from the previously attached mesh
     * @see https://doc.babylonjs.com/features/featuresDeepDive/audio/playingSoundsMusic#attaching-a-sound-to-a-mesh
     */
    detachFromMesh() {
        if (this._connectedTransformNode && this._registerFunc) {
            this._connectedTransformNode.unregisterAfterWorldMatrixUpdate(this._registerFunc);
            this._registerFunc = null;
            this._connectedTransformNode = null;
        }
    }
    _onRegisterAfterWorldMatrixUpdate(node) {
        if (!node.getBoundingInfo) {
            this.setPosition(node.absolutePosition);
        }
        else {
            const mesh = node;
            const boundingInfo = mesh.getBoundingInfo();
            this.setPosition(boundingInfo.boundingSphere.centerWorld);
        }
        if (AbstractEngine.audioEngine?.canUseWebAudio && this._isDirectional && this.isPlaying) {
            this._updateDirection();
        }
    }
    /**
     * Clone the current sound in the scene.
     * @returns the new sound clone
     */
    clone() {
        if (!this._streaming) {
            const setBufferAndRun = () => {
                _retryWithInterval(() => this._isReadyToPlay, () => {
                    clonedSound._audioBuffer = this.getAudioBuffer();
                    clonedSound._isReadyToPlay = true;
                    if (clonedSound.autoplay) {
                        clonedSound.play(0, this._offset, this._length);
                    }
                }, undefined, 300);
            };
            const currentOptions = {
                autoplay: this.autoplay,
                loop: this.loop,
                volume: this._volume,
                spatialSound: this._spatialSound,
                maxDistance: this.maxDistance,
                useCustomAttenuation: this.useCustomAttenuation,
                rolloffFactor: this.rolloffFactor,
                refDistance: this.refDistance,
                distanceModel: this.distanceModel,
            };
            const clonedSound = new Sound(this.name + "_cloned", new ArrayBuffer(0), this._scene, null, currentOptions);
            if (this.useCustomAttenuation) {
                clonedSound.setAttenuationFunction(this._customAttenuationFunction);
            }
            clonedSound.setPosition(this._position);
            clonedSound.setPlaybackRate(this._playbackRate);
            setBufferAndRun();
            return clonedSound;
        }
        // Can't clone a streaming sound
        else {
            return null;
        }
    }
    /**
     * Gets the current underlying audio buffer containing the data
     * @returns the audio buffer
     */
    getAudioBuffer() {
        return this._audioBuffer;
    }
    /**
     * Gets the WebAudio AudioBufferSourceNode, lets you keep track of and stop instances of this Sound.
     * @returns the source node
     */
    getSoundSource() {
        return this._soundSource;
    }
    /**
     * Gets the WebAudio GainNode, gives you precise control over the gain of instances of this Sound.
     * @returns the gain node
     */
    getSoundGain() {
        return this._soundGain;
    }
    /**
     * Serializes the Sound in a JSON representation
     * @returns the JSON representation of the sound
     */
    serialize() {
        const serializationObject = {
            name: this.name,
            url: this._url,
            autoplay: this.autoplay,
            loop: this.loop,
            volume: this._volume,
            spatialSound: this._spatialSound,
            maxDistance: this.maxDistance,
            rolloffFactor: this.rolloffFactor,
            refDistance: this.refDistance,
            distanceModel: this.distanceModel,
            playbackRate: this._playbackRate,
            panningModel: this._panningModel,
            soundTrackId: this.soundTrackId,
            metadata: this.metadata,
        };
        if (this._spatialSound) {
            if (this._connectedTransformNode) {
                serializationObject.connectedMeshId = this._connectedTransformNode.id;
            }
            serializationObject.position = this._position.asArray();
            serializationObject.refDistance = this.refDistance;
            serializationObject.distanceModel = this.distanceModel;
            serializationObject.isDirectional = this._isDirectional;
            serializationObject.localDirectionToMesh = this._localDirection.asArray();
            serializationObject.coneInnerAngle = this._coneInnerAngle;
            serializationObject.coneOuterAngle = this._coneOuterAngle;
            serializationObject.coneOuterGain = this._coneOuterGain;
        }
        return serializationObject;
    }
    /**
     * Parse a JSON representation of a sound to instantiate in a given scene
     * @param parsedSound Define the JSON representation of the sound (usually coming from the serialize method)
     * @param scene Define the scene the new parsed sound should be created in
     * @param rootUrl Define the rooturl of the load in case we need to fetch relative dependencies
     * @param sourceSound Define a sound place holder if do not need to instantiate a new one
     * @returns the newly parsed sound
     */
    static Parse(parsedSound, scene, rootUrl, sourceSound) {
        const soundName = parsedSound.name;
        let soundUrl;
        if (parsedSound.url) {
            soundUrl = rootUrl + parsedSound.url;
        }
        else {
            soundUrl = rootUrl + soundName;
        }
        const options = {
            autoplay: parsedSound.autoplay,
            loop: parsedSound.loop,
            volume: parsedSound.volume,
            spatialSound: parsedSound.spatialSound,
            maxDistance: parsedSound.maxDistance,
            rolloffFactor: parsedSound.rolloffFactor,
            refDistance: parsedSound.refDistance,
            distanceModel: parsedSound.distanceModel,
            playbackRate: parsedSound.playbackRate,
        };
        let newSound;
        if (!sourceSound) {
            newSound = new Sound(soundName, soundUrl, scene, () => {
                scene.removePendingData(newSound);
            }, options);
            scene.addPendingData(newSound);
        }
        else {
            const setBufferAndRun = () => {
                _retryWithInterval(() => sourceSound._isReadyToPlay, () => {
                    newSound._audioBuffer = sourceSound.getAudioBuffer();
                    newSound._isReadyToPlay = true;
                    if (newSound.autoplay) {
                        newSound.play(0, newSound._offset, newSound._length);
                    }
                }, undefined, 300);
            };
            newSound = new Sound(soundName, new ArrayBuffer(0), scene, null, options);
            setBufferAndRun();
        }
        if (parsedSound.position) {
            const soundPosition = Vector3.FromArray(parsedSound.position);
            newSound.setPosition(soundPosition);
        }
        if (parsedSound.isDirectional) {
            newSound.setDirectionalCone(parsedSound.coneInnerAngle || 360, parsedSound.coneOuterAngle || 360, parsedSound.coneOuterGain || 0);
            if (parsedSound.localDirectionToMesh) {
                const localDirectionToMesh = Vector3.FromArray(parsedSound.localDirectionToMesh);
                newSound.setLocalDirectionToMesh(localDirectionToMesh);
            }
        }
        if (parsedSound.connectedMeshId) {
            const connectedMesh = scene.getMeshById(parsedSound.connectedMeshId);
            if (connectedMesh) {
                newSound.attachToMesh(connectedMesh);
            }
        }
        if (parsedSound.metadata) {
            newSound.metadata = parsedSound.metadata;
        }
        return newSound;
    }
    _setOffset(value) {
        if (this._offset === value) {
            return;
        }
        if (this.isPaused) {
            this.stop();
            this.isPaused = false;
        }
        this._offset = value;
    }
    _clearTimeoutsAndObservers() {
        if (this._tryToPlayTimeout) {
            clearTimeout(this._tryToPlayTimeout);
            this._tryToPlayTimeout = null;
        }
        if (this._audioUnlockedObserver) {
            AbstractEngine.audioEngine?.onAudioUnlockedObservable.remove(this._audioUnlockedObserver);
            this._audioUnlockedObserver = null;
        }
    }
}
/**
 * @internal
 */
Sound._SceneComponentInitialization = (_) => {
    throw _WarnImport("AudioSceneComponent");
};
// Register Class Name
RegisterClass("BABYLON.Sound", Sound);
//# sourceMappingURL=sound.js.map