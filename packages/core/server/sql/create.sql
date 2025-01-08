create table application
(
    id              int auto_increment primary key,
    name            varchar(255) not null,
    appType         enum ('DIR','BABYLON') default 'DIR',
    createTime      datetime               default current_timestamp,
    resourcePath    varchar(255)           default null,
    config          json                   default null,
    thumbnailBase64 varchar(255)           default null,
    parentId        varchar(255)           default null
);
