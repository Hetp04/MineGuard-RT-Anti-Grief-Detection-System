module Api
  class BlockEventsController < ActionController::API
    before_action :authenticate!

    def create
      result = EventIngestionService.ingest(event_params)

      if result.ok?
        render json: {
          ok: true,
          event_id: result.event.id,
          player: {
            id: result.player.id,
            name: result.player.name,
            risk_score: result.player.current_risk_score,
            status: result.player.status
          },
          risk: {
            score: result.risk.score,
            status: result.risk.status,
            reasons: result.risk.reasons,
            breakdown: result.risk.breakdown
          },
          alert: result.alert && { id: result.alert.id, severity: result.alert.severity }
        }, status: :created
      else
        render json: { ok: false, errors: result.errors }, status: :unprocessable_entity
      end
    end

    private

    def authenticate!
      expected = ENV["MINEGUARD_API_KEY"].to_s
      return if expected.empty? # dev/demo mode: open
      provided = request.headers["X-MineGuard-Key"].to_s
      return if ActiveSupport::SecurityUtils.secure_compare(expected, provided)
      render json: { ok: false, errors: ["unauthorized"] }, status: :unauthorized
    end

    def event_params
      params.permit(
        :player_uuid, :player_name, :server_id, :action_type, :block_type,
        :x, :y, :z, :world, :timestamp
      )
    end
  end
end
