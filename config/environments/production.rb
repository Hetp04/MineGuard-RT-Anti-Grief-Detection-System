require "active_support/core_ext/integer/time"

Rails.application.configure do
  config.cache_classes = true
  config.eager_load = true
  config.consider_all_requests_local = false
  config.action_controller.perform_caching = true
  config.public_file_server.enabled = true
  config.assets.compile = false
  config.log_level = :info
  config.log_tags = [:request_id]
  config.cache_store = :redis_cache_store, { url: ENV.fetch("REDIS_URL", "redis://localhost:6379/0") }
  config.active_support.deprecation = :notify
  config.log_formatter = ::Logger::Formatter.new
  config.active_record.dump_schema_after_migration = false
  config.i18n.fallbacks = true
end
