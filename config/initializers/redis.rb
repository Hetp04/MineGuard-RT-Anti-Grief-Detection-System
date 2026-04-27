# Shared Redis client for sliding-window detection.
# In test environments we substitute MockRedis to keep tests hermetic.
require "redis"

module MineGuard
  class << self
    def redis
      @redis ||= build_redis
    end

    def redis=(client)
      @redis = client
    end

    private

    def build_redis
      if Rails.env.test?
        require "mock_redis"
        MockRedis.new
      else
        Redis.new(url: ENV.fetch("REDIS_URL", "redis://localhost:6379/0"))
      end
    rescue LoadError
      Redis.new(url: ENV.fetch("REDIS_URL", "redis://localhost:6379/0"))
    end
  end
end
