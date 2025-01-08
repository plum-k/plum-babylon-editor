export class Result<T> {
    code: number;
    msg: string | undefined;
    data: T;

    static build() {
        return new Result();
    }

    setMsg(msg: string) {
        this.msg = msg;
        return this;
    }

    setData(data: T) {
        this.data = data;
        return this;
    }

    setCode(code: number) {
        this.code = code;
        return this;
    }
}
