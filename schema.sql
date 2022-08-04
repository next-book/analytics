create table events
(
    id                       bigserial
        primary key,
    time                     timestamp with time zone default now() not null,
    session_id               varchar(32),
    book_id                  varchar(255)                           not null,
    domain                   varchar(255)                           not null,
    url                      varchar(255)                           not null,
    pathname                 varchar(255),
    book_location            varchar(255),
    referrer                 varchar(255),
    name                     varchar(40)                            not null,
    utm_medium               varchar(255),
    utm_source               varchar(255),
    utm_campaign             varchar(255),
    utm_content              varchar(255),
    utm_term                 varchar(255),
    category                 varchar(40),
    value                    varchar(255),
    operating_system         varchar(64),
    operating_system_version varchar(64),
    browser                  varchar(64),
    browser_version          varchar(64),
    screen_size              varchar(32),
    client_id                varchar(64),
    user_id                  varchar(32),
    method                   varchar(40)
);

alter table events
    owner to postgres;


