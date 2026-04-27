# MineGuard — Real-Time Anti-Grief Detection System

MineGuard is a real-time anti-grief detection and monitoring platform for Minecraft-style servers, built with **Ruby on Rails 7**, **PostgreSQL**, **Redis sorted sets**, and **ActionCable**.

It ingests player block events, runs them through a multi-signal heuristic pipeline (activity rate, block-value weighting, dangerous actions, spatial-temporal clustering), assigns a 0–100 suspicion score, generates explainable alerts, and pushes everything live to an admin dashboard.

---

## Why this matters

Naive grief detectors flag any player who breaks lots of blocks. That produces too many false positives. MineGuard combines:

1. **Activity rate** in 10s / 60s / 5m sliding windows (Redis sorted sets).
2. **Block value weighting** — diamonds, chests, beacons weigh more than dirt.
3. **Dangerous actions** — TNT / lava / fire placements add a strong signal.
4. **Spatial-temporal clustering** — concentrated destruction in a small radius is suspicious.
5. **Risk scoring** combines all of the above, clamped to 0–100, with explainable reasons stored on every alert.

---

## Tech stack

| Layer            | Technology                              |
|------------------|------------------------------------------|
| Web framework    | Ruby on Rails 7.1                        |
| Persistent store | PostgreSQL                               |
| Real-time / windows | Redis (sorted sets)                   |
| WebSockets       | ActionCable (Redis adapter)              |
| Frontend         | Sprockets + vanilla JS + handcrafted dark CSS |
| Tests            | RSpec + mock_redis                       |

---

## Architecture

```
HTTP POST /api/block_events
       │
       ▼
EventIngestionService
   ├── upserts Player
   ├── persists BlockEvent (PostgreSQL)
   ├── RedisActivityWindowService.record   ← Redis ZSET
   ├── RiskScoringService.call             ← combines all signals
   │     ├── BlockWeightService
   │     └── SpatialPatternService
   ├── AlertGenerationService.maybe_create ← cooldown-aware
   └── DashboardBroadcastService           ← ActionCable
                       │
                       
## Running locally on macOS

### 1. System dependencies (Homebrew)

```bash
# Homebrew (if you don't already have it; this will prompt for your sudo password)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# A modern Ruby (Rails 7.1 needs Ruby >= 3.1)
brew install rbenv ruby-build
rbenv install 3.2.2
rbenv global 3.2.2
echo 'eval "$(rbenv init - zsh)"' >> ~/.zshrc
exec zsh

# PostgreSQL
brew install postgresql@16
brew services start postgresql@16

# Redis
brew install redis
brew services start redis
```

Verify:

```bash
psql --version
redis-cli ping        # should print PONG
ruby -v               # should print 3.2.2
```

### 2. Database user (one-time)

`config/database.yml` defaults the username to `$USER` with no password, which matches Homebrew Postgres' default superuser. If you prefer a dedicated user:

```bash
createuser -s mineguard
# then export DATABASE_USER=mineguard before running rails commands
```

### 3. App setup

```bash
cd /Users/hetpatel/Downloads/minesurf
bundle install
bin/rails db:create db:migrate
```

### 4. Start the server

```bash
bin/rails s
# open http://localhost:3000/dashboard
```

### 5. Simulate events

```bash
# Mixed scenario (default)
bin/rails mineguard:simulate_events

# A clear, single-player griefing burst
bin/rails mineguard:demo_grief

# Custom run
SCENARIO=griefing COUNT=120 SLEEP=0.05 bin/rails mineguard:simulate_events
```

The dashboard updates in real time via ActionCable — new events appear in the live feed, risk scores update, and `critical` alerts fire a red toast in the corner.

### 6. Verify Redis from the Rails console

```bash
bin/rails console
```

```ruby
MineGuard.redis.ping              # => "PONG"
MineGuard.redis.set("hello","world")
MineGuard.redis.get("hello")      # => "world"
```

---

### `POST /api/block_events`

```json
{
  "player_uuid": "abc-123",
  "player_name": "Steve",
  "server_id": "main-survival",
  "action_type": "block_break",
  "block_type": "diamond_block",
  "x": 120, "y": 64, "z": -340,
  "world": "overworld",
  "timestamp": "2026-04-27T15:22:00Z"
}
```

