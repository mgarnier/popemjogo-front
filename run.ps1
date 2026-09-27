$ErrorActionPreference = "Stop"

Set-Location $PSScriptRoot

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    throw "npm não foi encontrado no PATH. Instale o Node.js antes de executar o frontend."
}

npm run dev
