$ErrorActionPreference = "Stop"

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw "docker não foi encontrado no PATH. Instale o Docker Desktop antes de executar o frontend."
}

docker compose version | Out-Null
if ($LASTEXITCODE -ne 0) { throw "Docker Compose não está disponível. Verifique a instalação do Docker Desktop." }

$dockerOS = docker info --format '{{.OSType}}'
if ($LASTEXITCODE -ne 0 -or $dockerOS -ne "linux") { throw "Inicie o Docker Desktop em modo de containers Linux." }

$compose = Join-Path $PSScriptRoot "docker-compose.yml"
docker compose -f $compose config --quiet
if ($LASTEXITCODE -ne 0) { throw "Verifique o Compose e se o backend está clonado ao lado do frontend." }

docker compose -f $compose up -d --build --wait --wait-timeout 120 frontend backend
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Interface: http://localhost:8080"
Write-Host "Swagger da API: http://localhost:8000/docs"
