# holon-minions

[![Tests](https://img.shields.io/badge/tests-244%20passing-brightgreen)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)]()
[![Effect-TS](https://img.shields.io/badge/Effect--TS-v3-purple)]()
[![License](https://img.shields.io/badge/license-MIT-green)]()

## O que e isso? / What is this?

Imagine que voce pudesse descrever uma tarefa de programacao em uma frase — "adicionar validacao no cadastro de usuarios" — e um time de agentes de IA fizesse tudo sozinho: entendesse a tarefa, planejasse a solucao, escrevesse o codigo com testes, revisasse a qualidade e abrisse um Pull Request pronto para review. Isso e o holon-minions.

Inspirado no sistema interno da Stripe (que gera mais de 1.300 PRs por semana sem humanos escreverem codigo), o holon-minions usa arquitetura holonomica — onde cada agente e autonomo (toma decisoes sozinho) mas integrado (colabora com os outros atraves de mensagens tipadas e memoria compartilhada em grafo).

O resultado? Um prompt vira codigo testado, revisado e pronto para producao.

---

Imagine describing a programming task in one sentence — "add validation to user registration" — and a team of AI agents handles everything: understands the task, plans the solution, writes tested code, reviews quality, and opens a Pull Request ready for review. That's holon-minions.

Inspired by Stripe's internal system (which ships 1,300+ PRs per week with zero human-written code), holon-minions uses holonomic architecture — where each agent is autonomous (makes its own decisions) yet integrated (collaborates through typed messages and a shared graph memory).

The result? One prompt becomes tested, reviewed, production-ready code.

---

## O problema que resolve / The problem it solves

Desenvolvedores gastam horas em tarefas repetitivas: criar branches, escrever boilerplate, rodar testes, abrir PRs. Agentes de IA existentes ajudam, mas nao completam tarefas do inicio ao fim sem intervencao humana. O holon-minions resolve isso com execucao one-shot: voce descreve, ele entrega.

Developers spend hours on repetitive tasks: creating branches, writing boilerplate, running tests, opening PRs. Existing AI agents help, but can't complete tasks end-to-end without human intervention. holon-minions solves this with one-shot execution: you describe, it delivers.

---

## Como funciona (resumo visual) / How it works (visual summary)

```
                         CLI
                          |
                      Pipeline
                          |
          +-------+-------+-------+-------+
          |       |       |       |       |
       Intake  Planner  Coder  Reviewer Scholar
          |       |       |       |       |
          +---+---+---+---+---+---+---+---+
              |       |       |       |
           Shared  Graph   Blueprint Circuit
                   Memory  Engine   Breaker
              |       |       |       |
              +---+---+---+---+---+---+
                  |       |       |
               Holon   Observ-  Shared
               Runtime ability  Types
```

---

## Arquitetura / Architecture

| Holon | Purpose | Key Functions |
|-------|---------|---------------|
| **Intake** | Classifica tarefas, extrai contexto, decompoe em subtarefas / Classifies tasks, extracts context, decomposes into subtasks | `classifyTask`, `assembleContext`, `decompose` |
| **Planner** | Pontua relevancia de arquivos, cura contexto dentro do budget de tokens, gera blueprints / Scores file relevance, curates context within token budget, builds execution blueprints | `scoreRelevance`, `curateContext`, `buildBlueprint` |
| **Coder** | Gerencia politicas de ferramentas por tipo de tarefa, executa ciclos TDD red-green-refactor / Manages tool policies per task type, drives TDD red-green-refactor cycles, self-reflects on failures | `getToolPolicy`, `createTddState`, `reflect` |
| **Reviewer** | Analise estatica, seguranca, composicao de PR / Static analysis (function length, nesting, naming), security scanning, PR composition | `reviewCode`, `scanSecurity`, `composePR` |
| **Scholar** | Extrai entidades/relacoes para o grafo de conhecimento, analisa padroes de resultado / Extracts knowledge graph entities/relations from executions, analyzes outcome patterns, applies relevance decay | `extractKnowledge`, `analyzeOutcomes`, `applyRelevanceDecay` |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 20+, TypeScript 5.7 |
| Effect System | [Effect-TS](https://effect.website/) for typed effects, dependency injection, and error handling |
| Pattern Matching | [ts-pattern](https://github.com/gvergnaud/ts-pattern) for exhaustive matching |
| Testing | Vitest + fast-check (property-based) |
| Infrastructure | PostgreSQL 16, OpenTelemetry Collector, Grafana |
| Package Manager | pnpm workspaces |

---

## Design Patterns

- **Event Sourcing** -- append-only event store for all state changes (graph-memory)
- **CQRS** -- commands write events, queries read materialized views
- **DFA State Machine** -- blueprint engine drives deterministic/agentic/gate nodes through task execution
- **Actor Model** -- holon-runtime with mailbox and supervisor for message-passing concurrency
- **Circuit Breaker + Token Bucket** -- resilience patterns for external service calls
- **TDD Engine** -- red/green/refactor cycle machine with automatic phase advancement
- **Self-Reflection Loop** -- consecutive failure detection triggers approach revision
- **Functional Core / Imperative Shell** -- pure domain logic, effects isolated at boundaries
- **Branded Types** -- `TaskId`, `BlueprintId`, `HolonId`, `EntityId` prevent type confusion

---

## Quick Start

```bash
# Clone
git clone https://github.com/Felipeness/holon-minions.git
cd holon-minions

# Install dependencies
pnpm install

# Start infrastructure (Postgres, OpenTelemetry, Grafana)
docker compose -f infra/docker-compose.yml up -d

# Run the pipeline
pnpm dev -- "add user authentication with OAuth2"

# Run tests
pnpm test
```

---

## Estrutura do Projeto / Project Structure

```
holon-minions/
├── cli/                          # CLI entry point and pipeline orchestration
│   ├── src/
│   │   ├── index.ts              # CLI argument parsing and output formatting
│   │   └── pipeline.ts           # Main pipeline chaining all holons
│   └── __tests__/
│       └── pipeline.test.ts      # Integration tests
├── holons/                       # Individual holon implementations
│   ├── intake/                   # Task classification and decomposition
│   │   ├── api/                  # Public API surface
│   │   ├── domain/               # Pure business logic
│   │   ├── infra/                # External adapters (graph-memory client)
│   │   └── __tests__/            # Unit tests
│   ├── planner/                  # Context curation and blueprint generation
│   ├── coder/                    # TDD engine, tool policies, self-reflection
│   ├── reviewer/                 # Code review, security scan, PR composition
│   └── scholar/                  # Knowledge extraction, outcome analysis, decay
├── packages/                     # Shared libraries
│   ├── shared/                   # Branded types, errors, schemas, constants
│   ├── graph-memory/             # Event-sourced graph database
│   ├── blueprint-engine/         # DFA state machine for task execution
│   ├── holon-runtime/            # Actor model with mailbox and supervisor
│   ├── circuit-breaker/          # Circuit breaker + token bucket rate limiter
│   └── observability/            # Structured logger, tracer, metrics
├── infra/                        # Infrastructure configuration
│   ├── docker-compose.yml        # Postgres, OTel Collector, Grafana
│   └── postgres/                 # Database initialization scripts
├── vitest.config.ts              # Test configuration
├── tsconfig.base.json            # Shared TypeScript config
└── pnpm-workspace.yaml           # Monorepo workspace definition
```

---

## Testes / Tests

244 testes passando em 25 test files / 244 tests passing across 25 test files

```bash
pnpm test          # Run all tests
pnpm test:watch    # Run tests in watch mode
pnpm typecheck     # Type check all packages
pnpm build         # Build all packages
pnpm lint          # Lint all TypeScript files
pnpm docker:up     # Start infrastructure services
pnpm docker:down   # Stop infrastructure services
```
