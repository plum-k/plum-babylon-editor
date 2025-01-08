/**
 * 创建对象
 */
export function construct<T>(target: Function, arr?: Array<any>): T {
    return Reflect.construct(target, arr ?? []);
}
