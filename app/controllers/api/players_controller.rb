module Api
  class PlayersController < ActionController::API
    def index
      q      = params[:q].to_s.strip.downcase
      status = params[:status].to_s
      scope  = Player.all
      scope  = scope.where("LOWER(name) LIKE ? OR LOWER(uuid) LIKE ?", "%#{q}%", "%#{q}%") if q.present?
      scope  = scope.where(status: status) if Player::STATUSES.include?(status)

      render json: scope.ranked.limit(200).map { |p| serialize(p) }
    end

    def show
      player = Player.find(params[:id])
      events = player.block_events.recent(100)
      alerts = player.alerts.recent(20)
      timeline = player.block_events.where("occurred_at >= ?", 15.minutes.ago)
                       .group("date_trunc('minute', occurred_at)").count
                       .transform_keys { |k| k.strftime("%H:%M") }

      render json: {
        player: serialize(player),
        events: events.map { |e| serialize_event(e) },
        alerts: alerts.map { |a| serialize_alert(a) },
        timeline: timeline
      }
    end

    private

    def serialize(p)
      {
        id: p.id, uuid: p.uuid, name: p.name,
        status: p.status, risk_score: p.current_risk_score,
        last_action: p.last_action, last_block: p.last_block,
        first_seen_at: p.first_seen_at, last_seen_at: p.last_seen_at,
        alert_count: p.alerts.size
      }
    end

    def serialize_event(e)
      {
        id: e.id, action_type: e.action_type, block_type: e.block_type,
        x: e.x, y: e.y, z: e.z, risk_points: e.risk_points,
        occurred_at: e.occurred_at
      }
    end

    def serialize_alert(a)
      {
        id: a.id, severity: a.severity, status: a.status,
        risk_score: a.risk_score, reason_summary: a.reason_summary,
        reasons: a.reasons, created_at: a.created_at
      }
    end
  end
end
