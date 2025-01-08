// 数据库配置接口
export interface IDatabaseConfig {
    name: string;    // 数据库名称
    host: string;    // 数据库主机地址
    user: string;    // 数据库用户名
    port: number;    // 数据库端口号
    password: string; // 数据库密码
}


// HTTP 配置接口
export interface IHttpConfig {
    port: number;              // HTTP 服务的端口号
}

// 总配置接口
export interface IConfig {
    database: IDatabaseConfig; // 数据库配置
    http: IHttpConfig;         // HTTP 配置
}