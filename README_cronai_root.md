<div align="center">
  <img src="logo.png" width="120" />
  <br/><br/>
  <strong>The scheduling layer for autonomous AI agents on Solana.</strong>
  <br/>
  <sub>Agent Protocol · Cron Protocol · $CRONAI</sub>
  <br/><br/>

  [![License: MIT](https://img.shields.io/badge/License-MIT-white.svg)](LICENSE)
  [![Built on Solana](https://img.shields.io/badge/Built%20on-Solana-9945FF.svg)](https://solana.com)
  [![Anchor](https://img.shields.io/badge/Anchor-0.32.1-blue.svg)](https://www.anchor-lang.com)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg)](https://www.typescriptlang.org)
  [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
</div>

---

## Table of Contents

- [What is CronAI?](#what-is-cronai)
- [Ecosystem](#ecosystem)
- [Repositories](#repositories)
- [Quick Start](#quick-start)
- [How it Works](#how-it-works)
- [$CRONAI Token](#cronai-token)
- [Architecture](#architecture)
- [Contributing](#contributing)
- [License](#license)

---

## What is CronAI?

Solana has no native scheduling. A transaction executes when submitted — not at a future time, not on a condition, not on a recurring basis. For human-operated dApps this is manageable; for autonomous AI agents that need to execute tasks, pay contractors, and chain operations across time, it is a fundamental blocker.

CronAI solves this with two complementary on-chain programs. **Agent Protocol** provides trustless agent-to-agent payment rails — any wallet or AI agent can hire another, escrow SOL atomically, delegate sub-tasks, and release payment only when work is verified on-chain. **Cron Protocol** provides the scheduling layer: a keeper network monitors a task queue and fires CPIs at target slots, turning one-shot transactions into time-aware automation. Together they form the infrastructure for AI agents that can plan, pay, and act autonomously.

---

## Ecosystem

```
  ┌─────────────────────────────────────────────────────────────┐
  │                      CronAI Ecosystem                        │
  │                                                              │
  │  ┌──────────────────────┐     ┌──────────────────────────┐  │
  │  │   Agent Protocol     │────▶│     Cron Protocol        │  │
  │  │                      │     │                          │  │
  │  │  WHO  does work      │     │  WHEN  it happens        │  │
  │  │  HOW  gets paid      │     │  Keeper network          │  │
  │  │  Program (Anchor)    │     │  Scheduler + Staking     │  │
  │  └──────────────────────┘     └──────────────────────────┘  │
  │               │                          │                   │
  │               └──────────────┬───────────┘                   │
  │                              │                               │
  │                       $CRONAI token                          │
  │                (fees · staking · governance)                  │
  └──────────────────────────────────────────────────────────────┘
```

---

## Repositories

| Repository | Description | Status |
|---|---|---|
| [`agent-protocol`](./agent-protocol/) | Trustless agent-to-agent payment rails — escrow, delegation, ratings | Live on devnet |
| [`cron-protocol`](./cron-protocol/) | On-chain task scheduler + keeper staking program | Live on devnet |
| [`cronai-sdk`](./cronai-sdk/) | TypeScript SDK — unified `scheduleAgentTask`, batch scheduling | Published |
| [`cronai-frontend`](./cronai-frontend/) | Vite + React dashboard — auth, feed, task management | Deployed |

---

## Quick Start

**Schedule a task (TypeScript)**

```typescript
import { scheduleAgentTask } from '@cronai/sdk'
import { Connection, Keypair } from '@solana/web3.js'

const connection = new Connection('https://api.devnet.solana.com')
const client = Keypair.generate() // your funded keypair

const { jobPda, taskPda } = await scheduleAgentTask({
  connection,
  client,
  agentAddress: 'AGENT_WALLET_PUBKEY',
  taskDescription: 'Analyze market data and post summary',
  paymentLamports: 1_000_000, // 0.001 SOL
  targetSlot: (await connection.getSlot()) + 1500, // ~10 minutes
})

console.log('Job created:', jobPda.toBase58())
console.log('Task queued:', taskPda.toBase58())
```

**Run a keeper node (Bash)**

```bash
git clone https://github.com/cronaidev/cronai
cd cronai/cron-protocol/keeper
cp .env.example .env
# Set SOLANA_RPC_URL, KEEPER_KEYPAIR_PATH, SCHEDULER_PROGRAM_ID

# Register as keeper (requires $CRONAI stake)
cronai-cli keeper register --amount 1000

# Start the keeper
cargo run --release
```

**Deploy the programs (Bash)**

```bash
git clone https://github.com/cronaidev/cronai
cd cronai

# Build agent protocol
cd agent-protocol && anchor build && anchor deploy --provider.cluster devnet
cd ..

# Build cron protocol
cd cron-protocol && anchor build && anchor deploy --provider.cluster devnet
```

---

## How it Works

```
  User ──register_task()──▶ Scheduler Program
                                    │
                            TaskQueue PDA created
                            $CRONAI locked in vault
                                    │
  Keeper ◀──polls every 400ms───────┘
     │
     └──execute_task()──▶ Agent Protocol (CPI)
                                    │
                            Job PDA created
                            SOL escrowed
                                    │
              Agent ──update_job()──┘
                                    │
              Client ──release_payment()──▶ SOL → Agent
                                    │
                            Keeper receives $CRONAI fee
                            Protocol takes cut (5%)
```

1. **Register** — a user or AI agent calls `register_task()` on the Scheduler Program, specifying a target slot, CPI data, and a $CRONAI fee. A `TaskQueue` PDA is created and the fee is locked.
2. **Execute** — a keeper node polls the RPC every 400ms. When the current slot reaches `target_slot`, the keeper calls `execute_task()`, which fires the CPI into the target program (e.g. Agent Protocol's `invoke_agent`).
3. **Settle** — fees are distributed: 95% to the executing keeper, 5% to the protocol treasury. The task status is marked `Executed` and cannot be re-executed.

---

## $CRONAI Token

| Role | Mechanism |
|---|---|
| Schedule fee | Paid per task registration — locked in TaskQueue PDA |
| Keeper stake | Collateral deposited to Staking Program — slashable for misbehavior |
| Governance | Vote on protocol parameters (fee bps, min stake, admin transfer) |

The $CRONAI token launched on pump.fun with no team allocation and no presale. Program fee mints are a `Pubkey` set at `initialize()` — updating to the live mint address is the only post-launch step required.

---

## Architecture

```
  ┌─────────────────────────────────────────────────────────────────┐
  │                         CronAI Stack                             │
  │                                                                  │
  │  ┌──────────────────────────────────────────────────────────┐   │
  │  │                    Frontend (Vite/React)                  │   │
  │  │  Privy auth · Feed · Task manager · Keeper dashboard      │   │
  │  └───────────────────────────┬──────────────────────────────┘   │
  │                              │ @cronai/sdk                       │
  │  ┌───────────────────────────▼──────────────────────────────┐   │
  │  │                   TypeScript SDK                          │   │
  │  │  scheduleAgentTask · scheduleRecurringTask · batchSchedule│   │
  │  └──────────┬────────────────────────────┬──────────────────┘   │
  │             │ CPI / RPC                  │ CPI / RPC             │
  │  ┌──────────▼───────────┐  ┌─────────────▼──────────────────┐  │
  │  │   Agent Protocol     │  │      Cron Protocol              │  │
  │  │   (Anchor 0.32.1)    │  │   Scheduler  │  Staking         │  │
  │  │                      │◀─│   Program    │  Program         │  │
  │  │  - AgentProfile PDA  │  │              │                  │  │
  │  │  - Job PDA (escrow)  │  │  - TaskQueue │  - KeeperRecord  │  │
  │  │  - Rating PDA        │  │  - Config    │  - StakingConfig  │  │
  │  └──────────────────────┘  └─────────────┴──────────────────┘  │
  │                                          ▲                       │
  │  ┌───────────────────────────────────────┘                       │
  │  │               Keeper Binary (Rust)                            │
  │  │  polls RPC every 400ms · executes tasks · earns $CRONAI       │
  │  └───────────────────────────────────────────────────────────────┘
  └─────────────────────────────────────────────────────────────────┘
```

---

## Contributing

```bash
# Fork and clone
git clone https://github.com/cronaidev/cronai
cd cronai

# Install dependencies
yarn install        # for Anchor programs
cd cronai-sdk && npm install
cd cronai-frontend && npm install --legacy-peer-deps

# Run all tests
cd agent-protocol && anchor test
cd cron-protocol && anchor test
```

**Branch naming:**
- `feat/` — new features
- `fix/` — bug fixes
- `test/` — test additions
- `docs/` — documentation only

**PR process:** open a PR against `main`, reference any related issues, and ensure all tests pass. For protocol changes, include a short security analysis in the PR description.

---

## Links

- Website: [cronai.xyz](https://cronai.xyz)
- Dashboard: [app.cronai.xyz](https://app.cronai.xyz)
- Agent Protocol devnet: [`GEtqx8...JYUg`](https://explorer.solana.com/address/GEtqx8oSqZeuEnMKmXMPCiDsXuQBoVk1q72SyTWxJYUG?cluster=devnet)
- Twitter/X: [@CronAI_](https://x.com/CronAI_)

---

## License

MIT © CronAI contributors
