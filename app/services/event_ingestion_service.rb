# Orchestrates the full pipeline for a single inbound player event:
#   validate -> upsert player -> persist event -> redis window ->
#   risk scoring -> alert (maybe) -> dashboard broadcast.
class EventIngestionService
  REQUIRED_FIELDS = %i[player_uuid player_name action_type block_type x y z].freeze

  Result = Struct.new(:ok?, :event, :player, :alert, :risk, :errors, keyword_init: true)

  def self.ingest(params)
    new(params).call
  end

  def initialize(params)
    @params = params.is_a?(ActionController::Parameters) ? params.to_unsafe_h.symbolize_keys : params.symbolize_keys
  end

  def call
    errors = validate
    return Result.new(ok?: false, errors: errors) if errors.any?

    player = upsert_player
    event  = persist_event(player)

    summary = redis_summary(player, event)
    counts  = summary[:counts]
    recent  = summary[:events]

    risk = RiskScoringService.call(player: player, recent_events: recent, window_counts: counts)

    update_player_state(player, event, risk)

    alert = AlertGenerationService.maybe_create(player: player, risk: risk)

    broadcast(event, player, risk, alert)

    Result.new(ok?: true, event: event, player: player, alert: alert, risk: risk, errors: [])
  end

  private

  def validate
    missing = REQUIRED_FIELDS.select { |k| @params[k].nil? || @params[k].to_s.strip.empty? }
    errors = missing.map { |k| "#{k} is required" }
    unless BlockEvent::ACTION_TYPES.include?(@params[:action_type].to_s)
      errors << "action_type must be one of #{BlockEvent::ACTION_TYPES.join(', ')}"
    end
    errors
  end

  def upsert_player
    player = Player.find_or_initialize_by(uuid: @params[:player_uuid].to_s)
    player.name ||= @params[:player_name].to_s
    player.name = @params[:player_name].to_s if player.name.blank?
    player.first_seen_at ||= Time.current
    player.last_seen_at = Time.current
    player.save!
    player
  end

  def persist_event(player)
    occurred_at = parse_time(@params[:timestamp]) || Time.current
    risk_points = BlockWeightService.risk_points_for(
      action_type: @params[:action_type], block_type: @params[:block_type]
    )

    BlockEvent.create!(
      player: player,
      server_id: @params[:server_id].presence || "main",
      action_type: @params[:action_type].to_s,
      block_type:  @params[:block_type].to_s,
      x: @params[:x].to_i, y: @params[:y].to_i, z: @params[:z].to_i,
      world: @params[:world].presence || "overworld",
      risk_points: risk_points,
      occurred_at: occurred_at
    )
  end

  def redis_summary(player, event)
    win = RedisActivityWindowService.new(player.uuid)
    win.record(
      action_type: event.action_type,
      block_type: event.block_type,
      x: event.x, y: event.y, z: event.z,
      occurred_at: event.occurred_at
    )
    { counts: win.snapshot, events: win.events_in(RedisActivityWindowService::WINDOWS[:short]) }
  rescue => e
    Rails.logger.warn("[Ingest] redis_summary degraded: #{e.message}")
    fallback_recent = player.block_events.within(60).order(:occurred_at).map do |ev|
      { "action_type" => ev.action_type, "block_type" => ev.block_type, "x" => ev.x, "y" => ev.y, "z" => ev.z }
    end
    { counts: { burst: 0, short: fallback_recent.size, sustained: fallback_recent.size }, events: fallback_recent }
  end

  def update_player_state(player, event, risk)
    player.update!(
      current_risk_score: risk.score,
      status: risk.status,
      last_action: event.action_type,
      last_block: event.block_type,
      last_seen_at: event.occurred_at
    )
  end

  def broadcast(event, player, risk, alert)
    DashboardBroadcastService.broadcast_event(event, player)
    DashboardBroadcastService.broadcast_player(player, risk: risk)
    DashboardBroadcastService.broadcast_alert(alert) if alert
    DashboardStatsService.broadcast
  end

  def parse_time(value)
    return nil if value.blank?
    Time.iso8601(value.to_s) rescue Time.parse(value.to_s) rescue nil
  end
end
