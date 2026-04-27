require "rails_helper"

RSpec.describe RedisActivityWindowService do
  let(:svc) { described_class.new("uuid-test") }

  it "records events and counts them inside the window" do
    5.times do |i|
      svc.record(action_type: "block_break", block_type: "stone", x: i, y: 64, z: 0, occurred_at: Time.current)
    end
    expect(svc.count_in(60)).to eq(5)
  end

  it "cleans up events older than the retention window" do
    old = Time.current - 20.minutes
    svc.record(action_type: "block_break", block_type: "dirt", x: 0, y: 0, z: 0, occurred_at: old)
    svc.cleanup
    expect(svc.count_in(60)).to eq(0)
  end

  it "exposes a snapshot of multiple windows" do
    3.times { svc.record(action_type: "block_break", block_type: "stone", x: 0, y: 0, z: 0, occurred_at: Time.current) }
    snapshot = svc.snapshot
    expect(snapshot[:short]).to eq(3)
    expect(snapshot.keys).to match_array(%i[burst short sustained])
  end
end
