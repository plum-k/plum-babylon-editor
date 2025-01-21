import {Module} from '@nestjs/common';
import {OssController} from "./oss.controller";

@Module({
    imports: [],
    controllers: [OssController],
    providers: [],
    exports: [],
})
export class OssModule {
}
