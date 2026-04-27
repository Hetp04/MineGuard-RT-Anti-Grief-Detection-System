class CreateAlerts < ActiveRecord::Migration[7.1]
  def change
    create_table :alerts do |t|
      t.references :player, null: false, foreign_key: true, index: true
      t.integer :risk_score, null: false
      t.string  :severity,   null: false
      t.string  :status,     null: false, default: "open"
      t.string  :reason_summary
      t.jsonb   :metadata, null: false, default: {}
      t.timestamps
    end

    add_index :alerts, :severity
    add_index :alerts, :status
    add_index :alerts, :created_at
  end
end
