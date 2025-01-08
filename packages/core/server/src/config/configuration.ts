import {readFileSync} from 'fs';
import * as yaml from 'js-yaml';
import {join} from 'path';
import {IConfig} from "./IConfig";
import {Logger} from "@nestjs/common";

export default () => {
    const ConfigFile = `${process.env.CONFIG_FILE}`
    const ConfigPath = `/config/${ConfigFile}`;

    // 获取当前工作目录
    const currentDirectory = process.cwd();

    let config = yaml.load(
        readFileSync(join(currentDirectory, ConfigPath), 'utf8'),
    ) as IConfig
    Logger.log(config, "configuration")
    return config
};