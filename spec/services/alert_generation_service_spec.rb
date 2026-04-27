require "rails_helper"

RSpec.describe AlertGenerationService do
  let(:player) { Player.create!(uuid: "u-1", name: "Griefer123") }

  def risk(score, status: "suspicious")
    RiskScoringService::Result.new(score: score, status: status, reasons: ["test"], breakdown: { window_counts: { short: 50 } })
  end

  it "creates an alert above the suspicious threshold" do
    expect { described_class.maybe_create(player: player, risk: risk(75)) }
      .to change { player.alerts.count }.by(1)
  end

  it "skips alerts below the threshold" do
    expect { described_class.maybe_create(player: player, risk: risk(40)) }
      .not_to change { player.alerts.count }
  end

  it "respects cooldown for same severity" do
    described_class.maybe_create(player: player, risk: risk(75))
    expect { described_class.maybe_create(player: player, risk: risk(72)) }
      .not_to change { player.alerts.count }
  end

  it "fires another alert when severity escalates" do
    described_class.maybe_create(player: player, risk: risk(75))
    expect { described_class.maybe_create(player: player, risk: risk(95)) }
      .to change { player.alerts.count }.by(1)
  end
end
