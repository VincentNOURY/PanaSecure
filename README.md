# PanaSecure

PanaSecure est un outil de transfert de fichier chiffrés.

## Objectif

L'objectif de PanaSecure est de sécuriser les transferts de fichiers dans le domaine médical.

## Usage

### Docker

```bash
docker build . -t panasecure && docker run -d --name=PanaSecure -p 3000:3000 -v db_user="" -v db_host="" -v db_database="" -v db_password="" -v db_port="" panasecure
```