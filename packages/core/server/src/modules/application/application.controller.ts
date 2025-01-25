import {Body, Controller, Delete, Get, Param, Post, Put, Query} from '@nestjs/common';
import {ApplicationService} from "./application.service";
import {ResultResponse} from "../../dto/ResultResponse";
import {Page} from "../../dto/Page";
import {Application, EAppType} from "./entities/application.entity";
import {IsNull} from 'typeorm';

@Controller('application')
export class ApplicationController {
    constructor(private readonly server: ApplicationService) {
    }
    @Get("/getAllDir")
    async getAllDir() {
        console.log(    await this.server.findAll({
            appType: EAppType.DIR
        }))
        return ResultResponse.ok(await this.server.findAll({
            appType: EAppType.DIR
        }));
    }
    @Get('/:id')
    async getById(@Param('id') id: number) {
        return ResultResponse.ok(await this.server.findOne(id));
    }

    @Get('/:page/:size')
    async getPage(@Param('page') page: number, @Param('size') size: number) {
        return ResultResponse.ok<Page<Application>>(await this.server.page(page, size));
    }


    @Post()
    async create(@Body() entity: Application) {
        await this.server.create(entity);
        return ResultResponse.makeOKRsp('创建成功');
    }


    @Put()
    async edit(@Body() entity: Application) {
        await this.server.edit(entity);
        return ResultResponse.makeOKRsp('编辑成功');
    }


    @Get()
    async getAll(@Query('parentId') parentId?: number) {
        return ResultResponse.ok(await this.server.findAll({
            parentId: parentId === undefined ? IsNull() : parentId
        }));
    }



    @Delete('/:id')
    async remove(@Param('id') id: number) {
        await this.server.deleteById(id);
        return ResultResponse.makeOKRsp('删除成功');
    }

    @Post("/createApp")
    async createApp(@Body() entity: Application) {
        // entity.config = defaultCommandBuildConfig
        await this.server.create(entity);
        return ResultResponse.makeOKRsp('创建成功');
    }
}

