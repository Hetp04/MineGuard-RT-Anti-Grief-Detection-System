require "rails_helper"

RSpec.describe SpatialPatternService do
  it "flags clustered actions" do
    events = 25.times.map { |i| { "x" => 100 + (i % 5), "y" => 64, "z" => -340 + (i % 4), "block_type" => "diamond_block" } }
    result = described_class.analyze(events)
    expect(result.clustered).to be(true)
    expect(result.score).to be >= 18
  end

  it "does not flag scattered actions" do
    events = 25.times.map { |i| { "x" => i * 100, "y" => 64, "z" => i * 200, "block_type" => "stone" } }
    result = described_class.analyze(events)
    expect(result.clustered).to be(false)
  end
end
