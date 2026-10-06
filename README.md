<div align="center">

# 2 Turno

Quiz do segundo turno da eleição presidencial de 2026 (25 de outubro de 2026). Responda a perguntas sobre doze temas e veja se você está mais próximo de **Lula (PT · 13)** ou de **Flávio Bolsonaro (PL · 22)**. Cada posição dos candidatos tem como fonte o plano de governo registrado no TSE.

Português e inglês · sem cadastro

![Java](https://img.shields.io/badge/Java-21-orange) ![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3-6DB33F) ![React](https://img.shields.io/badge/React-18-61DAFB) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6) ![CI](https://github.com/AndreRuperto/2turno/actions/workflows/ci.yml/badge.svg)

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
| Backend | Java 21, Spring Boot 3.3, Maven |
| Frontend | React 18, TypeScript, Vite 5 |
| Dados | JSON versionado, carregado em memória na inicialização |
| Testes | JUnit 5, MockMvc, AssertJ, Vitest, Playwright |
| CI | GitHub Actions (testes do backend, checagem de i18n, testes e build do frontend) |

Não há banco de dados. Os dados só mudam por commits revisados, então o backend lê os JSON uma vez, valida e calcula tudo em memória.

### Dados eleitorais

| Arquivo | Conteúdo |
|---------|----------|
| `backend/src/main/resources/data/elections/brazil-2026.json` | Modelo eleitoral: eixos, 72 perguntas, respostas codificadas e evidências dos candidatos |
| `backend/src/main/resources/data/i18n/en/elections/brazil-2026.json` | Tradução para o inglês |
| `backend/src/main/resources/data/elections/brazil-catalogue.json` | Registro de perfis brasileiros (o endpoint `/catalog` ainda existe, mas o catálogo não é publicado) |
| `frontend/src/i18n/electionEducation.json` | Textos das seções educativas da página inicial |

### Estrutura do repositório

```txt
2turno/
├── backend/                 API Spring Boot
│   └── src/main/java/com/twelveaxes/
│       ├── config/          CORS, cache, checagem de origem
│       ├── controller/      ElectionController (2 Turno) e os endpoints gerais do 12 Axes
│       ├── model/           records e DTOs
│       └── service/         carga de dados, pontuação, ElectionComparisonService
├── frontend/                app React + Vite
│   ├── src/ElectionApp.tsx  ponto de entrada do 2 Turno
│   ├── src/components/      election/, editorial/, results/
│   ├── src/i18n/            textos PT/EN
│   └── scripts/             geração das páginas estáticas e auditoria do build
├── colinha-eleitoral/       documentação do modelo eleitoral e dos planos de governo
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
| `GET` | `/api/elections/brazil-2026/profiles/{id}` | Perfil de um candidato |

O servidor rejeita perguntas desconhecidas ou repetidas, eixos sem cobertura e seleções desbalanceadas entre os polos. As rotas `/api/**` só respondem a requisições cujo `Origin` ou `Referer` esteja em `FRONTEND_ORIGINS`; as outras recebem `403`. `/api/health` fica aberto.

Os endpoints gerais do 12 Axes (`/api/quiz`, `/api/results`, `/api/ideologies`, `/api/countries`, `/api/personalities`, `/api/compare`) continuam no backend, mas o site não os usa.

## Rodando localmente

Requisitos: Java 21, Maven 3.9+, Node.js 20.11+ e npm.

Na raiz do repositório, um comando sobe backend e frontend, e o Ctrl+C derruba os dois:

```bash
npm run dev               # backend em :8080 e frontend em http://localhost:5173
npm run dev:prod-api      # só o frontend, usando a API de produção (não precisa de Java)
```

O script instala as dependências do frontend na primeira execução e usa o Maven de `.tools/apache-maven-*` quando ele existe (senão, o `mvn` do PATH). Se já houver um backend na porta 8080, ele é reaproveitado. Sem Java 21, o script para com uma mensagem explicando o que instalar.

Para rodar cada lado separadamente:

```bash
# Backend: http://localhost:8080
cd backend
mvn spring-boot:run

# Frontend: http://localhost:5173 (faz proxy de /api para o backend)
cd frontend
npm install
npm run dev
```

| Variável | Lado | Padrão | Uso |
|----------|------|--------|-----|
| `PORT` | Backend | `8080` | Porta HTTP |
| `FRONTEND_ORIGINS` | Backend | localhost + Vercel | Origens permitidas para CORS e para a API |
| `API_ORIGIN_ENFORCEMENT` | Backend | `true` | `false` desliga a checagem de origem |
| `VITE_API_URL` | Frontend | vazio | URL base da API em produção (veja `frontend/.env.example`) |

## Testes

```bash
cd backend && mvn test                                            # suíte completa
cd backend && mvn -Dtest=ElectionComparisonTest,BrazilCatalogueTest test   # só o modelo eleitoral
cd frontend && npm test                                           # Vitest
cd frontend && npm run build                                      # tipos, build, páginas estáticas e auditoria
cd frontend && npm run test:browser                               # teste no navegador (Playwright)
python scripts/check_i18n.py                                      # traduções
```

O `npm run build` gera as páginas estáticas dos candidatos e da metodologia e depois roda `check-brazil-build.cjs`. Esse script falha se o build contiver páginas, retratos ou links do catálogo internacional.

Problema conhecido: o `ScorerBenchmarkTest` do catálogo geral do 12 Axes falha (75,4 contra o mínimo de 76,5). A falha já existia antes do modelo eleitoral e não afeta o 2 Turno.

## Deploy

| Parte | Configuração |
|-------|--------------|
| Backend | `backend/Dockerfile` (há também um `render.yaml` herdado do 12 Axes) |
| Frontend | `frontend/vercel.json`, saída em `frontend/dist` |

Em produção, o backend precisa de `FRONTEND_ORIGINS` com o domínio do frontend, e o frontend precisa de `VITE_API_URL` apontando para o backend. Todo push e pull request roda o CI em `.github/workflows/ci.yml`.

## Origem: 12 Axes

O 2 Turno reaproveita a base do **12 Axes**, de Enzo Xavier Santos: um quiz político geral com 240 perguntas, doze eixos próprios e catálogos de ideologias, países e personalidades. Tudo isso continua no repositório e funciona internamente:

- dados gerais em `backend/src/main/resources/data/` (`axes.json`, `questions-pool.json`, `ideologies.json`, `countries.json`, `personalities.json` e os vetores correspondentes);
- o pipeline de auditoria de perfis em [`profile-audit/`](profile-audit/NEW_PROFILE.md) e as skills `/new_*` e `/audit_*` em `.claude/`;
- os geradores de páginas internacionais em `frontend/scripts/`.

O modelo eleitoral não altera esses dados nem o algoritmo geral (`ProfileMatchScorer`). Ele também não converte resultados do quiz geral, porque os eixos têm significados diferentes.

## Contribuindo

Correções de posições dos candidatos devem vir com a fonte (página do plano de governo ou ato público). Mande uma mudança por pull request, rode os testes do backend e do frontend e descreva como testou. O [CONTRIBUTING.md](CONTRIBUTING.md) tem o checklist completo.

## Licença

O código, as perguntas, os perfis e os vetores do 12 Axes são © 2026 Enzo Xavier Santos, com todos os direitos reservados. O código está disponível para leitura, mas não é open source. Veja os termos completos em [LICENSE](LICENSE).
