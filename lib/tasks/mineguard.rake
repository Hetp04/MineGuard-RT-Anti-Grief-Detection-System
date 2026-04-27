namespace :mineguard do
  desc "Simulate Minecraft player events through the full ingestion pipeline. ENV: SCENARIO=mixed|normal_mining|normal_building|griefing|dangerous COUNT=200 SLEEP=0.05"
  task simulate_events: :environment do
    require Rails.root.join("lib/mineguard/simulator")
    scenario = (ENV["SCENARIO"] || "mixed").to_sym
    count    = (ENV["COUNT"] || "200").to_i
    sleep_s  = (ENV["SLEEP"] || "0.05").to_f

    puts "▶ Simulating #{count} #{scenario} events (sleep=#{sleep_s}s)..."
    MineGuard::Simulator.new(scenario: scenario, total_events: count, sleep_between: sleep_s).run
    puts "✓ Done. Open http://localhost:3000/dashboard"
  end

  desc "Burst-griefer demo: floods Griefer123 with 60 high-value cluster events"
  task demo_grief: :environment do
    require Rails.root.join("lib/mineguard/simulator")
    MineGuard::Simulator.new(scenario: :griefing, total_events: 60, sleep_between: 0.05).run
  end
end
