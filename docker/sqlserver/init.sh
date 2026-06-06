#!/bin/bash
set -e

echo "[init] Iniciando SQL Server..."
/opt/mssql/bin/sqlservr &
SQL_PID=$!

echo "[init] Aguardando SQL Server aceitar conexões..."
for i in $(seq 1 40); do
    if /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$SA_PASSWORD" -Q "SELECT 1" -C -l 2 > /dev/null 2>&1; then
        echo "[init] SQL Server pronto após $((i * 2))s."
        break
    fi
    if [ "$i" -eq 40 ]; then
        echo "[init] ERRO: SQL Server não respondeu em 80 segundos."
        exit 1
    fi
    sleep 2
done

echo "[init] Criando banco de dados '$DB_DATABASE'..."
/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$SA_PASSWORD" -C -Q "
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'$DB_DATABASE')
BEGIN
    CREATE DATABASE [$DB_DATABASE];
    PRINT '[init] Banco de dados criado.';
END
ELSE
    PRINT '[init] Banco de dados já existe.';
"

echo "[init] Criando login '$DB_USERNAME'..."
/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$SA_PASSWORD" -C -Q "
IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = '$DB_USERNAME')
BEGIN
    CREATE LOGIN [$DB_USERNAME] WITH PASSWORD = '$DB_PASSWORD', CHECK_POLICY = ON;
    PRINT '[init] Login criado.';
END
ELSE
    PRINT '[init] Login já existe.';
"

echo "[init] Criando usuário e concedendo permissões em '$DB_DATABASE'..."
/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$SA_PASSWORD" -d "$DB_DATABASE" -C -Q "
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = '$DB_USERNAME')
BEGIN
    CREATE USER [$DB_USERNAME] FOR LOGIN [$DB_USERNAME];
    ALTER ROLE db_owner ADD MEMBER [$DB_USERNAME];
    PRINT '[init] Usuário criado com permissões db_owner.';
END
ELSE
    PRINT '[init] Usuário já existe.';
"

echo "[init] Inicialização concluída."
wait $SQL_PID
