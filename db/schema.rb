
ActiveRecord::Schema[7.1].define(version: 2026_04_27_120002) do
  enable_extension "plpgsql"

  create_table "alerts", force: :cascade do |t|
    t.bigint "player_id", null: false
    t.integer "risk_score", null: false
    t.string "severity", null: false
    t.string "status", default: "open", null: false
    t.string "reason_summary"
    t.jsonb "metadata", default: {}, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["created_at"], name: "index_alerts_on_created_at"
    t.index ["player_id"], name: "index_alerts_on_player_id"
    t.index ["severity"], name: "index_alerts_on_severity"
    t.index ["status"], name: "index_alerts_on_status"
  end

  create_table "block_events", force: :cascade do |t|
    t.bigint "player_id", null: false
    t.string "server_id", default: "main", null: false
    t.string "action_type", null: false
    t.string "block_type", null: false
    t.integer "x", null: false
    t.integer "y", null: false
    t.integer "z", null: false
    t.string "world", default: "overworld", null: false
    t.integer "risk_points", default: 0, null: false
    t.datetime "occurred_at", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["action_type"], name: "index_block_events_on_action_type"
    t.index ["block_type"], name: "index_block_events_on_block_type"
    t.index ["occurred_at"], name: "index_block_events_on_occurred_at"
    t.index ["player_id", "occurred_at"], name: "index_block_events_on_player_id_and_occurred_at"
    t.index ["player_id"], name: "index_block_events_on_player_id"
  end

  create_table "players", force: :cascade do |t|
    t.string "uuid", null: false
    t.string "name", null: false
    t.datetime "first_seen_at"
    t.datetime "last_seen_at"
    t.integer "current_risk_score", default: 0, null: false
    t.string "status", default: "normal", null: false
    t.string "last_action"
    t.string "last_block"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["current_risk_score"], name: "index_players_on_current_risk_score"
    t.index ["status"], name: "index_players_on_status"
    t.index ["uuid"], name: "index_players_on_uuid", unique: true
  end

  add_foreign_key "alerts", "players"
  add_foreign_key "block_events", "players"
end
