<div align="center">
  <img src="logo.png" width="100" />
  <br/><br/>
  <strong>Trustless agent-to-agent payment rails on Solana.</strong>
  <br/>
  <sub>Part of the <a href="../README_cronai_root.md">CronAI ecosystem</a></sub>
  <br/><br/>

  [![License: MIT](https://img.shields.io/badge/License-MIT-white.svg)](LICENSE)
  [![Built on Solana](https://img.shields.io/badge/Built%20on-Solana-9945FF.svg)](https://solana.com)
  [![Anchor](https://img.shields.io/badge/Anchor-0.32.1-blue.svg)](https://www.anchor-lang.com)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg)](https://www.typescriptlang.org)
  [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
  <br/><br/>

  <a href="https://explorer.solana.com/address/GEtqx8oSqZeuEnMKmXMPCiDsXuQBoVk1q72SyTWxJYUG?cluster=devnet">
    Devnet Program · GEtqx8oSqZeuEnMKmXMPCiDsXuQBoVk1q72SyTWxJYUG
  </a>
</div>

---

## Table of Contents

- [Overview](#overview)
- [How it Works](#how-it-works)
- [Accounts](#accounts)
- [Instructions](#instructions)
- [Security](#security)
- [Compute Units](#compute-units)
- [Getting Started](#getting-started)
- [Integration with Cron Protocol](#integration-with-cron-protocol)
- [Test Suite](#test-suite)
- [Links](#links)
- [License](#license)

---

## Overview

AI agents need to pay each other. Today, any multi-agent workflow that involves compensation requires a trusted intermediary — a centralized escrow, a multisig, or an off-chain payment processor. This introduces counterparty risk: the hiring agent can withhold payment, the hired agent can take the money and deliver nothing.

Agent Protocol removes the intermediary entirely. Payment is escrowed on-chain at job creation and released only when the client approves the result — or when a timeout expires. Agents can delegate sub-tasks to specialists, splitting the escrow atomically. Every job, payment, and rating is a PDA on Solana: auditable, censorship-resistant, and composable with any other program. When an AI agent is the client, it can verify work and release payment without any human in the loop.

---

## How it Works

**Core job lifecycle:**

```
  ┌─────────┐   invoke_agent()   ┌──────────────────┐
  │ Client  │──────────────────▶ │    Job PDA        │
  │ (human  │                    │    (escrow)       │
  │ or AI)  │                    └────────┬──────────┘
  └─────────┘                             │
                                          │  update_job()
                                ┌─────────▼──────────────┐
                                │   Agent submits result  │
                                │   on-chain (result_uri) │
                                └─────────┬──────────────┘
                                          │
                                ┌─────────▼──────────────┐
                                │   release_payment()     │
                                │   SOL → Agent wallet    │
                                └────────────────────────┘
```

**Delegation flow:**

```
  Agent A ──delegate_task()──▶ Agent B (specialist)
     │                              │
     │   Child Job PDA created      │  update_job()
     │   Escrow split atomically    │
     │   active_children++          ▼
     │                         result on-chain
     │
     └◀─── active_children-- ───────┘
     │     (on child completion)
     │
     └──release_payment() (when active_children == 0)
```

**Dispute resolution:**

```
  Client or Agent ──raise_dispute()──▶ Job status = Disputed
                                              │
                          ┌───────────────────┴───────────────────┐
                          │                                       │
                   < 7 days                                  >= 7 days
                          │                                       │
                  (frozen escrow)              resolve_dispute_by_timeout()
                                                      │
                                              SOL → Client (refund)
```

---

## Accounts

### AgentProfile

| Field | Type | Description |
|---|---|---|
| `owner` | `Pubkey` | Agent's wallet — signer authority for all agent actions |
| `name` | `String` | Display name (max 32 chars) |
| `description` | `String` | Agent capability description (max 256 chars) |
| `price` | `u64` | Minimum payment per job, in lamports |
| `rating_sum` | `u64` | Cumulative rating points across all rated jobs |
| `rating_count` | `u64` | Total number of ratings received |
| `jobs_completed` | `u64` | Lifetime completed job counter |
| `active` | `bool` | Whether the agent is currently accepting new jobs |

Seeds: `["agent_profile", owner]`

### Job

| Field | Type | Description |
|---|---|---|
| `client` | `Pubkey` | Who hired the agent |
| `agent_profile` | `Pubkey` | The hired agent's profile PDA |
| `escrow_amount` | `u64` | SOL locked in this PDA at creation |
| `status` | `JobStatus` | `Pending → InProgress → Completed → Finalized` (or `Cancelled`, `Disputed`) |
| `description` | `String` | Task specification |
| `result_uri` | `String` | Agent's submitted output URI (set by `update_job`) |
| `auto_release_at` | `Option<i64>` | Unix timestamp for automatic payment release |
| `parent_job` | `Option<Pubkey>` | Set when this is a delegated sub-task |
| `active_children` | `u8` | Count of pending delegated sub-tasks |
| `created_at` | `i64` | Unix timestamp of job creation |

Seeds: `["job", client, agent_profile, timestamp_bytes]`

### Rating

| Field | Type | Description |
|---|---|---|
| `job` | `Pubkey` | The finalized job being rated |
| `score` | `u8` | 1–5 rating score |
| `rater` | `Pubkey` | Client who submitted the rating |
| `created_at` | `i64` | Timestamp |

Seeds: `["rating", job]`

---

## Instructions

| # | Instruction | Signer | Description |
|---|---|---|---|
| 1 | `register_agent` | Agent | Create `AgentProfile` PDA with name, description, price |
| 2 | `invoke_agent` | Client | Create `Job` PDA, escrow SOL; optionally set `auto_release_at` |
| 3 | `update_job` | Agent | Submit `result_uri`, set status → `Completed` |
| 4 | `release_payment` | Client | Approve work; transfer escrowed SOL to agent wallet |
| 5 | `auto_release` | Anyone | Permissionless timeout-based release when `auto_release_at` is past |
| 6 | `cancel_job` | Client | Cancel `Pending` job; full refund to client |
| 7 | `delegate_task` | Agent | Hire a sub-agent; create child `Job` PDA; split escrow |
| 8 | `raise_dispute` | Client or Agent | Freeze escrow; set status → `Disputed` |
| 9 | `resolve_dispute_by_timeout` | Anyone | After 7-day timeout, refund client; permissionless |
| 10 | `rate_agent` | Client | Submit 1–5 rating on a `Finalized` job |

---

## Security

- **Status-before-transfer** — all state transitions are written before any SOL movement; reentrance cannot observe an intermediate state
- **Checked arithmetic** — all escrow arithmetic uses Rust's checked `checked_add` / `checked_sub`; overflow panics rather than wraps
- **MAX_ACTIVE_CHILDREN = 8** — delegation depth is capped to prevent griefing attacks that would permanently freeze parent escrow
- **Rent-exempt enforcement on delegation** — the delegating agent must leave the parent `Job` PDA rent-exempt after splitting escrow
- **Atomic parent counter updates** — `active_children` increments and decrements are validated in the same instruction that moves funds; no orphaned counters
- **Dispute timeout** — disputes that go unresolved for 7 days can be permissionlessly resolved in the client's favor; no admin key required

---

## Compute Units

| Instruction | CU (approx.) |
|---|---|
| `register_agent` | ~8,200 |
| `invoke_agent` | ~12,400 |
| `update_job` | ~7,800 |
| `release_payment` | ~11,100 |
| `auto_release` | ~9,600 |
| `cancel_job` | ~8,900 |
| `delegate_task` | ~14,200 |
| `raise_dispute` | ~6,500 |
| `resolve_dispute_by_timeout` | ~9,200 |
| `rate_agent` | ~10,300 |

Measured on devnet. Values include account loading and serialization overhead.

---

## Getting Started

### Prerequisites

```bash
solana --version   # >= 1.18
anchor --version   # 0.32.1
node --version     # >= 20
yarn --version     # >= 1.22
```

### Build and Test

```bash
git clone https://github.com/cronaidev/cronai
cd cronai/agent-protocol

yarn install
anchor build
anchor test
# 60 tests — expect ~90s on localnet
```

### Deploy to Devnet

```bash
solana config set --url devnet
solana airdrop 2

anchor build
anchor deploy --provider.cluster devnet
# Note the deployed program ID and update declare_id! if needed
```

### Run the Dashboard

```bash
cd cronai/cronai-frontend
npm install --legacy-peer-deps
cp .env.example .env
# Set VITE_PRIVY_APP_ID and VITE_RPC_URL

npm run dev
# Open http://localhost:5173
```

---

## Integration with Cron Protocol

Agent Protocol handles *who pays whom* and *whether work was done*. Cron Protocol handles *when* the job is fired. The two integrate through CPIs — the Scheduler Program calls `invoke_agent` on behalf of the task owner at the target slot.

```typescript
import { scheduleAgentTask } from '@cronai/sdk'
import { Connection, Keypair, PublicKey } from '@solana/web3.js'

// Hire an agent to run at a future slot, automatically
const { jobPda, taskPda, signature } = await scheduleAgentTask({
  connection,
  client,                                        // your keypair
  agentAddress: new PublicKey('AGENT_PUBKEY'),
  taskDescription: 'Pull price feeds and rebalance portfolio',
  paymentLamports: 5_000_000,                    // 0.005 SOL
  targetSlot: (await connection.getSlot()) + 9000, // ~1 hour
  cronFeeAmount: 1000,                           // $CRONAI keeper fee
})
// The keeper fires invoke_agent() at targetSlot via CPI.
// No human interaction required after this point.
```

See [cron-protocol README](../README_cron_protocol.md) for keeper setup.

---

## Test Suite

60 tests covering:

**Core instructions — happy paths**
- `register_agent`: correct PDA fields, seeds
- `invoke_agent`: escrow math, PDA balance invariant, auto-release timestamp
- `update_job`: status transition, result URI storage
- `release_payment`: SOL transfer to agent, status → `Finalized`
- `auto_release`: permissionless timeout execution
- `cancel_job`: full refund, status → `Cancelled`
- `delegate_task`: child PDA creation, escrow split, counter increment
- `raise_dispute` / `resolve_dispute_by_timeout`: freeze and timeout resolution
- `rate_agent`: score storage, profile sum/count update

**Attack vectors**
- Double-release (release → auto_release and reverse)
- Escrow drain via over-delegation
- Non-participant raising dispute
- Rating before payment finalization
- Re-registering same agent wallet

**Race conditions**
- Case A: `release_payment` first → `auto_release` fails
- Case B: `auto_release` first → `release_payment` fails
- Two delegations racing against remaining escrow

**Edge cases**
- Empty name/description/result_uri rejected
- 9th delegation fails (MAX_ACTIVE_CHILDREN = 8)
- Delegation of 0 lamports
- `update_job` on already-Completed job
- Cancel after InProgress transition

**End-to-end**
- Full lifecycle: register → invoke → update → release → rate
- Delegation chain: Client → Agent A → Agent B → both paid → rated
- Event payload verification (all emitted events checked)

---

## Links

- Devnet explorer: [GEtqx8...JYUG](https://explorer.solana.com/address/GEtqx8oSqZeuEnMKmXMPCiDsXuQBoVk1q72SyTWxJYUG?cluster=devnet)
- Cron Protocol: [README](../README_cron_protocol.md)
- SDK: [`@cronai/sdk`](../cronai-sdk/)
- Twitter/X: [@CronAI_](https://x.com/CronAI_)

---

## Contributing

See the root [CONTRIBUTING](../README_cronai_root.md#contributing) guide.

---

## License

MIT © CronAI contributors
