# PanaSecure

PanaSecure est un outil de transfert de fichier chiffrés.

## Objectif

L'objectif de PanaSecure est de sécuriser les transferts de fichiers dans le domaine médical.

## Usage

Premièrement déployer une base de donnée Postgresql avec le fichier schema.sql trouvable dans database


### Attention

Le compte avec le numéro de sécurité sociale 0 est le compte administrateur

### Docker

```bash
docker build . -t panasecure && docker run -d --name=PanaSecure -p 3000:3000 -e db_user="" -e db_host="" -e db_database="" -e db_password="" -e db_port="" -e sessions_secret="" panasecure
```