export interface ApiRes<T = unknown> {
    code: number,
    message: string,
    data: T
}
