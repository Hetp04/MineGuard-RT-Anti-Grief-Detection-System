# Decides whether a new alert should be created and persists it.
# Adds a cooldown so a player cannot spam the dashboard with duplicate alerts
# unless their severity escalates.
class AlertGenerationService
  COOLDOWN_SECONDS = 120

  SEVERITY_RANK = { "low" => 1, "medium" => 2, "high" => 3, "critical" => 4 }.freeze

  def self.maybe_create(player:, risk:)
    return nil unless risk.score >= 60

    severity = severity_for(risk.score)
    last = player.alerts.order(created_at: :desc).first

    if last && last.created_at > COOLDOWN_SECONDS.seconds.ago
      return nil if SEVERITY_RANK[severity] <= SEVERITY_RANK[last.severity]
    end

    Alert.create!(
      player: player,
      risk_score: risk.score,
      severity: severity,
      status: "open",
      reason_summary: build_summary(player, risk),
      metadata: {
        reasons: risk.reasons,
        breakdown: risk.breakdown
      }
    )
  end

  def self.severity_for(score)
    return "critical" if score >= 90
    return "high"     if score >= 80
    return "medium"   if score >= 70
    "low"
  end

  def self.build_summary(player, risk)
    short = risk.breakdown.dig(:window_counts, :short).to_i
    "#{player.name} performed #{short} actions in 60s — risk #{risk.score} (#{risk.status})"
  end
end
