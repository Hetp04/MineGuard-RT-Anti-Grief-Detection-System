require "securerandom"

module MineGuard
  # Generates fake player events that flow through the real ingestion pipeline.
  # Used by `bin/rails mineguard:simulate_events` and by db/seeds.rb.
  class Simulator
    SCENARIOS = %i[normal_mining normal_building griefing dangerous mixed].freeze

    PLAYERS = [
      { uuid: "uuid-steve",     name: "Steve" },
      { uuid: "uuid-alex",      name: "Alex" },
      { uuid: "uuid-notch",     name: "Notch" },
      { uuid: "uuid-griefer",   name: "Griefer123" },
      { uuid: "uuid-firebug",   name: "FireBug" }
    ].freeze

    NORMAL_BLOCKS    = %w[dirt stone cobblestone sand gravel oak_log oak_planks].freeze
    BUILDING_BLOCKS  = %w[oak_planks glass stone cobblestone].freeze
    VALUABLE_BLOCKS  = %w[diamond_block emerald_block chest beacon iron_block gold_block ender_chest].freeze
    DANGEROUS_PAIRS  = [%w[tnt_place tnt], %w[lava_place lava], %w[fire_place fire]].freeze

    def initialize(scenario: :mixed, total_events: 200, sleep_between: 0.05)
      @scenario = scenario.to_sym
      @total = total_events
      @sleep = sleep_between
    end

    def run
      @total.times do |i|
        params = build_params(i)
        EventIngestionService.ingest(params)
        sleep @sleep if @sleep.positive?
      end
    end

    private

    def build_params(i)
      case @scenario
      when :normal_mining   then mining_event(PLAYERS[0])
      when :normal_building then building_event(PLAYERS[1])
      when :griefing        then griefing_event(PLAYERS[3], i)
      when :dangerous       then dangerous_event(PLAYERS[4], i)
      else                       mixed_event(i)
      end
    end

    def base_event(player, action_type, block_type, x, y, z)
      {
        player_uuid: player[:uuid],
        player_name: player[:name],
        server_id: "main-survival",
        action_type: action_type,
        block_type: block_type,
        x: x, y: y, z: z,
        world: "overworld",
        timestamp: Time.current.iso8601
      }
    end

    def mining_event(player)
      base_event(player, "block_break", NORMAL_BLOCKS.sample, rand(-200..200), rand(5..70), rand(-200..200))
    end

    def building_event(player)
      base_event(player, "block_place", BUILDING_BLOCKS.sample, rand(80..120), rand(60..80), rand(80..120))
    end

    def griefing_event(player, i)
      cx, cy, cz = 120, 64, -340 # tight cluster
      block = i.even? ? VALUABLE_BLOCKS.sample : "glass"
      base_event(player, "block_break", block, cx + rand(-5..5), cy + rand(-3..3), cz + rand(-5..5))
    end

    def dangerous_event(player, i)
      action, block = DANGEROUS_PAIRS.sample
      base_event(player, action, block, rand(-50..50), rand(60..70), rand(-50..50))
    end

    def mixed_event(i)
      case i % 10
      when 0..4 then mining_event(PLAYERS[0])
      when 5..6 then building_event(PLAYERS[1])
      when 7    then base_event(PLAYERS[2], "container_open", "chest", rand(0..30), 64, rand(0..30))
      when 8    then dangerous_event(PLAYERS[4], i)
      else           griefing_event(PLAYERS[3], i)
      end
    end
  end
end
