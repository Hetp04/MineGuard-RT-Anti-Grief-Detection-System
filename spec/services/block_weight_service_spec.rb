require "rails_helper"

RSpec.describe BlockWeightService do
  it "returns the weight for known blocks" do
    expect(described_class.weight_for("diamond_block")).to eq(10)
    expect(described_class.weight_for("dirt")).to eq(1)
  end

  it "defaults to 1 for unknown blocks" do
    expect(described_class.weight_for("unobtanium")).to eq(1)
  end

  it "treats expensive blocks as high value" do
    expect(described_class.high_value?("diamond_block")).to be(true)
    expect(described_class.high_value?("dirt")).to be(false)
  end

  it "boosts risk points for dangerous actions" do
    base   = described_class.risk_points_for(action_type: "block_break", block_type: "tnt")
    placed = described_class.risk_points_for(action_type: "tnt_place",   block_type: "tnt")
    expect(placed).to be > base
  end
end
