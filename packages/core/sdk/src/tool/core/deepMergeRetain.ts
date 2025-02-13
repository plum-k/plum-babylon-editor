import {get, isNil, isPlainObject} from "lodash-es";

export function deepMergeRetain(target: object, source?: Object): any {
    if (isNil(source)) {
        return target;
    }
    for (let key in source) {
        // 没有继承的对象
        if (source.hasOwnProperty(key)) {
            // 如果是普通对象
            if (isPlainObject(get(target, key))) {
                if (!target.hasOwnProperty(key)) {
                    Reflect.set(target, key, {})
                }
                deepMergeRetain(Reflect.get(target, key), Reflect.get(source, key));
            } else {
                Reflect.set(target, key, get(source, key))
            }
        }
    }
    return target;
}