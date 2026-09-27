$ErrorActionPreference = "Stop"

Set-Location $PSScriptRoot

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw "docker não foi encontrado no PATH. Instale o Docker Desktop antes de testar o frontend."
}

docker compose --profile test run --rm frontend-test
