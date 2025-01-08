import {NestFactory} from '@nestjs/core';
import {AppModule} from "./app.module";
import {Logger} from "@nestjs/common";
import {ConfigService} from "@nestjs/config";
import {AllExceptionsFilter} from "./filter/allExceptions.filter";

(async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    const configService = app.get(ConfigService);
    const node = configService.get('http')

    // 设置全局过滤器
    app.useGlobalFilters(new AllExceptionsFilter());

    app.enableCors();
    await app.listen(node.port);
    const url = await app.getUrl();
    Logger.log(`启动服务器 ${url}`);
})()
