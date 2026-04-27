class CreateBlockEvents < ActiveRecord::Migration[7.1]
  def change
    create_table :block_events do |t|
      t.references :player, null: false, foreign_key: true, index: true
      t.string  :server_id, null: false, default: "main"
      t.string  :action_type, null: false
      t.string  :block_type, null: false
      t.integer :x, null: false
      t.integer :y, null: false
      t.integer :z, null: false
      t.string  :world, null: false, default: "overworld"
      t.integer :risk_points, null: false, default: 0
      t.datetime :occurred_at, null: false
      t.timestamps
    end

    add_index :block_events, :action_type
    add_index :block_events, :block_type
    add_index :block_events, :occurred_at
    add_index :block_events, [:player_id, :occurred_at]
  end
end
