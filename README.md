# MineGuard

MineGuard is a real-time anti-grief detection system for Minecraft-style servers.

It monitors player block activity, calculates a **0–100 suspicion score**, generates alerts for suspicious behavior, and updates an admin dashboard in real time.

## Tech Stack

- Ruby on Rails 7
- PostgreSQL
- Redis
- ActionCable

## Installation

### 1. Install Dependencies

```bash
brew install rbenv ruby-build
rbenv install 3.2.2
rbenv global 3.2.2

brew install postgresql@16
brew services start postgresql@16

brew install redis
brew services start redis
```

### 2. Install MineGuard

```bash
cd /Users/hetpatel/Downloads/minesurf
bundle install
bin/rails db:create db:migrate
```

### 3. Start the Server

```bash
bin/rails s
```

Open:

```text
http://localhost:3000/dashboard
```

## Run a Demo

Simulate a griefing scenario:

```bash
bin/rails mineguard:demo_grief
```

Or simulate mixed player activity:

```bash
bin/rails mineguard:simulate_events
```

The dashboard updates in real time as events are processed and suspicious activity is detected.
