# holon-minions

Holonomic multi-agent system for autonomous software development, powered by Effect-TS, event sourcing, and graph memory.

## Architecture

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

## Holons

| Holon | Purpose | Key Functions |
|-------|---------|---------------|
| **Intake** | Classifies tasks, extracts context, decomposes into subtasks | `classifyTask`, `assembleContext`, `decompose` |
| **Planner** | Scores file relevance, curates context within token budget, builds execution blueprints | `scoreRelevance`, `curateContext`, `buildBlueprint` |
| **Coder** | Manages tool policies per task type, drives TDD red-green-refactor cycles, self-reflects on failures | `getToolPolicy`, `createTddState`, `reflect` |
| **Reviewer** | Static analysis (function length, nesting, naming), security scanning, PR composition | `reviewCode`, `scanSecurity`, `composePR` |
| **Scholar** | Extracts knowledge graph entities/relations from executions, analyzes outcome patterns, applies relevance decay | `extractKnowledge`, `analyzeOutcomes`, `applyRelevanceDecay` |

## Tech Stack

- **Runtime**: Node.js 20+, TypeScript 5.7
- **Effect System**: [Effect-TS](https://effect.website/) for typed effects, dependency injection, and error handling
- **Pattern Matching**: [ts-pattern](https://github.com/gvergnaud/ts-pattern) for exhaustive matching
- **Testing**: Vitest + fast-check (property-based)
- **Infrastructure**: PostgreSQL 16, OpenTelemetry Collector, Grafana
- **Package Manager**: pnpm workspaces

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

## Project Structure

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

## Commands

```bash
pnpm test          # Run all tests
pnpm test:watch    # Run tests in watch mode
pnpm typecheck     # Type check all packages
pnpm build         # Build all packages
pnpm lint          # Lint all TypeScript files
pnpm docker:up     # Start infrastructure services
pnpm docker:down   # Stop infrastructure services
```
