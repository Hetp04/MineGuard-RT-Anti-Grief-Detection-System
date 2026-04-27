class Alert < ApplicationRecord
  belongs_to :player

  SEVERITIES = %w[low medium high critical].freeze
  STATUSES   = %w[open reviewing resolved false_positive].freeze

  validates :severity, inclusion: { in: SEVERITIES }
  validates :status,   inclusion: { in: STATUSES }
  validates :risk_score, numericality: { in: 0..100 }

  scope :open_alerts, -> { where(status: "open") }
  scope :recent, ->(limit = 25) { order(created_at: :desc).limit(limit) }

  def reasons
    Array(metadata["reasons"])
  end

  def severity_color
    case severity
    when "critical" then "red"
    when "high"     then "orange"
    when "medium"   then "yellow"
    else                 "blue"
    end
  end
end
