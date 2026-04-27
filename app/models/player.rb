class Player < ApplicationRecord
  has_many :block_events, dependent: :destroy
  has_many :alerts, dependent: :destroy

  STATUSES = %w[normal watching suspicious critical].freeze

  validates :uuid, presence: true, uniqueness: true
  validates :name, presence: true
  validates :status, inclusion: { in: STATUSES }

  scope :ranked,     -> { order(current_risk_score: :desc, last_seen_at: :desc) }
  scope :suspicious, -> { where(status: %w[watching suspicious critical]) }

  def status_color
    case status
    when "critical"   then "red"
    when "suspicious" then "orange"
    when "watching"   then "yellow"
    else                   "green"
    end
  end

  def self.status_for_score(score)
    return "critical"   if score >= 80
    return "suspicious" if score >= 60
    return "watching"   if score >= 30
    "normal"
  end
end
