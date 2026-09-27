# Roteiro do vídeo de entrega

Duração máxima: 6 minutos.

## 1. Objetivo - 0:00 a 0:40

- Apresentar o População em Jogo.
- Explicar que o jogador escolhe um recorte geográfico e estima a população de uma cidade brasileira.
- Mostrar que a margem de acerto é de +/-5%.

## 2. Arquitetura - 0:40 a 1:30

- Mostrar o diagrama do README.
- Identificar os três módulos:
  - frontend React/Vite;
  - API FastAPI;
  - serviços públicos do IBGE.
- Explicar que o navegador chama a API própria e não o IBGE diretamente.
- Explicar que o SQLite persiste o histórico de partidas.

## 3. Containers e comunicação - 1:30 a 2:20

- Mostrar o `docker-compose.yml`.
- Mostrar os serviços `frontend` e `backend`.
- Mostrar o volume `sqlite_data`.
- Explicar o proxy Nginx de `/api` para `backend:8000`.
- Mostrar os comandos `docker compose build` e `docker compose up`.

Se Docker ainda não estiver disponível durante a gravação, indicar isso como limitação da validação local e demonstrar a configuração e os scripts.

## 4. API e IBGE - 2:20 a 3:30

- Abrir o Swagger em `/docs`.
- Demonstrar `GET /api/v1/health`.
- Mostrar as rotas de regiões e estados.
- Mostrar `POST /api/v1/partidas`.
- Explicar o header `X-Player-Id`.
- Mostrar que a partida retorna cidade e UF, mas não retorna a população ativa.
- Explicar que o backend consulta o IBGE a cada nova partida e não armazena o catálogo como cache.

## 5. Fluxo da interface - 3:30 a 5:20

- Criar uma partida nacional.
- Criar uma partida por região.
- Criar uma partida por estado.
- Mostrar cidade e UF sorteadas.
- Enviar um palpite abaixo ou acima da população.
- Mostrar a mensagem de direção e o contador de tentativas.
- Acertar dentro da tolerância ou desistir para revelar a resposta.
- Abrir o histórico.
- Limpar o histórico com confirmação.

## 6. Testes e limitações - 5:20 a 6:00

- Mostrar `mvp-back/test.ps1` e `mvp-front/test.ps1`.
- Informar os resultados atuais: 23 testes no backend e 15 no frontend.
- Explicar que o UUID do navegador é anônimo e não substitui autenticação.
- Informar que SQLite é adequado ao MVP com uma instância do backend.
- Encerrar destacando a comunicação interface -> API própria -> IBGE.
