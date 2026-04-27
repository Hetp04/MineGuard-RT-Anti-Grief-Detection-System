class BlockEvent < ApplicationRecord
  belongs_to :player

  ACTION_TYPES = %w[
    block_break block_place container_open container_remove_item
    fire_place lava_place tnt_place
  ].freeze

  validates :action_type, inclusion: { in: ACTION_TYPES }
  validates :block_type, presence: true
  validates :x, :y, :z, presence: true
  validates :occurred_at, presence: true

  scope :recent, ->(limit = 50) { order(occurred_at: :desc).limit(limit) }
  scope :within, ->(seconds) { where("occurred_at >= ?", seconds.seconds.ago) }

  def dangerous?
    %w[fire_place lava_place tnt_place].include?(action_type)
  end

  def coords
    [x, y, z]
  end
end
