# MineGuard — Real-Time Anti-Grief Detection System

MineGuard is a real-time anti-grief detection and monitoring platform for Minecraft-style servers, built with **Ruby on Rails 7**, **PostgreSQL**, **Redis sorted sets**, and **ActionCable**.

It ingests player block events, runs them through a multi-signal heuristic pipeline (activity rate, block-value weighting, dangerous actions, spatial-temporal clustering), assigns a 0–100 suspicion score, generates explainable alerts, and pushes everything live to an admin dashboard.

> Resume blurb: *Built a real-time anti-grief detection system using simulated Minecraft player event ingestion, Redis sorted sets, ActionCable, and PostgreSQL.*

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
                       ▼
                /dashboard (live)
```

Service classes live in `app/services/` so detection logic stays out of controllers.

---

## Detection logic

| Signal              | Source                                  | Max contribution |
|---------------------|------------------------------------------|------------------|
| Activity rate       | Redis sorted set, windowed counts        | 35               |
| Block value         | `BlockWeightService` weighted blocks     | 30               |
| Dangerous actions   | TNT / lava / fire placements             | 25               |
| Spatial clustering  | Bounding-box radius of recent coords     | 25               |

Final score is clamped to `0..100`. Status thresholds: `normal < 30 ≤ watching < 60 ≤ suspicious < 80 ≤ critical`.

Alerts include a list of human-readable reasons, e.g.:

```
• Player performed 52 actions in the last 60 seconds
• High-value blocks affected: diamond_block ×12, chest ×6
• Actions clustered within a 9.4-block radius
• Risk score 87 exceeded suspicious threshold
```

A 2-minute cooldown prevents alert spam unless severity escalates.

---

## Redis sliding window design

Per-player key: `player:{uuid}:events`
Type: **ZSET** (sorted set)
Score: Unix-millisecond timestamp
Member: `"<ts>:<nonce>:<json_payload>"`

Pipeline on each event:

1. `ZADD` event with timestamp score.
2. `ZREMRANGEBYSCORE` purge anything older than 10 minutes.
3. `ZCOUNT` to compute counts inside 10s / 60s / 5m windows.
4. `ZRANGEBYSCORE` to fetch events for the spatial analyzer.
5. `EXPIRE` to ensure stale players don't accumulate keys.

If Redis is unavailable, ingestion still succeeds against PostgreSQL and degrades gracefully (the pipeline falls back to a DB query for recent events).

---

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

## API

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

Response includes the assigned `risk_score`, `status`, explanation reasons, and (if applicable) the alert id.

### `GET /dashboard`

Live admin view: 4 stat cards, suspicious-players table, live activity feed, open-alerts table, toast notifications.

### `GET /alerts`, `GET /alerts/:id`

Historical alerts and per-alert detail page (reasons + supporting events). `PATCH /alerts/:id` lets you mark an alert as `reviewing`, `resolved`, or `false_positive`.

### `GET /players/:id`

Per-player profile, recent events, recent alerts.

---

## Testing

```bash
bundle exec rspec
```

Specs cover:

* Block weight scoring
* Redis sliding window cleanup + windowed counts (via `mock_redis`)
* Spatial clustering heuristic
* Risk score combination + thresholds
* Alert creation, cooldown, and severity escalation
* End-to-end ingestion (player upsert + event persistence + alert path)

---

## Demo flow (good for an interview)

1. `bin/rails s` and open `/dashboard`.
2. `bin/rails mineguard:simulate_events SCENARIO=normal_mining COUNT=60` — green/yellow only.
3. `bin/rails mineguard:demo_grief` — watch a player spike to red, an alert toast appears, the players table flashes, the open-alerts table grows.
4. Click the alert → see the explanation list and supporting events.

Closing line: *“Each event is processed in < 5ms — Redis sorted sets handle the windowed counts, PostgreSQL is durable storage, and ActionCable pushes updates to the dashboard live.”*

---

## Future improvements

- Real Minecraft plugin (Spigot/Paper) that POSTs to `/api/block_events`
- Admin rollback tools (CoreProtect-style) when an alert is confirmed
- Discord webhook notifications for `critical` alerts
- Per-server configurable thresholds and weights
- Player trust scores (long-term reputation)
- ML-based anomaly detection layered on top of the heuristic baseline

---

## Project layout

```
app/
  controllers/   api/block_events_controller, dashboard, alerts, players
  models/        player, block_event, alert
  services/      event_ingestion, redis_activity_window, block_weight,
                 spatial_pattern, risk_scoring, alert_generation,
                 dashboard_broadcast
  channels/      dashboard_channel
  views/         dashboard, alerts, players, layouts
  assets/        application.css (dark theme), application.js (cable consumer)
config/          database.yml, cable.yml, routes.rb, initializers/redis.rb
db/migrate/      players, block_events, alerts
lib/mineguard/   simulator
lib/tasks/       mineguard.rake
spec/services/   one spec per service
```
