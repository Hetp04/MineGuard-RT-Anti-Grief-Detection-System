require "json"

# Tracks recent player events in a Redis sorted set keyed by player UUID.
# Score = unix-millisecond timestamp; member = JSON-encoded event summary.
class RedisActivityWindowService
  WINDOWS = { burst: 10, short: 60, sustained: 300 }.freeze
  MAX_RETENTION_SECONDS = 600

  def initialize(player_uuid, redis: MineGuard.redis)
    @player_uuid = player_uuid
    @redis = redis
  end

  def key
    "player:#{@player_uuid}:events"
  end

  # Adds an event hash and trims old data. Returns the count in the short window.
  def record(event)
    payload = event.to_json
    ts_ms = ((event[:occurred_at] || Time.current).to_f * 1000).to_i

    @redis.zadd(key, ts_ms, "#{ts_ms}:#{SecureRandom.hex(4)}:#{payload}")
    cleanup
    count_in(WINDOWS[:short])
  rescue => e
    Rails.logger.warn("[Redis] record failed for #{@player_uuid}: #{e.message}")
    0
  end

  def cleanup
    cutoff_ms = ((Time.current - MAX_RETENTION_SECONDS).to_f * 1000).to_i
    @redis.zremrangebyscore(key, "-inf", cutoff_ms)
    @redis.expire(key, MAX_RETENTION_SECONDS * 2)
  end

  def count_in(seconds)
    min_ms = ((Time.current - seconds).to_f * 1000).to_i
    @redis.zcount(key, min_ms, "+inf").to_i
  rescue => e
    Rails.logger.warn("[Redis] count_in failed for #{@player_uuid}: #{e.message}")
    0
  end

  def events_in(seconds)
    min_ms = ((Time.current - seconds).to_f * 1000).to_i
    raw = @redis.zrangebyscore(key, min_ms, "+inf")
    raw.map do |entry|
      json = entry.split(":", 3).last
      JSON.parse(json) rescue nil
    end.compact
  rescue => e
    Rails.logger.warn("[Redis] events_in failed for #{@player_uuid}: #{e.message}")
    []
  end

  def snapshot
    {
      burst:     count_in(WINDOWS[:burst]),
      short:     count_in(WINDOWS[:short]),
      sustained: count_in(WINDOWS[:sustained])
    }
  end
end
