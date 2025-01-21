import {Result} from "./Result";

export class ResultResponse<T> {
    static ok<T>(data: T) {
        return new Result<T>().setCode(1).setData(data);
    }

    static makeOKRsp(msg: string) {
        return new Result().setCode(1).setMsg(msg);
    }

    static makeOk() {
        return new Result().setCode(1)
    }

    static err() {
        return new Result().setCode(0);
    }

    static makeErr(code: number, msg: string) {
        return new Result().setCode(code).setMsg(msg);
    }

    static makeErrMsg(msg: string) {
        return new Result().setCode(0).setMsg(msg);
    }
}
