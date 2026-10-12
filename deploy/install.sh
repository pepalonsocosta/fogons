#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Ús: sudo ./deploy/install.sh [directori]"
  echo "El directori per defecte és /opt/fogons."
  echo "La imatge és ghcr.io/pepalonsocosta/fogons."
}

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Executa l'script amb sudo."
  usage
  exit 1
fi

image_repository="ghcr.io/pepalonsocosta/fogons"
install_dir="${1:-/opt/fogons}"
install_dir="${install_dir%/}"
source_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ ! "$install_dir" =~ ^/[A-Za-z0-9._/-]+$ ]]; then
  echo "El directori ha de ser un camí absolut, per exemple /opt/fogons."
  exit 1
fi

if [[ "$install_dir" == /home/* || "$install_dir" == /root || "$install_dir" == /root/* ]]; then
  echo "Instal·la fora de /home i /root. El valor per defecte és /opt/fogons."
  exit 1
fi

if [[ ! -x /usr/bin/docker ]] || ! /usr/bin/docker compose version >/dev/null 2>&1; then
  echo "Falta Docker Engine amb el plugin Compose. A Raspberry Pi OS:"
  echo "  curl -fsSL https://get.docker.com | sudo sh"
  echo "  sudo apt-get install -y docker-compose-plugin"
  exit 1
fi

if ! getent group docker >/dev/null; then
  echo "Docker està instal·lat, però no existeix el grup docker."
  exit 1
fi

if [[ ! -x /usr/bin/node ]]; then
  echo "Falta Node.js 22 a /usr/bin/node. El paquet de Debian és massa vell:"
  echo "  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -"
  echo "  sudo apt-get install -y nodejs"
  exit 1
fi

node_major="$(/usr/bin/node -p "process.versions.node.split('.')[0]")"
if [[ "$node_major" -lt 22 ]]; then
  echo "Cal Node.js 22 o més nou. Ara hi ha $(/usr/bin/node --version)."
  echo "  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -"
  echo "  sudo apt-get install -y nodejs"
  exit 1
fi

if ! command -v openssl >/dev/null; then
  echo "Falta openssl. Instal·la'l amb: sudo apt-get install -y openssl"
  exit 1
fi

mkdir -p "$install_dir"/{data,uploads,deploy-agent}

if ! id fogons-deploy >/dev/null 2>&1; then
  useradd --system --home "$install_dir" --shell /usr/sbin/nologin fogons-deploy
fi
usermod -aG docker fogons-deploy

install -m 644 "$source_dir/docker-compose.yml" "$install_dir/docker-compose.yml"
install -m 644 "$source_dir/agent/server.mjs" "$install_dir/deploy-agent/server.mjs"
sed "s|/opt/fogons|${install_dir}|g" "$source_dir/agent/fogons-deploy-agent.service" \
  > /etc/systemd/system/fogons-deploy-agent.service

created_env=0
show_password() {
  if [[ "$created_env" -eq 1 ]]; then
    echo "Contrasenya d'admin: ${admin_password}"
    echo "Guarda-la ara. No es tornarà a mostrar."
  fi
}

if [[ ! -f "$install_dir/.env" ]]; then
  admin_password="$(openssl rand -hex 18)"
  session_secret="$(openssl rand -hex 32)"
  deploy_secret="$(openssl rand -hex 32)"
  umask 077
  cat > "$install_dir/.env" <<EOF
IMAGE_REPOSITORY=${image_repository}
IMAGE_TAG=main
FOGONS_ADMIN_PASSWORD=${admin_password}
FOGONS_ADMIN_SESSION_SECRET=${session_secret}
DEPLOY_AGENT_URL=http://host.docker.internal:9900
DEPLOY_AGENT_SECRET=${deploy_secret}
CLOUDFLARE_TUNNEL_TOKEN=
EOF
  cat > "$install_dir/deploy-agent/.env" <<EOF
DEPLOY_AGENT_HOST=0.0.0.0
DEPLOY_AGENT_PORT=9900
DEPLOY_AGENT_SECRET=${deploy_secret}
DEPLOY_COMPOSE_DIR=${install_dir}
DEPLOY_COMPOSE_FILE=docker-compose.yml
EOF
  created_env=1
elif [[ ! -f "$install_dir/deploy-agent/.env" ]]; then
  deploy_secret="$(grep '^DEPLOY_AGENT_SECRET=' "$install_dir/.env" | cut -d= -f2- || true)"
  if [[ -z "$deploy_secret" ]]; then
    echo "A $install_dir/.env li falta DEPLOY_AGENT_SECRET."
    exit 1
  fi
  umask 077
  cat > "$install_dir/deploy-agent/.env" <<EOF
DEPLOY_AGENT_HOST=0.0.0.0
DEPLOY_AGENT_PORT=9900
DEPLOY_AGENT_SECRET=${deploy_secret}
DEPLOY_COMPOSE_DIR=${install_dir}
DEPLOY_COMPOSE_FILE=docker-compose.yml
EOF
fi

chown -R fogons-deploy:fogons-deploy "$install_dir"
chmod 600 "$install_dir/.env" "$install_dir/deploy-agent/.env"

systemctl daemon-reload
systemctl enable fogons-deploy-agent >/dev/null
systemctl restart fogons-deploy-agent

compose=(/usr/bin/docker compose --project-directory "$install_dir" -f "$install_dir/docker-compose.yml")
if ! "${compose[@]}" pull app; then
  echo "No s'ha pogut descarregar ghcr.io/pepalonsocosta/fogons."
  echo "Comprova la connexió i torna a executar l'script. Les dades i el .env es conserven."
  show_password
  exit 1
fi

"${compose[@]}" up -d app

if command -v curl >/dev/null; then
  for _ in $(seq 1 30); do
    if curl -sf "http://127.0.0.1:3000/api/health" >/dev/null; then
      echo "L'app respon a http://127.0.0.1:3000"
      show_password
      exit 0
    fi
    sleep 2
  done
  echo "L'app no ha respost a http://127.0.0.1:3000/api/health."
  "${compose[@]}" ps
  show_password
  exit 1
fi

echo "L'app s'està engegant a http://127.0.0.1:3000"
show_password
