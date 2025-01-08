import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {Application} from "./application/entities/application.entity";
import {ConfigService} from "@nestjs/config";
import {IConfig} from "../config/IConfig";

@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService<IConfig>) => {
                const database = configService.get('database');
                return {
                    type: 'mysql',
                    port: database.port,
                    database: database.name,
                    host: database.host,
                    username: database.user,
                    password: database.password,
                    // logging: true,
                    entities: [
                        Application,
                    ],
                    synchronize: true,
                }
            },
        }),
    ],
})
export class OrmModule {
}
