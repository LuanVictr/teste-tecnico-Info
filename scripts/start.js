#!/usr/bin/env node
'use strict'

const { execSync, spawnSync } = require('child_process')
const { existsSync, copyFileSync } = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')

console.log('\n================================================')
console.log('  Aivacol Fleet Management — Setup')
console.log('================================================\n')

// Verify Docker
try {
  execSync('docker --version', { stdio: 'ignore' })
} catch {
  console.error('[ERRO] Docker não encontrado.')
  console.error('       Instale em: https://docs.docker.com/get-docker/')
  process.exit(1)
}

// Verify Docker Compose V2
try {
  execSync('docker compose version', { stdio: 'ignore' })
} catch {
  console.error('[ERRO] Docker Compose V2 não encontrado.')
  console.error('       Instale em: https://docs.docker.com/compose/install/')
  process.exit(1)
}

// Create .env from .env.example if not present
const envFile = path.join(root, '.env')
const envExample = path.join(root, '.env.example')
if (!existsSync(envFile)) {
  copyFileSync(envExample, envFile)
  console.log('[setup] .env criado a partir de .env.example')
} else {
  console.log('[setup] .env já existe — mantendo configurações atuais')
}

console.log('\n[docker] Iniciando build e subindo serviços...\n')

const result = spawnSync('docker', ['compose', 'up', '-d', '--build'], {
  cwd: root,
  stdio: 'inherit',
  shell: process.platform === 'win32',
})

if (result.status !== 0) {
  process.exit(result.status ?? 1)
}

console.log('\n================================================')
console.log('  Serviços iniciados!\n')
console.log('  O SQL Server pode levar até 60s para ficar')
console.log('  pronto na primeira execução.\n')
console.log('  Frontend   : http://localhost:8080')
console.log('  Swagger UI : http://localhost:3000/api/docs')
console.log('  RabbitMQ   : http://localhost:15672')
console.log('               user: guest / pass: guest')
console.log('================================================\n')
