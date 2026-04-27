module Api
  class StatsController < ActionController::API
    # Quick stats only (used for polling fallback if cable disconnects).
    def show
      render json: DashboardStatsService.snapshot
    end

    # One-shot bootstrap for the React dashboard: stats + top players +
    # recent events + open alerts. Saves a chain of round-trips on first paint.
    def bootstrap
      render json: {
        stats: DashboardStatsService.snapshot,
        players: Player.ranked.limit(25).map { |p|
          { id: p.id, uuid: p.uuid, name: p.name, status: p.status,
            risk_score: p.current_risk_score, last_action: p.last_action,
            last_block: p.last_block, last_seen_at: p.last_seen_at }
        },
        recent_events: BlockEvent.includes(:player).recent(40).map { |e|
          { id: e.id, player_id: e.player_id, player_name: e.player.name,
            action_type: e.action_type, block_type: e.block_type,
            x: e.x, y: e.y, z: e.z, risk_points: e.risk_points,
            occurred_at: e.occurred_at }
        },
        open_alerts: Alert.open_alerts.includes(:player).recent(20).map { |a|
          { id: a.id, severity: a.severity, status: a.status,
            risk_score: a.risk_score, reason_summary: a.reason_summary,
            created_at: a.created_at,
            player_id: a.player_id, player_name: a.player.name }
        }
      }
    end
  end
end
