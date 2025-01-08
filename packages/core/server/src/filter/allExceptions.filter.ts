import {ArgumentsHost, Catch, ExceptionFilter, HttpException,} from '@nestjs/common';
import {isArray} from 'class-validator';
import {Result} from "../dto/Result";
import {ServerException} from "./ServerException";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();

        const result = new Result();
        let status = 500;
        console.log(exception);
        if (exception instanceof ServerException) {
            result.setMsg(exception.message);
            result.setCode(exception.code);
            result.setCode(exception.code);
            status = exception.getStatus();
        } else if (exception instanceof HttpException) {
            const DefaultResponse = exception.getResponse() as Error;
            if (isArray(DefaultResponse.message)) {
                result.setMsg(DefaultResponse.message[0]);
            } else {
                result.setMsg(DefaultResponse.message);
            }
            status = exception.getStatus() || 500;
            result.setCode(-1);
        } else if (exception instanceof Error) {
            status = 500;
            result.setCode(-1);
            result.setMsg('服务器错误');
        }
        response.status(status).json(result);
    }
}
