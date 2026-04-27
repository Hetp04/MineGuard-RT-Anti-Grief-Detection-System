# Pushes real-time updates to the admin dashboard via ActionCable.
class DashboardBroadcastService
  CHANNEL = "dashboard"

  def self.broadcast_event(event, player)
    ActionCable.server.broadcast(CHANNEL, {
      type: "event",
      event: {
        id: event.id,
        player_id: player.id,
        player_name: player.name,
        action_type: event.action_type,
        block_type: event.block_type,
        coords: event.coords,
        risk_points: event.risk_points,
        occurred_at: event.occurred_at.iso8601
      }
    })
  rescue => e
    Rails.logger.warn("[Cable] broadcast_event failed: #{e.message}")
  end

  def self.broadcast_player(player, risk: nil)
    ActionCable.server.broadcast(CHANNEL, {
      type: "player",
      player: {
        id: player.id,
        name: player.name,
        risk_score: player.current_risk_score,
        status: player.status,
        last_action: player.last_action,
        last_block: player.last_block,
        last_seen_at: player.last_seen_at&.iso8601,
        reasons: risk&.reasons || []
      }
    })
  rescue => e
    Rails.logger.warn("[Cable] broadcast_player failed: #{e.message}")
  end

  def self.broadcast_alert(alert)
    ActionCable.server.broadcast(CHANNEL, {
      type: "alert",
      alert: {
        id: alert.id,
        player_id: alert.player_id,
        player_name: alert.player.name,
        severity: alert.severity,
        risk_score: alert.risk_score,
        reason_summary: alert.reason_summary,
        reasons: alert.reasons,
        created_at: alert.created_at.iso8601
      }
    })
  rescue => e
    Rails.logger.warn("[Cable] broadcast_alert failed: #{e.message}")
  end
end
