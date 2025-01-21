import {Module} from '@nestjs/common';
import {ConfigModule} from '@nestjs/config';
import {ApplicationModule} from "./modules/application/application.module";
import {OssModule} from "./modules/oss/oss.module";
import {OrmModule} from "./modules/orm.module";
import configuration from "./config/configuration";

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [configuration],
        }),
        OrmModule,
        ApplicationModule,
        OssModule
    ],
    controllers: [],
    providers: [],
})
export class AppModule {
}
