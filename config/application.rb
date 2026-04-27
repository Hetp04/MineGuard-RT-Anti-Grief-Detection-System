require_relative "boot"

require "rails"
require "active_model/railtie"
require "active_job/railtie"
require "active_record/railtie"
require "action_controller/railtie"
require "action_view/railtie"
require "action_cable/engine"
require "sprockets/railtie"

Bundler.require(*Rails.groups)

module MineGuard
  class Application < Rails::Application
    config.load_defaults 7.1
    config.autoload_lib(ignore: %w[assets tasks])
    config.api_only = false
    config.time_zone = "UTC"
    config.active_job.queue_adapter = :async
  end
end
