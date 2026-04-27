class BlockWeightService
  # Risk weight per block type. Anything not listed defaults to 1.
  BLOCK_WEIGHTS = {
    "dirt"          => 1,
    "grass_block"   => 1,
    "stone"         => 1,
    "cobblestone"   => 1,
    "sand"          => 1,
    "gravel"        => 1,
    "oak_log"       => 2,
    "oak_planks"    => 2,
    "glass"         => 3,
    "iron_block"    => 6,
    "gold_block"    => 8,
    "chest"         => 8,
    "ender_chest"   => 9,
    "diamond_block" => 10,
    "emerald_block" => 10,
    "netherite_block" => 12,
    "beacon"        => 12,
    "tnt"           => 15,
    "lava"          => 15,
    "fire"          => 12
  }.freeze

  HIGH_VALUE_THRESHOLD = 8

  def self.weight_for(block_type)
    BLOCK_WEIGHTS[block_type.to_s] || 1
  end

  def self.high_value?(block_type)
    weight_for(block_type) >= HIGH_VALUE_THRESHOLD
  end

  def self.risk_points_for(action_type:, block_type:)
    base = weight_for(block_type)
    case action_type.to_s
    when "tnt_place", "lava_place"  then base + 8
    when "fire_place"               then base + 5
    when "container_remove_item"    then base + 3
    when "container_open"           then base + 1
    else                                  base
    end
  end
end
