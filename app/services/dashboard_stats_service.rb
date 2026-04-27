# Computes dashboard-level aggregate stats and pushes them to the cable channel.
# Called after every successful ingestion so all 4 stat tiles feel "live".
class DashboardStatsService
  WINDOW_MINUTES = 5
  RISK_BUCKETS = [0, 30, 60, 80, 101].freeze # 0-29, 30-59, 60-79, 80-100

  def self.snapshot
    active = Player.where("last_seen_at >= ?", WINDOW_MINUTES.minutes.ago).count
    watching = Player.where(status: %w[watching suspicious]).count
    open_alerts = Alert.open_alerts.count
    top = Player.maximum(:current_risk_score) || 0

    distribution = build_distribution
    timeline = build_event_timeline

    {
      active_players: active,
      watching: watching,
      open_alerts: open_alerts,
      highest_score: top,
      risk_distribution: distribution,
      events_per_minute: timeline
    }
  end

  def self.build_distribution
    counts = [0, 0, 0, 0]
    Player.pluck(:current_risk_score).each do |s|
      idx = if    s >= 80 then 3
            elsif s >= 60 then 2
            elsif s >= 30 then 1
            else               0
            end
      counts[idx] += 1
    end
    { labels: ["normal", "watching", "suspicious", "critical"], data: counts }
  end

  def self.build_event_timeline(minutes: 15)
    cutoff = minutes.minutes.ago
    bucketed = BlockEvent.where("occurred_at >= ?", cutoff)
                         .group("date_trunc('minute', occurred_at)").count
    series = (0...minutes).map do |i|
      ts = (Time.current - (minutes - 1 - i).minutes).beginning_of_minute
      [ts.strftime("%H:%M"), bucketed[ts] || 0]
    end
    { labels: series.map(&:first), data: series.map(&:last) }
  end

  def self.broadcast
    ActionCable.server.broadcast(DashboardBroadcastService::CHANNEL,
                                 { type: "stats", stats: snapshot })
  rescue => e
    Rails.logger.warn("[Cable] stats broadcast failed: #{e.message}")
  end
end
