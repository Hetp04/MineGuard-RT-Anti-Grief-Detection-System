require "rails_helper"

RSpec.describe EventIngestionService do
  let(:base) do
    {
      player_uuid: "uuid-steve", player_name: "Steve",
      action_type: "block_break", block_type: "stone",
      x: 1, y: 64, z: 1
    }
  end

  it "rejects invalid action types" do
    result = described_class.ingest(base.merge(action_type: "nope"))
    expect(result.ok?).to be(false)
    expect(result.errors).to be_present
  end

  it "creates the player and stores the event" do
    expect { described_class.ingest(base) }
      .to change { Player.count }.by(1)
      .and change { BlockEvent.count }.by(1)
  end

  it "escalates to an alert when behavior is suspicious" do
    50.times do |i|
      described_class.ingest(base.merge(
        block_type: "diamond_block",
        x: 100 + (i % 5), y: 64, z: -340 + (i % 5)
      ))
    end
    player = Player.find_by(uuid: "uuid-steve")
    expect(player.current_risk_score).to be >= 60
    expect(player.alerts.count).to be >= 1
  end
end
