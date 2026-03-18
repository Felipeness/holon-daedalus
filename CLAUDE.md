# holon-minions

Holonomic multi-agent system using Effect-TS, event sourcing, and graph memory.

## Spec

Full architecture spec: `../holon-minions-spec.md`

## Monorepo Structure

```
holon-minions/
├── packages/           # Shared libraries
│   ├── shared/         # Branded types, errors, schemas, constants
│   ├── graph-memory/   # Event-sourced graph database (entities + relations)
│   ├── blueprint-engine/ # DFA state machine, saga orchestration
│   ├── holon-runtime/  # Actor model, mailbox, supervisor
│   ├── circuit-breaker/ # Circuit breaker + token bucket rate limiter
│   └── observability/  # Tracer, metrics, structured logger
├── holons/             # Individual holon implementations
│   ├── intake/         # Task intake and classification
│   ├── planner/        # Blueprint generation and task decomposition
│   ├── coder/          # Code generation (Ralph loop)
│   ├── reviewer/       # Code review and quality gates
│   └── scholar/        # Knowledge retrieval and learning
├── cli/                # CLI entry point
└── infra/              # Docker, Postgres schema, OTel config
```

## Package Dependency Graph

```
@holon/shared (no deps)
  └── @holon/graph-memory
  └── @holon/blueprint-engine
  └── @holon/holon-runtime
  └── @holon/circuit-breaker
  └── @holon/observability
      └── @holon/intake
      └── @holon/planner
      └── @holon/coder
      └── @holon/reviewer
      └── @holon/scholar
          └── @holon/cli
```

## Commands

```bash
# Install dependencies
pnpm install

# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Type check
pnpm typecheck

# Start infrastructure (Postgres, OTel, Grafana)
docker compose -f infra/docker-compose.yml up -d

# Stop infrastructure
docker compose -f infra/docker-compose.yml down
```

## Coding Conventions

### Effect-TS Patterns
- Use `Effect.gen` for all effectful code (generator syntax)
- Use `Data.TaggedError` for all custom errors (discriminated unions)
- Use `Context.Tag` for dependency injection (service pattern)
- Use `Layer` for service composition
- Use `Brand.nominal` for branded types (never raw strings for IDs)

### Testing
- TDD: write tests first, then implementation
- Use in-memory implementations for unit tests (no real DB)
- Use `Effect.runPromise` in tests to execute effects
- Use `Effect.provide(testLayer)` to inject test dependencies

### Type Safety
- No `any` — use `unknown` with type guards
- No `as` type assertions — use proper narrowing
- No `!` non-null assertion — handle undefined explicitly
- Branded types for all IDs (`EntityId`, `TaskId`, etc.)
- Discriminated unions for node types and errors

### Architecture
- Event sourcing for all state changes (append-only event store)
- CQRS: commands write events, queries read materialized views
- Idempotency keys on all write operations
- Correlation context propagated through all operations
