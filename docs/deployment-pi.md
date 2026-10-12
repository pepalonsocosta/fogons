# Deploy al Raspberry Pi

La imatge publicada és `ghcr.io/pepalonsocosta/fogons`. El Pi la descarrega sense compte de GitHub. El contenidor de l'app no té accés a Docker: un agent al host fa `docker compose pull` i torna a engegar l'app.

La instal·lació acaba amb l'app oberta a la mateixa màquina, a `http://127.0.0.1:3000`. El túnel de Cloudflare és un pas posterior.

## Abans d'instal·lar

Cal un Raspberry Pi OS de 64 bits que no entri en repòs.

Instal·la Docker Engine i el plugin Compose:

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo apt-get install -y docker-compose-plugin
```

Instal·la Node.js 22. El paquet `nodejs` de Debian és massa vell, i l'agent el necessita a `/usr/bin/node`:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version
```

Després del primer build a `main`, fes el paquet GHCR públic des de GitHub (Package settings → Change visibility). Sense això, el Pi no podrà fer `docker pull` sense autenticació.

## Instal·lar

Clona el repositori on vulguis. El clon no és la instal·lació: l'script copia el que ha de quedar en marxa a `/opt/fogons` i descarrega `ghcr.io/pepalonsocosta/fogons`.

```bash
sudo ./deploy/install.sh
```

Per usar una altra carpeta:

```bash
sudo ./deploy/install.sh /alguna/altra/carpeta
```

L'script fa això:

- Comprova Docker, Compose i Node 22.
- Crea l'usuari `fogons-deploy` i les carpetes `data`, `uploads` i `deploy-agent`.
- Copia el Compose, l'agent i el servei de systemd.
- Si encara no hi ha `.env`, genera la contrasenya d'admin i els secrets, i els escriu amb permisos `600`. La contrasenya es mostra una sola vegada.
- Si el `.env` ja existeix, no el toca.
- Descarrega la imatge i engega només l'app.

Quan acabi, obre `http://127.0.0.1:3000`. L'admin és a `http://127.0.0.1:3000/admin`.

Tornar a executar l'script actualitza el programa i conserva `data/`, `uploads/` i el `.env`.

El port `9900` de l'agent ha de ser accessible des del contenidor, però no l'obris al router. Cada petició de deploy va signada i caduca al cap de dos minuts.

## Actualitzar

Entra a `/admin` i prem `Desplegar última versió`.

El Pi descarrega la imatge, torna a engegar l'app i espera que el health check passi. El botó segueix esperant durant el reinici.

## Rollback

A la carpeta d'instal·lació, canvia `IMAGE_TAG` al SHA anterior i executa:

```bash
docker compose pull app
docker compose up -d --no-build app
```

## Còpies de seguretat

No eliminis aquestes carpetes durant un deploy:

```text
/opt/fogons/data
/opt/fogons/uploads
```

Copia fora del Pi `/opt/fogons/data/fogons.db` i `/opt/fogons/uploads/`. Una còpia al mateix Pi no és suficient.

## Fer-la pública amb Cloudflare

Aquest pas no cal per usar l'app al Pi.

Crea un túnel a Cloudflare i apunta el servei públic a:

```text
http://app:3000
```

Posa el token a `CLOUDFLARE_TUNNEL_TOKEN` dins el `.env` de la instal·lació. Després:

```bash
cd /opt/fogons
docker compose --profile tunnel up -d
```

Sense el perfil `tunnel`, Compose no engega `cloudflared` i no necessita el token.
