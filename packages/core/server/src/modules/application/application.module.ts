import {TypeOrmModule} from '@nestjs/typeorm';
import {Module} from '@nestjs/common';
import {MulterModule} from "@nestjs/platform-express";
import {Application} from "./entities/application.entity";
import {ApplicationController} from "./application.controller";
import {ApplicationService} from "./application.service";

@Module({
    imports: [TypeOrmModule.forFeature([Application]), MulterModule],
    controllers: [ApplicationController],
    providers: [ApplicationService],
    exports: [ApplicationService],
})
export class ApplicationModule {
}
