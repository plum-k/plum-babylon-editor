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
        const accessKeyId = oss.accessKeyId;
        const accessKeySecret = oss.accessKeySecret;
        const roleArn = oss.roleArn;
        let sts = new STS({
            accessKeyId: accessKeyId,
            accessKeySecret: accessKeySecret
        });
        // roleArn填写步骤2获取的角色ARN，例如acs:ram::175708322470****:role/ramtest。
        // policy填写自定义权限策略，用于进一步限制STS临时访问凭证的权限。如果不指定Policy，则返回的STS临时访问凭证默认拥有指定角色的所有权限。
        // 3000为过期时间，单位为秒。
        // sessionName用于自定义角色会话名称，用来区分不同的令牌，例如填写为sessiontest。
        const result = await sts.assumeRole(roleArn, ``, 3000, 'sessiontest')
        console.log(result);
        const data = {
            AccessKeyId: result.credentials.AccessKeyId,
            AccessKeySecret: result.credentials.AccessKeySecret,
            SecurityToken: result.credentials.SecurityToken,
        }
        return ResultResponse.ok(data);
    }
}

