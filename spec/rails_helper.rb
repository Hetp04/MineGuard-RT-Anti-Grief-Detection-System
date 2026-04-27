ENV["RAILS_ENV"] ||= "test"
require_relative "../config/environment"
require "rspec/rails"

RSpec.configure do |config|
  config.fixture_paths = [Rails.root.join("spec/fixtures").to_s]
  config.use_transactional_fixtures = true
  config.infer_spec_type_from_file_location!
  config.filter_rails_from_backtrace!

  config.before(:each) do
    require "mock_redis"
    MineGuard.redis = MockRedis.new
  end
end
