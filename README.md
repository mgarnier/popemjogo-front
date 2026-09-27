# População em Jogo - frontend

Interface web do jogo **População em Jogo**. O jogador escolhe Brasil, região ou estado, recebe uma cidade sorteada e tenta estimar sua população com tolerância de +/-5%.

A interface conversa somente com a API própria. O backend consulta o IBGE, persiste a partida no SQLite e controla o histórico.

## Arquitetura

```mermaid
flowchart LR
    Browser[Navegador] --> Nginx[Frontend Nginx]
    Nginx -->|Arquivos estáticos| Browser
    Nginx -->|/api/*| FastAPI[Backend FastAPI]
    FastAPI --> SQLite[(SQLite)]
    FastAPI --> IBGE[API pública do IBGE]
```

O projeto possui três módulos comunicantes:

1. Interface React/Vite servida pelo Nginx.
2. API FastAPI desenvolvida para o projeto.
3. API pública do IBGE, consultada pelo backend.

## Tecnologias

- React 19 para construir a interface.
- Vite 8 para desenvolvimento e build.
- Lucide React para os ícones.
- Vitest, Testing Library e jsdom para testar a interface.
- Nginx para servir o build de produção
- Docker Compose para a execução integrada

## Pré-requisitos

Para usar os scripts auxiliares e a execução integrada, instale Docker Desktop com Docker Compose disponível:

```powershell
docker version
docker compose version
```

## Execução local sem Docker

Para executar diretamente no host, instale Node.js e npm e use:

```powershell
npm ci
npm test
```

Para iniciar o servidor Vite:

```powershell
npm run dev
```

Durante o desenvolvimento, o proxy do Vite encaminha `/api` para `http://localhost:8000`.

Os scripts PowerShell da raiz usam Docker Compose:

```powershell
.\build.ps1
.\run.ps1
.\test.ps1
```

Eles constroem a imagem, iniciam os serviços integrados e executam os testes no profile `test`.

Para executar a API localmente, use os scripts equivalentes no repositório <https://github.com/mgarnier/popemjogo-api>.

## Execução com Docker Compose

O Compose está neste repositório e usa o backend clonado lado a lado a partir de <https://github.com/mgarnier/popemjogo-api>:

```powershell
docker compose config
docker compose build
docker compose up -d
docker compose ps
```

Endereços publicados:

- Interface: <http://localhost:8080>
- API: <http://localhost:8000>
- Swagger: <http://localhost:8000/docs>
- Healthcheck: <http://localhost:8000/api/v1/health>

Para executar os testes nos containers:

```powershell
docker compose --profile test run --rm backend-test
docker compose --profile test run --rm frontend-test
```

Para acompanhar os logs:

```powershell
docker compose logs -f backend frontend
```

Para parar os serviços sem apagar o banco:

```powershell
docker compose down
```

Para remover também o volume SQLite, somente quando essa perda for intencional:

```powershell
docker compose down -v
```

O frontend usa chamadas relativas para `/api`. Em produção, o Nginx encaminha essas chamadas para o serviço `backend` na rede interna do Compose.

## Fluxo do jogo

1. O navegador cria ou reutiliza um UUID anônimo em `localStorage`.
2. A interface carrega regiões e estados pela API própria.
3. O jogador escolhe Brasil, região ou estado.
4. O backend consulta dados atuais do IBGE e sorteia um município.
5. A interface mostra o município e a UF, mas mantém a população em segredo.
6. O jogador envia palpites inteiros não negativos.
7. O palpite é aceito quando está dentro da tolerância inclusiva de +/-5%.
8. A interface revela a população em caso de acerto ou desistência.
9. As partidas encerradas aparecem no histórico do jogador.

## Testes

Os testes do frontend são determinísticos e não chamam a API real:

```powershell
.\test.ps1
```

A suíte cobre o cliente HTTP, UUID, headers, métodos, erros, seleção de escopo, partida, feedback, vitória, desistência, histórico e confirmação de limpeza.

## Limitações

- O UUID do navegador identifica anonimamente o jogador, mas não é autenticação.
- Limpar os dados do navegador cria outro identificador e não recupera o histórico anterior.
- Não há cadastro, login, ranking global, multiplayer ou exclusão individual de partidas.
- A interface depende da disponibilidade da API própria e, indiretamente, do IBGE.
- A fonte externa pode apresentar latência ou indisponibilidade.

## Repositório relacionado

O backend está em <https://github.com/mgarnier/popemjogo-api> e possui seu próprio README, Dockerfile e scripts auxiliares.
