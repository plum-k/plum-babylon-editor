import {Module} from '@nestjs/common';
import {ConfigModule} from '@nestjs/config';
import {ApplicationModule} from "./modules/application/application.module";
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
    ],
    controllers: [],
    providers: [],
})
export class AppModule {
}
