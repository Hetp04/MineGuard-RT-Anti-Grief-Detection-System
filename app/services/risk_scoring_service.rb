# Combines multiple signals into a 0..100 suspicion score for a player.
class RiskScoringService
  Result = Struct.new(:score, :status, :reasons, :breakdown, keyword_init: true)

  DANGEROUS_ACTIONS = %w[tnt_place lava_place fire_place].freeze

  def self.call(player:, recent_events:, window_counts:)
    activity_score = activity_rate_score(window_counts)
    block_value, valuable_blocks = block_value_score(recent_events)
    danger_n  = dangerous_count(recent_events)
    dangerous = dangerous_action_score(danger_n)
    spatial   = SpatialPatternService.analyze(recent_events)

    raw   = activity_score + block_value + dangerous + spatial.score
    score = raw.clamp(0, 100)
    status = Player.status_for_score(score)

    reasons = build_reasons(
      window_counts: window_counts,
      valuable_blocks: valuable_blocks,
      spatial: spatial,
      dangerous_count: danger_n,
      score: score
    )

    Result.new(
      score: score,
      status: status,
      reasons: reasons,
      breakdown: {
        activity_rate: activity_score,
        block_value: block_value,
        dangerous_actions: dangerous,
        spatial: spatial.score,
        spatial_radius: spatial.radius,
        window_counts: window_counts
      }
    )
  end

  def self.activity_rate_score(counts)
    short = counts[:short].to_i
    burst = counts[:burst].to_i
    score = 0
    score += 10 if short >= 20
    score += 15 if short >= 40
    score += 10 if short >= 70
    score += 8  if burst >= 12
    score += 7  if burst >= 20
    [score, 35].min
  end

  def self.block_value_score(events)
    valuable = events.select do |e|
      BlockWeightService.high_value?(e["block_type"] || e[:block_type])
    end
    blocks = valuable.map { |e| e["block_type"] || e[:block_type] }.tally
    score =
      case valuable.size
      when 0 then 0
      when 1..3  then 6
      when 4..7  then 14
      when 8..14 then 22
      else            30
      end
    [score, blocks]
  end

  def self.dangerous_count(events)
    events.count { |e| DANGEROUS_ACTIONS.include?(e["action_type"] || e[:action_type]) }
  end

  def self.dangerous_action_score(n)
    return 0 if n.zero?
    [10 + (n * 5), 25].min
  end

  def self.build_reasons(window_counts:, valuable_blocks:, spatial:, dangerous_count:, score:)
    reasons = []
    reasons << "Player performed #{window_counts[:short]} actions in the last 60 seconds" if window_counts[:short].to_i >= 20
    reasons << "Burst of #{window_counts[:burst]} actions in 10 seconds"                 if window_counts[:burst].to_i >= 10
    if valuable_blocks.any?
      top = valuable_blocks.sort_by { |_, c| -c }.first(3).map { |b, c| "#{b} ×#{c}" }.join(", ")
      reasons << "High-value blocks affected: #{top}"
    end
    reasons << "#{dangerous_count} dangerous placements (TNT/lava/fire)" if dangerous_count.positive?
    reasons << "Actions clustered within a #{spatial.radius}-block radius" if spatial.clustered
    reasons << "Risk score #{score} exceeded suspicious threshold"        if score >= 60
    reasons
  end
end
