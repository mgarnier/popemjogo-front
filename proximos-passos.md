# Próximos passos do População em Jogo

## Estado atual

A implementação principal do MVP está concluída e os dois repositórios foram publicados em `origin/main`:

- `mvp-front`: commit `e17f6ea`, documentação do frontend e roteiro de entrega.
- `mvp-back`: commit `92b61bd`, documentação da API e integração com o IBGE.

Os repositórios possuem commits anteriores com a implementação, testes e infraestrutura Docker.

## Requisitos já atendidos

- Interface própria em React/Vite.
- API própria em Python/FastAPI.
- Integração com a API pública do IBGE.
- Persistência de partidas e histórico em SQLite.
- Uso de GET, POST, PUT e DELETE.
- Seleção de Brasil, região e estado.
- Sorteio de município com exibição de cidade e UF.
- População mantida em segredo durante a partida.
- Tolerância inclusiva de +/-5%.
- Vitória, desistência, histórico e limpeza do histórico.
- UUID anônimo persistido no navegador.
- Testes automatizados do backend: 23 testes aprovados.
- Testes automatizados do frontend: 15 testes aprovados.
- Dockerfile para frontend e backend.
- Docker Compose com frontend, backend, volume SQLite e serviços de teste.
- READMEs dos dois repositórios.
- Diagrama arquitetural no README do frontend.
- Scripts auxiliares de build, execução e testes.
- Roteiro do vídeo em [VIDEO.md](VIDEO.md).

## Pendências

1. Executar e validar o Docker Compose em um ambiente com Docker Desktop.
2. Confirmar a execução do fluxo completo dentro dos containers.
3. Atualizar a documentação com os resultados reais da validação Docker.
4. Confirmar os termos de uso e eventuais requisitos de atribuição dos serviços do IBGE.
5. Gravar o vídeo final com duração máxima de seis minutos.

## Validação Docker

Pré-requisitos:

```powershell
docker version
docker compose version
```

A partir da raiz de `mvp-front`:

```powershell
cd C:\caminho\para\mvp-arq\mvp-front
docker compose config
docker compose build --no-cache
docker compose up -d
docker compose ps
docker compose logs backend frontend
```

Endereços esperados:

- Interface: <http://localhost:8080>
- API: <http://localhost:8000>
- Swagger: <http://localhost:8000/docs>
- Healthcheck: <http://localhost:8000/api/v1/health>

## Testes nos containers

```powershell
docker compose --profile test run --rm backend-test
docker compose --profile test run --rm frontend-test
```

Os dois comandos devem terminar com sucesso.

## Fluxo funcional a validar

1. Abrir a interface em `http://localhost:8080`.
2. Confirmar o carregamento de regiões e estados.
3. Criar uma partida nacional.
4. Criar uma partida por região.
5. Criar uma partida por estado.
6. Confirmar que cidade e UF aparecem após o sorteio.
7. Confirmar que a população permanece oculta.
8. Enviar um palpite abaixo ou acima da população.
9. Confirmar a mensagem de direção e o contador de tentativas.
10. Acertar dentro da tolerância ou desistir para revelar a resposta.
11. Consultar o histórico.
12. Limpar o histórico com confirmação.
13. Reiniciar o backend e verificar se o histórico persistido continua disponível.

Para interromper os serviços sem remover o banco:

```powershell
docker compose down
```

Para remover também o banco SQLite do volume, somente quando essa perda for intencional:

```powershell
docker compose down -v
```

## Entrega em vídeo

Seguir o roteiro de [VIDEO.md](VIDEO.md), cobrindo:

- Objetivo do jogo.
- Arquitetura e comunicação entre os módulos.
- Consulta ao IBGE.
- Swagger e rotas da API.
- Execução pelo Docker Compose.
- Fluxo da interface.
- Testes e limitações.

A execução real do Docker Compose ainda não foi validada neste ambiente porque o comando `docker` não estava disponível.
