import {Controller, Get, Param} from '@nestjs/common';
import {ResultResponse} from "../../dto/ResultResponse";
import {STS} from "ali-oss";
import {ConfigService} from "@nestjs/config";
import {IConfig} from "../../config/IConfig";

@Controller('oss')
export class OssController {
    constructor(private configService: ConfigService<IConfig>) {
    }

    @Get()
    async getById() {
        const oss = this.configService.get('oss');
        const roleArn = oss.roleArn;
        const accessKeyId = oss.accessKeyId;
        const accessKeySecret = oss.accessKeySecret;
        let sts = new STS({
            accessKeyId: accessKeyId,
            accessKeySecret: accessKeySecret
        });
        const result = await sts.assumeRole(roleArn, ``, 30*60, 'sessiontest')
        return ResultResponse.ok(result.credentials);
    }
}

