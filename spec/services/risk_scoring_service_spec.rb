require "rails_helper"

RSpec.describe RiskScoringService do
  let(:player) { Player.create!(uuid: "u-1", name: "Steve") }

  it "produces a low score for normal mining" do
    events = 8.times.map { { "action_type" => "block_break", "block_type" => "stone", "x" => rand(100), "y" => 60, "z" => rand(100) } }
    result = described_class.call(player: player, recent_events: events, window_counts: { burst: 3, short: 8, sustained: 8 })
    expect(result.score).to be < 30
    expect(result.status).to eq("normal")
  end

  it "escalates for high-value clustered destruction" do
    events = 30.times.map { |i| { "action_type" => "block_break", "block_type" => "diamond_block", "x" => 100 + (i % 5), "y" => 64, "z" => -340 + (i % 5) } }
    result = described_class.call(player: player, recent_events: events, window_counts: { burst: 25, short: 50, sustained: 50 })
    expect(result.score).to be >= 60
    expect(%w[suspicious critical]).to include(result.status)
    expect(result.reasons).to include(a_string_matching(/High-value blocks/))
  end

  it "penalises dangerous placements" do
    events = 5.times.map { |i| { "action_type" => "tnt_place", "block_type" => "tnt", "x" => i, "y" => 64, "z" => 0 } }
    result = described_class.call(player: player, recent_events: events, window_counts: { burst: 5, short: 5, sustained: 5 })
    expect(result.breakdown[:dangerous_actions]).to be > 0
  end
end
