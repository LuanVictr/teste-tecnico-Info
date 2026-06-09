pipeline {
    agent none

    options {
        disableConcurrentBuilds(abortPrevious: true)
        skipDefaultCheckout(true)
    }

    parameters {
        string(name: 'BRANCH', defaultValue: 'main', description: 'Branch para deploy (main | develop)')
    }

    environment {
        PROJECT       = 'aivacol-fleet'
        BRANCH_NAME   = "${params.BRANCH}"
        WORKSPACE_DIR = "/var/jenkins_home/workspace/${JOB_NAME}"

        DEPLOY_DIR = '/opt/aivacol-fleet'

        VPS_HOST = credentials('aivacol-fleet-vps-host')
        VPS_USER = 'root'
    }

    stages {

        stage('SCM') {
            agent any

            steps {
                script {
                    timeout(time: 5, unit: 'MINUTES') {
                        dir("${WORKSPACE_DIR}") {
                            git branch: "${BRANCH_NAME}",
                                url: 'https://github.com/LuanVictr/teste-tecnico-Info.git'
                        }
                    }
                }
            }
        }

        stage('Instalar e Testar') {
            agent any

            steps {
                script {
                    timeout(time: 15, unit: 'MINUTES') {
                        dir("${WORKSPACE_DIR}") {
                            sh 'npm install'
                            sh 'npm test'
                        }
                    }
                }
            }
        }

        stage('Pausar para Deploy em Produção') {
            agent none

            when {
                expression { return BRANCH_NAME == 'main' }
            }

            steps {
                script {
                    timeout(time: 24, unit: 'HOURS') {
                        input message: "Realizar deploy em produção da branch ${BRANCH_NAME}?", ok: 'DEPLOY'
                    }
                }
            }
        }

        stage('Deploy') {
            agent any

            steps {
                script {
                    timeout(time: 15, unit: 'MINUTES') {
                        dir("${WORKSPACE_DIR}") {

                            writeFile file: 'remote-deploy.sh', text: """#!/bin/bash
set -euo pipefail

DEPLOY_DIR="${env.DEPLOY_DIR}"

echo "[deploy] Entrando em \${DEPLOY_DIR}..."
cd "\${DEPLOY_DIR}"

# Cria .env a partir do .env.example se não existir
if [ ! -f .env ]; then
    cp .env.example .env
    echo "[deploy] .env criado a partir de .env.example"
fi

echo "[deploy] Subindo containers..."
docker compose up -d --build

echo "[deploy] Aguardando API ficar saudável..."
RETRIES=30
until curl -sf http://localhost:3000/api/docs > /dev/null 2>&1 || [ \$RETRIES -eq 0 ]; do
    sleep 5
    RETRIES=\$((RETRIES - 1))
    echo "[deploy] Aguardando... (\$RETRIES tentativas restantes)"
done

if [ \$RETRIES -eq 0 ]; then
    echo "[deploy] ERRO: API não ficou saudável a tempo."
    docker compose logs app --tail=50
    exit 1
fi

echo "[deploy] API saudável."
echo "[deploy] Deploy concluído."
echo ""
echo "  Frontend   : http://\$(hostname -I | awk '{print \$1}'):8080"
echo "  Swagger UI : http://\$(hostname -I | awk '{print \$1}'):3000/api/docs"
echo "  RabbitMQ   : http://\$(hostname -I | awk '{print \$1}'):15672"
"""

                            withCredentials([sshUserPrivateKey(
                                credentialsId: 'aivacol-fleet-vps-ssh',
                                keyFileVariable: 'SSH_KEY'
                            )]) {
                                sh '''
                                    chmod 600 "$SSH_KEY"
                                    SSHOPTS="-i $SSH_KEY -o StrictHostKeyChecking=no"

                                    # Garante que o diretório de deploy existe na VPS
                                    ssh $SSHOPTS $VPS_USER@$VPS_HOST "mkdir -p $DEPLOY_DIR"

                                    # Sincroniza o código para a VPS (exclui artefatos locais)
                                    rsync -az --delete \
                                        --exclude=".git" \
                                        --exclude="node_modules" \
                                        --exclude="frontend/node_modules" \
                                        --exclude="frontend/dist" \
                                        --exclude="dist" \
                                        --exclude=".env" \
                                        --exclude="coverage" \
                                        -e "ssh $SSHOPTS" \
                                        . $VPS_USER@$VPS_HOST:$DEPLOY_DIR/

                                    # Copia e executa o script de deploy remoto
                                    scp $SSHOPTS remote-deploy.sh $VPS_USER@$VPS_HOST:/tmp/fleet-deploy.sh
                                    ssh $SSHOPTS $VPS_USER@$VPS_HOST "chmod +x /tmp/fleet-deploy.sh && bash /tmp/fleet-deploy.sh"
                                '''
                            }
                        }
                    }
                }
            }
        }
    }

    post {
        failure {
            node('built-in') {
                echo "Pipeline ${PROJECT} falhou na branch ${BRANCH_NAME}."
            }
        }

        success {
            node('built-in') {
                echo "Deploy ${PROJECT} concluído com sucesso na branch ${BRANCH_NAME}."
            }
        }
    }
}
