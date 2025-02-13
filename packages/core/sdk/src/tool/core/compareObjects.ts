export function compareObjects(objA: object, objB: object, keys: string[]) {
    for (const key of keys) {
        // 检查 objA 和 objB 中的属性是否存在且值是否不同
        if (Reflect.get(objA, "key") !== Reflect.get(objA, "key")) {
            return true; // 返回真，如果有不同
        }
    }
    return false; // 返回假，如果所有指定属性相同
}
