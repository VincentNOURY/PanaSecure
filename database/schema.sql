DROP DATABASE panasecure;

CREATE DATABASE panasecure;

\c panasecure;

CREATE TABLE users
(
    numsecu INT PRIMARY KEY NOT NULL,
    nom VARCHAR(30),
    prenom VARCHAR(30),
    email VARCHAR(200),
    password VARCHAR,
    isdoc BOOLEAN,
    patients INT[],
    docs INT[]
);

CREATE TABLE files
(
    id SERIAL PRIMARY KEY,
    name VARCHAR,
    path VARCHAR,
    md5 VARCHAR,
    exp INT,
    dest INT,
    key VARCHAR
);