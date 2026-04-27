class DashboardController < ApplicationController
  def index
    @players = Player.ranked.limit(25)
    @recent_events = BlockEvent.includes(:player).recent(40)
    @open_alerts = Alert.open_alerts.includes(:player).recent(20)
    @stats = {
      active_players: Player.where("last_seen_at >= ?", 5.minutes.ago).count,
      watching: Player.where(status: %w[watching suspicious]).count,
      open_alerts: Alert.open_alerts.count,
      highest_score: Player.maximum(:current_risk_score) || 0
    }
  end
end
