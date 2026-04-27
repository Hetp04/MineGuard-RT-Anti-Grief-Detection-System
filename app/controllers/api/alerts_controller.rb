module Api
  class AlertsController < ActionController::API
    def index
      severity = params[:severity].to_s
      status   = params[:status].to_s
      scope = Alert.includes(:player)
      scope = scope.where(severity: severity) if Alert::SEVERITIES.include?(severity)
      scope = scope.where(status: status)     if Alert::STATUSES.include?(status)
      render json: scope.recent(200).map { |a| serialize(a) }
    end

    def show
      alert = Alert.includes(:player).find(params[:id])
      events = alert.player.block_events.where("occurred_at >= ?", alert.created_at - 5.minutes)
                          .order(occurred_at: :desc).limit(100)
      render json: {
        alert: serialize(alert, full: true),
        events: events.map { |e| { id: e.id, action_type: e.action_type, block_type: e.block_type,
                                    x: e.x, y: e.y, z: e.z, risk_points: e.risk_points,
                                    occurred_at: e.occurred_at } }
      }
    end

    def update
      alert = Alert.find(params[:id])
      if Alert::STATUSES.include?(params[:status])
        alert.update!(status: params[:status])
        render json: serialize(alert, full: true)
      else
        render json: { error: "invalid status" }, status: :unprocessable_entity
      end
    end

    private

    def serialize(a, full: false)
      base = {
        id: a.id, severity: a.severity, status: a.status,
        risk_score: a.risk_score, reason_summary: a.reason_summary,
        created_at: a.created_at,
        player: { id: a.player.id, name: a.player.name, uuid: a.player.uuid,
                  status: a.player.status, risk_score: a.player.current_risk_score }
      }
      base.merge!(reasons: a.reasons, metadata: a.metadata) if full
      base
    end
  end
end
