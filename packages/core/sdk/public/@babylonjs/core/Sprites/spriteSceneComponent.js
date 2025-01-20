import { Observable } from "../Misc/observable.js";
import { Scene } from "../scene.js";
import { CreatePickingRayInCameraSpace, CreatePickingRayInCameraSpaceToRef, Ray } from "../Culling/ray.core.js";
import { PickingInfo } from "../Collisions/pickingInfo.js";
import { SceneComponentConstants } from "../sceneComponent.js";
import { ActionEvent } from "../Actions/actionEvent.js";

Scene.prototype._internalPickSprites = function (ray, predicate, fastCheck, camera) {
    if (!PickingInfo) {
        return null;
    }
    let pickingInfo = null;
    if (!camera) {
        if (!this.activeCamera) {
            return null;
        }
        camera = this.activeCamera;
    }
    if (this.spriteManagers && this.spriteManagers.length > 0) {
        for (let spriteIndex = 0; spriteIndex < this.spriteManagers.length; spriteIndex++) {
            const spriteManager = this.spriteManagers[spriteIndex];
            if (!spriteManager.isPickable) {
                continue;
            }
            const result = spriteManager.intersects(ray, camera, predicate, fastCheck);
            if (!result || !result.hit) {
                continue;
            }
            if (!fastCheck && pickingInfo != null && result.distance >= pickingInfo.distance) {
                continue;
            }
            pickingInfo = result;
            if (fastCheck) {
                break;
            }
        }
    }
    return pickingInfo || new PickingInfo();
};
Scene.prototype._internalMultiPickSprites = function (ray, predicate, camera) {
    if (!PickingInfo) {
        return null;
    }
    let pickingInfos = [];
    if (!camera) {
        if (!this.activeCamera) {
            return null;
        }
        camera = this.activeCamera;
    }
    if (this.spriteManagers && this.spriteManagers.length > 0) {
        for (let spriteIndex = 0; spriteIndex < this.spriteManagers.length; spriteIndex++) {
            const spriteManager = this.spriteManagers[spriteIndex];
            if (!spriteManager.isPickable) {
                continue;
            }
            const results = spriteManager.multiIntersects(ray, camera, predicate);
            if (results !== null) {
                pickingInfos = pickingInfos.concat(results);
            }
        }
    }
    return pickingInfos;
};
Scene.prototype.pickSprite = function (x, y, predicate, fastCheck, camera) {
    if (!this._tempSpritePickingRay) {
        return null;
    }
    CreatePickingRayInCameraSpaceToRef(this, x, y, this._tempSpritePickingRay, camera);
    const result = this._internalPickSprites(this._tempSpritePickingRay, predicate, fastCheck, camera);
    if (result) {
        result.ray = CreatePickingRayInCameraSpace(this, x, y, camera);
    }
    return result;
};
Scene.prototype.pickSpriteWithRay = function (ray, predicate, fastCheck, camera) {
    if (!this._tempSpritePickingRay) {
        return null;
    }
    if (!camera) {
        if (!this.activeCamera) {
            return null;
        }
        camera = this.activeCamera;
    }
    Ray.TransformToRef(ray, camera.getViewMatrix(), this._tempSpritePickingRay);
    const result = this._internalPickSprites(this._tempSpritePickingRay, predicate, fastCheck, camera);
    if (result) {
        result.ray = ray;
    }
    return result;
};
Scene.prototype.multiPickSprite = function (x, y, predicate, camera) {
    CreatePickingRayInCameraSpaceToRef(this, x, y, this._tempSpritePickingRay, camera);
    return this._internalMultiPickSprites(this._tempSpritePickingRay, predicate, camera);
};
Scene.prototype.multiPickSpriteWithRay = function (ray, predicate, camera) {
    if (!this._tempSpritePickingRay) {
        return null;
    }
    if (!camera) {
        if (!this.activeCamera) {
            return null;
        }
        camera = this.activeCamera;
    }
    Ray.TransformToRef(ray, camera.getViewMatrix(), this._tempSpritePickingRay);
    return this._internalMultiPickSprites(this._tempSpritePickingRay, predicate, camera);
};
Scene.prototype.setPointerOverSprite = function (sprite) {
    if (this._pointerOverSprite === sprite) {
        return;
    }
    if (this._pointerOverSprite && this._pointerOverSprite.actionManager) {
        this._pointerOverSprite.actionManager.processTrigger(10, ActionEvent.CreateNewFromSprite(this._pointerOverSprite, this));
    }
    this._pointerOverSprite = sprite;
    if (this._pointerOverSprite && this._pointerOverSprite.actionManager) {
        this._pointerOverSprite.actionManager.processTrigger(9, ActionEvent.CreateNewFromSprite(this._pointerOverSprite, this));
    }
};
Scene.prototype.getPointerOverSprite = function () {
    return this._pointerOverSprite;
};
/**
 * Defines the sprite scene component responsible to manage sprites
 * in a given scene.
 */
export class SpriteSceneComponent {
    /**
     * Creates a new instance of the component for the given scene
     * @param scene Defines the scene to register the component in
     */
    constructor(scene) {
        /**
         * The component name helpfull to identify the component in the list of scene components.
         */
        this.name = SceneComponentConstants.NAME_SPRITE;
        this.scene = scene;
        this.scene.spriteManagers = [];
        this.scene._tempSpritePickingRay = Ray ? Ray.Zero() : null;
        this.scene.onBeforeSpritesRenderingObservable = new Observable();
        this.scene.onAfterSpritesRenderingObservable = new Observable();
        this._spritePredicate = (sprite) => {
            if (!sprite.actionManager) {
                return false;
            }
            return sprite.isPickable && sprite.actionManager.hasPointerTriggers;
        };
    }
    /**
     * Registers the component in a given scene
     */
    register() {
        this.scene._pointerMoveStage.registerStep(SceneComponentConstants.STEP_POINTERMOVE_SPRITE, this, this._pointerMove);
        this.scene._pointerDownStage.registerStep(SceneComponentConstants.STEP_POINTERDOWN_SPRITE, this, this._pointerDown);
        this.scene._pointerUpStage.registerStep(SceneComponentConstants.STEP_POINTERUP_SPRITE, this, this._pointerUp);
    }
    /**
     * Rebuilds the elements related to this component in case of
     * context lost for instance.
     */
    rebuild() {
        /** Nothing to do for sprites */
    }
    /**
     * Disposes the component and the associated resources.
     */
    dispose() {
        this.scene.onBeforeSpritesRenderingObservable.clear();
        this.scene.onAfterSpritesRenderingObservable.clear();
        const spriteManagers = this.scene.spriteManagers;
        if (!spriteManagers) {
            return;
        }
        while (spriteManagers.length) {
            spriteManagers[0].dispose();
        }
    }
    _pickSpriteButKeepRay(originalPointerInfo, x, y, fastCheck, camera) {
        const result = this.scene.pickSprite(x, y, this._spritePredicate, fastCheck, camera);
        if (result) {
            result.ray = originalPointerInfo ? originalPointerInfo.ray : null;
        }
        return result;
    }
    _pointerMove(unTranslatedPointerX, unTranslatedPointerY, pickResult, isMeshPicked, element) {
        const scene = this.scene;
        if (isMeshPicked) {
            scene.setPointerOverSprite(null);
        }
        else {
            pickResult = this._pickSpriteButKeepRay(pickResult, unTranslatedPointerX, unTranslatedPointerY, false, scene.cameraToUseForPointers || undefined);
            if (pickResult && pickResult.hit && pickResult.pickedSprite) {
                scene.setPointerOverSprite(pickResult.pickedSprite);
                if (!scene.doNotHandleCursors && element) {
                    if (scene._pointerOverSprite && scene._pointerOverSprite.actionManager && scene._pointerOverSprite.actionManager.hoverCursor) {
                        element.style.cursor = scene._pointerOverSprite.actionManager.hoverCursor;
                    }
                    else {
                        element.style.cursor = scene.hoverCursor;
                    }
                }
            }
            else {
                scene.setPointerOverSprite(null);
            }
        }
        return pickResult;
    }
    _pointerDown(unTranslatedPointerX, unTranslatedPointerY, pickResult, evt) {
        const scene = this.scene;
        scene._pickedDownSprite = null;
        if (scene.spriteManagers && scene.spriteManagers.length > 0) {
            pickResult = scene.pickSprite(unTranslatedPointerX, unTranslatedPointerY, this._spritePredicate, false, scene.cameraToUseForPointers || undefined);
            if (pickResult && pickResult.hit && pickResult.pickedSprite) {
                if (pickResult.pickedSprite.actionManager) {
                    scene._pickedDownSprite = pickResult.pickedSprite;
                    switch (evt.button) {
                        case 0:
                            pickResult.pickedSprite.actionManager.processTrigger(2, ActionEvent.CreateNewFromSprite(pickResult.pickedSprite, scene, evt));
                            break;
                        case 1:
                            pickResult.pickedSprite.actionManager.processTrigger(4, ActionEvent.CreateNewFromSprite(pickResult.pickedSprite, scene, evt));
                            break;
                        case 2:
                            pickResult.pickedSprite.actionManager.processTrigger(3, ActionEvent.CreateNewFromSprite(pickResult.pickedSprite, scene, evt));
                            break;
                    }
                    if (pickResult.pickedSprite.actionManager) {
                        pickResult.pickedSprite.actionManager.processTrigger(5, ActionEvent.CreateNewFromSprite(pickResult.pickedSprite, scene, evt));
                    }
                }
            }
        }
        return pickResult;
    }
    _pointerUp(unTranslatedPointerX, unTranslatedPointerY, pickResult, evt, doubleClick) {
        const scene = this.scene;
        if (scene.spriteManagers && scene.spriteManagers.length > 0) {
            const spritePickResult = scene.pickSprite(unTranslatedPointerX, unTranslatedPointerY, this._spritePredicate, false, scene.cameraToUseForPointers || undefined);
            if (spritePickResult) {
                if (spritePickResult.hit && spritePickResult.pickedSprite) {
                    if (spritePickResult.pickedSprite.actionManager) {
                        spritePickResult.pickedSprite.actionManager.processTrigger(7, ActionEvent.CreateNewFromSprite(spritePickResult.pickedSprite, scene, evt));
                        if (spritePickResult.pickedSprite.actionManager) {
                            if (!this.scene._inputManager._isPointerSwiping()) {
                                spritePickResult.pickedSprite.actionManager.processTrigger(1, ActionEvent.CreateNewFromSprite(spritePickResult.pickedSprite, scene, evt));
                            }
                            if (doubleClick) {
                                spritePickResult.pickedSprite.actionManager.processTrigger(6, ActionEvent.CreateNewFromSprite(spritePickResult.pickedSprite, scene, evt));
                            }
                        }
                    }
                }
                if (scene._pickedDownSprite && scene._pickedDownSprite.actionManager && scene._pickedDownSprite !== spritePickResult.pickedSprite) {
                    scene._pickedDownSprite.actionManager.processTrigger(16, ActionEvent.CreateNewFromSprite(scene._pickedDownSprite, scene, evt));
                }
            }
        }
        return pickResult;
    }
}
//# sourceMappingURL=spriteSceneComponent.js.map