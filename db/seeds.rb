# Lightweight seed: invoke the simulator a few times to make the dashboard non-empty.
# For the full demo flow, prefer: bin/rails mineguard:simulate_events
puts "Seeding MineGuard with a small demo dataset..."
require Rails.root.join("lib/mineguard/simulator")
MineGuard::Simulator.new(scenario: :mixed, total_events: 60, sleep_between: 0).run
puts "Done. Visit /dashboard"
