class CreatePlayers < ActiveRecord::Migration[7.1]
  def change
    create_table :players do |t|
      t.string  :uuid, null: false
      t.string  :name, null: false
      t.datetime :first_seen_at
      t.datetime :last_seen_at
      t.integer :current_risk_score, null: false, default: 0
      t.string  :status, null: false, default: "normal"
      t.string  :last_action
      t.string  :last_block
      t.timestamps
    end

    add_index :players, :uuid, unique: true
    add_index :players, :status
    add_index :players, :current_risk_score
  end
end
