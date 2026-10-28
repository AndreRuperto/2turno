<div align="center">

# 2 Turno

Quiz do segundo turno da eleição presidencial de 2026 (25 de outubro de 2026). Responda a perguntas sobre doze temas e veja se você está mais próximo de **Lula (PT · 13)** ou de **Flávio Bolsonaro (PL · 22)**. Cada posição dos candidatos tem como fonte o plano de governo registrado no TSE.

Português e inglês · sem cadastro

![Node.js](https://img.shields.io/badge/Node.js-22-5FA04E) ![React](https://img.shields.io/badge/React-18-61DAFB) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6) ![CI](https://github.com/AndreRuperto/2turno/actions/workflows/ci.yml/badge.svg)

</div>

## Visão geral

O site publica apenas a experiência eleitoral, em português (padrão) e inglês (`/en`):

- **Página inicial** com o teste, os dois candidatos e seções explicativas: espectro político, os 12 eixos, como funciona e um exemplo de resultado.
- **Quiz** em três durações, com o resultado eixo a eixo e a compatibilidade com cada candidato.
- **Uma página por candidato** (`/candidatos/lula-da-silva`, `/candidatos/flavio-bolsonaro`), com a posição em cada eixo e links para as páginas citadas do plano de governo.
- **Página de metodologia** (`/election-methodology`), com as fontes e as respostas marcadas como incertas.

O projeto foi construído sobre o [12 Axes](#origem-12-axes), um quiz político geral. O modelo eleitoral é um banco de dados próprio e versionado, que fica ao lado do modelo geral. O catálogo internacional e o quiz geral continuam no repositório, mas não são publicados.

## Como funciona

### Os 12 eixos

Os eixos do 2 Turno são diferentes dos eixos do 12 Axes. Foram definidos para o debate eleitoral brasileiro:

| Eixo | Primeiro polo | Segundo polo |
|------|---------------|--------------|
| Coordenação econômica | Política industrial ativa | Coordenação pelo mercado |
| Proteção social e orçamento | Ampliação da proteção social | Contenção de gastos sociais |
| Tributação | Maior progressividade | Redução geral de impostos |
| Serviços e empresas públicas | Provisão e controle públicos | Provisão privada e concessões |
| Relações de trabalho | Proteção definida em lei | Flexibilidade negociada |
| Direitos e costumes | Ampliação de direitos sociais | Preservação de normas tradicionais |
| Religião e Estado | Decisões públicas laicas | Referências religiosas na política |
| Armas de fogo | Acesso civil restrito | Acesso civil ampliado |
| Justiça penal | Reintegração e garantias processuais | Penas e encarceramento ampliados |
| Meio ambiente | Prioridade à proteção ambiental | Flexibilidade para uso de recursos |
| Política externa | Cooperação multilateral | Autonomia e acordos bilaterais |
| Equilíbrio entre Poderes | Controle judicial mais amplo | Maior margem dos Poderes eleitos |

Cada eixo vai de 0 a 100. Quanto maior a nota, mais perto do primeiro polo; 50 é o centro. Os rótulos "primeiro" e "segundo" polo não significam esquerda e direita.

### Perguntas

O banco eleitoral tem **72 perguntas**, seis por eixo: três puxam para cada polo, para que concordar com tudo não distorça o resultado. As perguntas não citam candidatos. Elas tratam de políticas concretas, como compras do SUS, jornada de trabalho, porte de armas, licenciamento ambiental e procedimentos judiciais.

| Formato | Perguntas | Por eixo |
|---------|----------:|---------:|
| Curto | 36 | 3 |
| Completo (padrão) | 60 | 5 |
| Extremo | 72 | 6 |

| Resposta | Valor |
|----------|------:|
| Concordo totalmente | 1,00 |
| Concordo | 0,75 |
| Neutro | 0,50 |
| Discordo | 0,25 |
| Discordo totalmente | 0,00 |

### Cálculo da compatibilidade

1. Em cada eixo, a nota é `100 × média das contribuições` para o primeiro polo. Em uma pergunta do segundo polo, a contribuição é `1 − concordância`.
2. A distância até um candidato é a média das diferenças absolutas nos 12 eixos, todos com o mesmo peso.
3. **Compatibilidade = 100 − distância**, com uma casa decimal (modelo `mean-absolute-distance-v1`).

As notas dos candidatos saem da mesma fórmula, aplicada às respostas codificadas de cada um. Não existe vetor mantido à mão.

### Posições dos candidatos

Cada candidato respondeu às 72 perguntas por meio de uma **interpretação editorial** do plano de governo e de atos públicos, como projetos de lei e decretos. Nenhum dos candidatos respondeu ao quiz pessoalmente. A codificação segue estas regras:

- Compromisso explícito e forte: concordo ou discordo **totalmente**.
- Posição com ressalvas: concordo ou discordo.
- Sem evidência específica: **neutro, marcado como incerto**. Isso não significa que o candidato seja moderado no tema.

Na versão atual (`brazil-presidential-2026-v2`, evidências até 05/10/2026), Lula tem 12 respostas incertas e Flávio tem 22.

### Nota metodológica

O 2 Turno é uma ferramenta para explorar propostas, não um instrumento científico nem uma recomendação de voto. Uma compatibilidade alta mostra que suas respostas estão perto das posições codificadas do candidato neste questionário. Ela não indica probabilidade de voto nem concordância com tudo o que o candidato defende. O site fala sempre em "proximidade com suas respostas", nunca em "vote em".

Os detalhes completos estão em:

- [MODEL-BRAZIL-2026.md](colinha-eleitoral/MODEL-BRAZIL-2026.md): eixos, notas, perguntas, pontuação e incertezas
- [PLANOS-2026.md](colinha-eleitoral/PLANOS-2026.md): leitura dos planos de governo e páginas citadas
- [VALIDATION-BRAZIL-2026.md](colinha-eleitoral/VALIDATION-BRAZIL-2026.md): validação do modelo

## Arquitetura

### Stack

| Camada | Tecnologia |
|--------|------------|
| Backend | Node.js 22 (`node:http`, sem dependências) |
| Frontend | React 18, TypeScript, Vite 5 |
| Dados | JSON versionado, carregado em memória na inicialização |
| Testes | `node:test` no backend, Vitest e Playwright no frontend |
| CI | GitHub Actions (testes do backend, checagem de i18n, testes e build do frontend) |

Não há banco de dados. Os dados só mudam por commits revisados, então o backend lê os JSON uma vez, valida e calcula tudo em memória.

### Dados eleitorais

| Arquivo | Conteúdo |
|---------|----------|
| `backend/data/elections/brazil-2026.json` | Modelo eleitoral: eixos, 72 perguntas, respostas codificadas e evidências dos candidatos |
| `backend/data/i18n/en/elections/brazil-2026.json` | Tradução para o inglês |
| `backend/data/elections/brazil-catalogue.json` | Registro de perfis brasileiros, usado pelos scripts do frontend (o catálogo não é publicado) |
| `frontend/src/i18n/electionEducation.json` | Textos das seções educativas da página inicial |

### Estrutura do repositório

```txt
2turno/
├── backend/                 API em Node
│   ├── src/server.js        HTTP, rotas, CORS, checagem de origem, limite por IP
│   ├── src/election.js      carga e validação do modelo, pontuação e comparação
│   ├── test/                testes (node:test)
│   └── data/                todos os JSON (eleitorais e do 12 Axes)
├── frontend/                app React + Vite
│   ├── src/ElectionApp.tsx  ponto de entrada do 2 Turno
│   ├── src/components/      election/, editorial/, results/
│   ├── src/i18n/            textos PT/EN
│   └── scripts/             geração das páginas estáticas e auditoria do build
├── colinha-eleitoral/       documentação do modelo eleitoral e dos planos de governo
├── design/                  assets de design (logos, favicons, hero, OG images)
├── docs/                    documentação interna (melhorias, validação de UI)
├── profile-audit/           pipeline de vetores do catálogo do 12 Axes
├── scripts/                 dev.mjs (sobe tudo) e checagem de i18n
└── .claude/                 skills do Claude Code para o catálogo do 12 Axes
```

### API eleitoral

Todos os endpoints aceitam `lang=pt|en`.

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/elections/brazil-2026/model` | Modelo completo: eixos, candidatos, notas e incertezas |
| `GET` | `/api/elections/brazil-2026/quiz?variant=short\|extended\|extreme` | Perguntas do formato escolhido |
| `POST` | `/api/elections/brazil-2026/results` | Calcula as respostas e devolve eixos e compatibilidade |
| `POST` | `/api/elections/brazil-2026/compare` | Compara um vetor de 12 eixos com os candidatos |

O servidor rejeita perguntas desconhecidas ou repetidas, eixos sem cobertura e seleções desbalanceadas entre os polos. As rotas `/api/**` só respondem a requisições cujo `Origin` ou `Referer` esteja em `FRONTEND_ORIGINS` e que tragam `User-Agent` e `Sec-Fetch-Site` (todo navegador manda); as outras recebem `403`. Cada IP pode fazer até 240 requisições por minuto (`429` depois disso). `/api/health` fica aberto.

## Rodando localmente

Requisitos: Node.js 20.11+ e npm.

Na raiz do repositório, um comando sobe backend e frontend, e o Ctrl+C derruba os dois:

```bash
npm run dev               # backend em :8080 e frontend em http://localhost:5173
npm run dev:prod-api      # só o frontend, usando a API de produção
```

O script instala as dependências do frontend na primeira execução e sobe o backend com `node --watch`, que reinicia sozinho quando um arquivo muda. Se já houver um backend na porta 8080, ele é reaproveitado.

Para rodar cada lado separadamente:

```bash
# Backend: http://localhost:8080
cd backend
npm run dev        # ou npm start, sem recarregar ao salvar

# Frontend: http://localhost:5173 (faz proxy de /api para o backend)
cd frontend
npm install
npm run dev
```

| Variável | Lado | Padrão | Uso |
|----------|------|--------|-----|
| `PORT` | Backend | `8080` | Porta HTTP |
| `FRONTEND_ORIGINS` | Backend | `http://localhost:5173,http://127.0.0.1:5173` | Outras origens permitidas na API, separadas por vírgula (a própria origem do site sempre é aceita) |
| `STATIC_DIR` | Backend | `frontend/dist` | Pasta do site estático servido pelo backend |
| `API_ORIGIN_ENFORCEMENT` | Backend | `true` | `false` desliga a checagem de origem |
| `API_REQUIRE_FETCH_METADATA` | Backend | `true` | `false` deixa de exigir `Sec-Fetch-Site` |
| `API_RATE_LIMIT_ENABLED` | Backend | `true` | `false` desliga o limite por IP |
| `API_RATE_LIMIT_PER_MINUTE` | Backend | `240` | Requisições por IP por minuto |
| `API_ACCESS_SAMPLE_EVERY` | Backend | `200` | Registra no log 1 a cada N acessos aceitos (`0` desliga) |
| `VITE_API_URL` | Frontend | vazio | URL base da API em produção (veja `frontend/.env.example`) |

## Testes

```bash
cd backend && npm test             # modelo eleitoral, pontuação e API HTTP
cd frontend && npm test            # Vitest
cd frontend && npm run build       # tipos, build, páginas estáticas e auditoria
cd frontend && npm run test:browser   # navegador real (Playwright + Edge), com o npm run dev rodando
python scripts/check_i18n.py       # traduções
```

O `npm run build` gera as páginas estáticas dos candidatos e da metodologia e depois roda `check-brazil-build.cjs`. Esse script falha se o build contiver páginas, retratos ou links do catálogo internacional.

O teste de navegador usa `http://127.0.0.1:5173` por padrão. Se o Vite estiver escutando só em `localhost`, rode com `ELECTION_TEST_URL=http://localhost:5173`.

## Deploy

O site está em **https://2turno.up.railway.app**, no Railway, num serviço só.

O [`railway.json`](railway.json) na raiz configura tudo: o Railway roda `npm run build` (instala e compila o frontend) e depois `npm start`, que sobe o backend Node servindo **o site e a API no mesmo domínio**. Por isso não precisa de `FRONTEND_ORIGINS` nem de `VITE_API_URL`. O healthcheck é `/api/health`, e o Railway define a `PORT` sozinho.

No painel do Railway, o **Root Directory** fica vazio (a raiz do repositório). Para rodar localmente do mesmo jeito que em produção:

```bash
npm run build --prefix frontend
npm start                      # site + API em http://localhost:8080
```

O backend serve o `frontend/dist` com URLs sem `.html`, redirecionamentos de URLs antigas e cache por tipo de arquivo ([`backend/src/static.js`](backend/src/static.js)). Se `frontend/dist` não existir, ele serve só a API. O [`backend/Dockerfile`](backend/Dockerfile) continua disponível para subir só a API em outro lugar.

Para trocar de domínio, mude `website` em `frontend/src/site.json` e as URLs em `frontend/index.html` e `frontend/election.html` (canonical, og:url e og:image).

Todo push e pull request roda o CI em `.github/workflows/ci.yml`.

## Origem: 12 Axes

O 2 Turno reaproveita a base do **12 Axes**, de Enzo Xavier Santos: um quiz político geral com 240 perguntas, doze eixos próprios e catálogos de ideologias, países e personalidades. O backend original em Java/Spring Boot foi substituído pelo backend em Node, que só implementa a API eleitoral. Continuam no repositório:

- os dados gerais em `backend/data/` (`axes.json`, `questions-pool.json`, `ideologies.json`, `countries.json`, `personalities.json` e os vetores correspondentes);
- o pipeline de auditoria de perfis em [`profile-audit/`](profile-audit/NEW_PROFILE.md) (Python) e as skills `/new_*` e `/audit_*` em `.claude/`;
- os geradores de páginas internacionais em `frontend/scripts/`, incluindo o porte em JS do algoritmo geral (`profile-match.mjs`).

Os endpoints gerais do 12 Axes (`/api/quiz`, `/api/results`, `/api/ideologies` etc.) e os testes Java do catálogo saíram junto com o backend Java. O código deles continua no repositório original, [Fuguety/2Turno](https://github.com/Fuguety/2Turno). O quiz eleitoral não converte resultados do quiz geral, porque os eixos têm significados diferentes.

## Contribuindo

Correções de posições dos candidatos devem vir com a fonte (página do plano de governo ou ato público). Mande uma mudança por pull request, rode os testes do backend e do frontend e descreva como testou. O [CONTRIBUTING.md](CONTRIBUTING.md) tem o checklist completo.

## Licença

O código, as perguntas, os perfis e os vetores do 12 Axes são © 2026 Enzo Xavier Santos, com todos os direitos reservados. O código está disponível para leitura, mas não é open source. Veja os termos completos em [LICENSE](LICENSE).
