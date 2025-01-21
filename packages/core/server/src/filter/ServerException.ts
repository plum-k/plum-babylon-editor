import {HttpException} from '@nestjs/common';

export class ServerException extends HttpException {
    code: number;

    constructor(response = '服务器错误', code = -1, status = 500) {
        super(response, status);
        this.code = code;
    }
}
