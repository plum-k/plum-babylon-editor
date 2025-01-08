import {Observable as BJSObservable} from "@babylonjs/core";
import {Observable} from "rxjs";


/**
 * Wraps a Babylon Observable into an rxjs Observable
 *
 * @param bjsObservable The Babylon Observable you want to observe
 * @example
 * ```
 * import { Engine, Scene, AbstractMesh } from '@babylonjs/core'
 *
 * const canvas = document.getElementById('canvas') as HTMLCanvasElement
 * const engine = new Engine(canvas)
 * const scene = new Scene(engine)
 *
 * const render$: Observable<Scene> = fromBabylonObservable(scene.onAfterRenderObservable)
 * const onMeshAdded$: Observable<AbstractMesh> = fromBabylonObservable(scene.onNewMeshAddedObservable)
 * ```
 */
export function fromBabylonObservable<T>(bjsObservable: BJSObservable<T>): Observable<T> {
    return new Observable<T>((subscriber) => {
        if (!(bjsObservable instanceof BJSObservable)) {
            throw new TypeError("the object passed in must be a Babylon Observable");
        }

        const handler = bjsObservable.add((v) => subscriber.next(v));

        return () => bjsObservable.remove(handler);
    });
}