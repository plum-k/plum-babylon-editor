export interface IRequestError<T = unknown> extends Error {
    response: {
        status: number;
        data: T
    };
}
