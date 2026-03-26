<div align="center">
  <img src="logo.png" width="100" />
  <br/><br/>
  <strong>On-chain task scheduling for Solana.</strong>
  <br/>
  <sub>Part of the <a href="../README_cronai_root.md">CronAI ecosystem</a> · The spiritual successor to Clockwork</sub>
  <br/><br/>

  [![License: MIT](https://img.shields.io/badge/License-MIT-white.svg)](LICENSE)
  [![Built on Solana](https://img.shields.io/badge/Built%20on-Solana-9945FF.svg)](https://solana.com)
  [![Anchor](https://img.shields.io/badge/Anchor-0.32.1-blue.svg)](https://www.anchor-lang.com)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg)](https://www.typescriptlang.org)
  [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
</div>

---

## Table of Contents

- [Overview](#overview)
- [How it Works](#how-it-works)
- [Accounts](#accounts)
- [Instructions](#instructions)
- [Error Codes](#error-codes)
- [Running a Keeper Node](#running-a-keeper-node)
- [Integration with Agent Protocol](#integration-with-agent-protocol)
- [$CRONAI Token](#cronai-token)
- [Security Considerations](#security-considerations)
- [Comparison with Clockwork](#comparison-with-clockwork)
- [Getting Started](#getting-started)
- [Test Suite](#test-suite)
- [Links](#links)
- [License](#license)

---

## Overview

Solana processes transactions when they are submitted, not when a developer wants them to run. There is no `setTimeout`, no cron daemon, no native timer primitive. Clockwork attempted to solve this, but the project has been abandoned and is no longer maintained. Protocols that depend on it have no upgrade path.

Cron Protocol is a live replacement. A `TaskQueue` PDA stores the target slot, CPI data, and $CRONAI fee for each scheduled task. A decentralized keeper network polls the chain every 400ms; when the current slot reaches `target_slot`, a keeper calls `execute_task()`, which fires the CPI into any target program. The first keeper to execute a task wins the fee — the optimistic locking pattern ensures exactly-once execution even under concurrent attempts.

The $CRONAI token is the native fee currency. Keepers stake $CRONAI as collateral when registering and earn $CRONAI for each task they execute. This creates a direct economic alignment: keepers are incentivized to stay online and execute promptly, because latency means someone else takes the fee.

---

## How it Works

```
  User / dApp
      │
      │  register_task(target_slot, cpi_data, cronai_fee)
      ▼
  ┌─────────────────────────────────────────────────────┐
  │               Scheduler Program                      │
  │                                                      │
  │  ┌──────────────────┐    ┌────────────────────────┐  │
  │  │   TaskQueue PDA  │    │   ProtocolConfig PDA   │  │
  │  │                  │    │                        │  │
  │  │  target_slot     │    │  fee_mint (CRONAI)     │  │
  │  │  cpi_data        │    │  min_keeper_stake      │  │
  │  │  status: Pending │    │  fee_bps (500 = 5%)    │  │
  │  │  fee_amount      │    │  paused: false         │  │
  │  │  owner           │    │  admin                 │  │
  │  └──────────────────┘    └────────────────────────┘  │
  └────────────────────────────────┬────────────────────┘
                                   │
                                   │ keeper polls every 400ms
                                   │
  ┌────────────────────────────────▼────────────────────┐
  │                   Keeper Network                     │
  │                                                      │
  │  ● Registered via Staking Program                    │
  │  ● $CRONAI staked as collateral (slashable)          │
  │  ● Monitors all TaskQueue accounts                   │
  │  ● Executes tasks atomically at target_slot          │
  └────────────────────────────────┬────────────────────┘
                                   │
                                   │  execute_task() → CPI
                                   ▼
                           Target Program
                       (Agent Protocol, DeFi,
                        any Solana program)
                                   │
                                   ▼
                         95% fee → Keeper
                          5% fee → Protocol treasury
                       status: Pending → Executed
```

---

## Accounts

### ProtocolConfig

| Field | Type | Description |
|---|---|---|
| `admin` | `Pubkey` | Authority for `update_config` |
| `fee_mint` | `Pubkey` | SPL mint used for task fees ($CRONAI after launch) |
| `fee_bps` | `u16` | Protocol cut in basis points (e.g. 500 = 5%) |
| `min_keeper_stake` | `u64` | Minimum $CRONAI a keeper must stake to register |
| `paused` | `bool` | Emergency circuit breaker; blocks `register_task` |

Seeds: `["protocol_config"]`

### TaskQueue

| Field | Type | Description |
|---|---|---|
| `owner` | `Pubkey` | Who registered the task — authority for `cancel_task` |
| `target_slot` | `u64` | Slot at or after which the task may be executed |
| `cpi_data` | `Vec<u8>` | Serialized instruction data passed to the target program |
| `target_program` | `Pubkey` | Program to CPI into |
| `fee_amount` | `u64` | $CRONAI fee locked in this PDA |
| `status` | `TaskStatus` | `Pending → Executed` or `Cancelled` |
| `created_at` | `i64` | Unix timestamp |
| `executed_at` | `Option<i64>` | Timestamp of execution |
| `keeper` | `Option<Pubkey>` | Keeper that executed (set at execution) |

Seeds: `["task_queue", owner, target_slot_bytes]`

### KeeperRecord

| Field | Type | Description |
|---|---|---|
| `keeper` | `Pubkey` | Keeper's wallet |
| `staked_amount` | `u64` | $CRONAI currently staked |
| `active` | `bool` | Whether the keeper is eligible to execute tasks |
| `slash_count` | `u8` | Cumulative slashes (deactivated at `max_slash_count`) |
| `tasks_executed` | `u64` | Lifetime execution counter |
| `registered_at` | `i64` | Timestamp |

Seeds: `["keeper_record", keeper]`

### StakingConfig

| Field | Type | Description |
|---|---|---|
| `admin` | `Pubkey` | Authority for staking governance |
| `fee_mint` | `Pubkey` | Matches `ProtocolConfig.fee_mint` |
| `min_stake` | `u64` | Minimum stake to register |
| `slash_amount` | `u64` | $CRONAI deducted per slash event |
| `max_slash_count` | `u8` | Slashes before automatic deactivation |

Seeds: `["staking_config"]`

---

## Instructions

### Scheduler Program

| Instruction | Signer | Description | Key Validations |
|---|---|---|---|
| `initialize` | Admin | Create `ProtocolConfig` PDA | One-time; seeds must be unoccupied |
| `register_task` | Owner | Create `TaskQueue` PDA, lock fee | `target_slot > current_slot`; protocol not paused; fee > 0 |
| `execute_task` | Keeper | CPI to target program, distribute fees | `current_slot >= target_slot`; status == `Pending`; keeper active + sufficient stake |
| `cancel_task` | Owner | Mark `Cancelled`, refund fee | `status == Pending`; signer == `owner` |
| `update_config` | Admin | Update fee_bps, min_stake, pause | `fee_bps <= 2000` (max 20%); signer == `admin` |

### Staking Program

| Instruction | Signer | Description | Key Validations |
|---|---|---|---|
| `initialize_staking` | Admin | Create `StakingConfig` PDA | One-time |
| `register_keeper` | Keeper | Create `KeeperRecord`, deposit stake | `staked_amount >= min_stake` |
| `deregister_keeper` | Keeper | Close `KeeperRecord`, return stake | `active == true`; no in-flight obligations |
| `slash_keeper` | Admin | Deduct `slash_amount` from stake | Auto-deactivates at `max_slash_count` |

---

## Error Codes

| Error | Code | Description |
|---|---|---|
| `SlotNotReached` | 6000 | Target slot is in the future — task cannot execute yet |
| `TaskAlreadyExecuted` | 6001 | Task status is `Executed` — optimistic lock prevents re-execution |
| `TaskAlreadyCancelled` | 6002 | Task status is `Cancelled` — no further state transitions |
| `NotTaskOwner` | 6003 | Signer is not the task owner |
| `KeeperNotRegistered` | 6004 | Executing wallet has no `KeeperRecord` |
| `KeeperInsufficientStake` | 6005 | Keeper's staked amount is below `min_keeper_stake` |
| `KeeperInactive` | 6006 | Keeper has been deactivated (slash count exceeded) |
| `InsufficientFee` | 6007 | Task fee is zero |
| `ProtocolPaused` | 6008 | Admin has paused the protocol — `register_task` blocked |
| `InvalidTargetSlot` | 6009 | `target_slot <= current_slot` at registration time |
| `Unauthorized` | 6010 | Signer is not the admin |
| `InvalidFeeBps` | 6011 | Proposed fee basis points exceed the 20% cap |

---

## Running a Keeper Node

Keeper nodes are the execution layer of Cron Protocol. They earn $CRONAI for every task they execute. Running a keeper requires only a funded keypair and a minimum $CRONAI stake — no special hardware or permissioning.

### Requirements

- A Solana keypair with SOL for transaction fees (~0.01 SOL/day at average load)
- $CRONAI tokens to meet minimum stake (see `ProtocolConfig.min_keeper_stake`)
- A reliable internet connection — downtime means missed fees, not slashing

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/cronaidev/cronai
cd cronai/cron-protocol/keeper

# 2. Configure
cp .env.example .env
# Edit the following in .env:
#   SOLANA_RPC_URL=https://api.devnet.solana.com
#   KEEPER_KEYPAIR_PATH=/path/to/keypair.json
#   SCHEDULER_PROGRAM_ID=GUTJB2bMGhVT7RTZEZq3BenCenNEdaAf6NnH11KjrTU
#   STAKING_PROGRAM_ID=Ffjkvcr7eRLp9smMjxJmSncm4coKNkNjerUGkJSQLd74
#   POLL_INTERVAL_MS=400

# 3. Register as a keeper (one-time)
cronai-cli keeper register --amount 1000 --keypair /path/to/keypair.json

# 4. Start the keeper
cargo run --release
```

### Economics

| Item | Amount |
|---|---|
| Task fee (paid by user) | 100 $CRONAI |
| Protocol cut (5%) | 5 $CRONAI |
| Keeper earns per task | 95 $CRONAI |

The first keeper to call `execute_task()` wins the fee. Subsequent attempts fail with `TaskAlreadyExecuted`. This means keeper uptime and RPC latency directly determine earnings. Running against a low-latency RPC endpoint (e.g. a private node or a validator RPC) provides a meaningful edge.

---

## Integration with Agent Protocol

Cron Protocol and Agent Protocol are designed to compose. The `scheduleAgentTask` SDK function combines both: it registers a task in the Scheduler Program whose CPI payload is an `invoke_agent` instruction targeting Agent Protocol.

```typescript
import { scheduleAgentTask } from '@cronai/sdk'
import { Connection, Keypair, PublicKey } from '@solana/web3.js'

const connection = new Connection('https://api.devnet.solana.com')
const client = Keypair.generate()

const { jobPda, taskPda } = await scheduleAgentTask({
  connection,
  client,
  agentAddress: new PublicKey('AGENT_WALLET_PUBKEY'),
  taskDescription: 'Rebalance portfolio based on 24h price movement',
  paymentLamports: 10_000_000,  // 0.01 SOL to the agent
  targetSlot: (await connection.getSlot()) + 9000,  // ~1 hour from now
  cronFeeAmount: 1000,           // $CRONAI to the keeper
})
// At targetSlot, a keeper fires:
//   execute_task() → CPI → invoke_agent(description, payment)
// No human interaction required.
```

**Combined flow:**

```
  Client registers scheduleAgentTask()
              │
              │  register_task() → TaskQueue PDA
              ▼
      Scheduler Program
              │
              │  (waits for target_slot)
              │
              ▼
  Keeper polls → current_slot >= target_slot
              │
              │  execute_task() → CPI
              ▼
      Agent Protocol
              │
              │  invoke_agent() → Job PDA + escrow
              ▼
  Agent executes work → update_job()
              │
              │  auto_release_at reached
              ▼
  Keeper (or anyone) → auto_release() → SOL to agent
```

---

## $CRONAI Token

The $CRONAI token is set as `fee_mint` in `ProtocolConfig` and `StakingConfig` at initialization. Programs on devnet currently use a placeholder devnet SPL mint. After the pump.fun launch, the admin updates the mint to the live address:

```bash
cronai-cli config update \
  --fee-mint <CRONAI_MINT_ADDRESS> \
  --keypair /path/to/admin-keypair.json
```

This is the only configuration change required after launch. All program logic, keeper software, and SDK integrations work without modification — they read `fee_mint` from the on-chain `ProtocolConfig` PDA.

Token distribution: pump.fun fair launch. No team allocation. No presale. No vesting.

---

## Security Considerations

- **Status-before-transfer** — `status` is set to `Executed` before fee distribution; a failed transfer cannot leave the task in a re-executable state
- **Optimistic locking for race conditions** — `TaskAlreadyExecuted` is returned immediately if two keepers race; the second transaction fails cleanly without wasted escrow
- **No admin keys in production** — `update_config` and `slash_keeper` are admin-gated, but the admin key is intended to be transferred to a governance program post-launch
- **Deterministic PDAs** — all accounts are derived from known seeds; no account injection attacks are possible
- **Stake slashing** — keepers that submit invalid execution proofs or malformed CPIs are subject to on-chain slashing by admin governance

---

## Comparison with Clockwork

| | Clockwork (deprecated) | Cron Protocol |
|---|---|---|
| Status | Dead / unmaintained | Active |
| Token | CLOCK (defunct) | $CRONAI (pump.fun) |
| AI agent support | None | Native (Agent Protocol CPI) |
| Keeper incentives | Thread-based fees | $CRONAI per-execution rewards |
| SDK | Clockwork SDK (archived) | `@cronai/sdk` |
| Test coverage | Unknown | 15 tests across 3 suites |
| Solana version | Legacy | Anchor 0.32.1 / Solana 1.18+ |

---

## Getting Started

```bash
# Clone
git clone https://github.com/cronaidev/cronai
cd cronai/cron-protocol

# Install dependencies
yarn install

# Build both programs
anchor build

# Run tests (localnet spun up automatically)
anchor test
# 15 tests: 7 scheduler + 6 staking + 2 integration

# Deploy to devnet
solana config set --url devnet
solana airdrop 2
anchor deploy --provider.cluster devnet

# Initialize protocol (one-time after deploy)
cronai-cli protocol initialize \
  --fee-mint <DEVNET_SPL_MINT> \
  --fee-bps 500 \
  --min-keeper-stake 1000

# Register as keeper and schedule your first task
cronai-cli keeper register --amount 1000
cronai-cli task schedule \
  --target-slot +1500 \
  --fee 100 \
  --description "test task"
```

---

## Test Suite

15 tests across three suites:

**Scheduler (`tests/scheduler.ts`)**
1. Happy path: `register_task` → advance slot → `execute_task` → verify fee distribution
2. Cancel flow: register → cancel → verify full fee refund
3. Slot not reached: execute before `target_slot` fails with `SlotNotReached`
4. Already executed: second `execute_task` fails with `TaskAlreadyExecuted`
5. Paused protocol: `register_task` fails with `ProtocolPaused`
6. Invalid target slot: `target_slot <= current_slot` rejected at registration
7. Race condition: two keepers attempt same task simultaneously — only first succeeds

**Staking (`tests/staking.ts`)**
1. Initializes staking config with correct fields
2. Registers keeper with sufficient stake — `KeeperRecord` created
3. Fails to register keeper with insufficient stake — `KeeperInsufficientStake`
4. Slashes keeper — `staked_amount` decreases by `slash_amount`
5. Three slashes → automatic deactivation at `max_slash_count = 3`
6. Deregisters fresh keeper — full stake returned to wallet

**Integration (`tests/integration.ts`)**
1. Full CronAI flow: `scheduleAgentTask` → keeper executes → Agent Protocol `invoke_agent` fires → agent gets paid
2. Recurring task batch: 5 tasks created with sequential target slots, all executed in order

---

## Links

- Scheduler devnet: [`GUTJB2b...Xn4Y`](https://explorer.solana.com/address/GUTJB2bMGhVT7RTZEZq3BenCenNEdaAf6NnH11KjrTU?cluster=devnet)
- Staking devnet: [`Ffjkvcr...d74`](https://explorer.solana.com/address/Ffjkvcr7eRLp9smMjxJmSncm4coKNkNjerUGkJSQLd74?cluster=devnet)
- Agent Protocol: [README](../README_agent_protocol.md)
- SDK: [`@cronai/sdk`](../cronai-sdk/)
- Website: [cronai.xyz](https://cronai.xyz)
- Dashboard: [app.cronai.xyz](https://app.cronai.xyz)
- Twitter/X: [@CronAI_](https://x.com/CronAI_)
- $CRONAI on pump.fun: _(link after launch)_

---

## Contributing

See the root [CONTRIBUTING](../README_cronai_root.md#contributing) guide.

---

## License

MIT © CronAI contributors
