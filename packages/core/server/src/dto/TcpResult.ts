import {Result} from "./Result";

export class TcpResult<T> extends Result<T> {
    id: string;

    static build() {
        return new TcpResult();
    }

    setId(id: string) {
        this.id = id;
        return this;
    }
}
