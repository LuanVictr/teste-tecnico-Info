#!/bin/bash
set -e

echo ""
echo "================================================"
echo "  Aivacol Fleet Management — Setup"
echo "================================================"
echo ""

# Verificar Docker
if ! command -v docker &> /dev/null; then
  echo "[ERRO] Docker não encontrado."
  echo "       Instale em: https://docs.docker.com/get-docker/"
  exit 1
fi

# Verificar Docker Compose V2
if ! docker compose version &> /dev/null; then
  echo "[ERRO] Docker Compose V2 não encontrado."
  echo "       Instale em: https://docs.docker.com/compose/install/"
  exit 1
fi

# Criar .env se não existir
if [ ! -f .env ]; then
  cp .env.example .env
  echo "[setup] .env criado a partir de .env.example"
else
  echo "[setup] .env já existe — mantendo configurações atuais"
fi

echo ""
echo "[docker] Iniciando build e subindo serviços..."
echo ""

docker compose up -d --build

echo ""
echo "================================================"
echo "  Serviços iniciados!"
echo ""
echo "  O SQL Server pode levar até 60s para ficar"
echo "  pronto na primeira execução."
echo ""
echo "  Swagger UI : http://localhost:3000/api/docs"
echo "  RabbitMQ   : http://localhost:15672"
echo "               user: guest / pass: guest"
echo "================================================"
echo ""
