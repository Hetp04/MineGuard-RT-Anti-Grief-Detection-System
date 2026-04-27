source "https://rubygems.org"

ruby "3.2.2"

gem "rails", "~> 7.1.3"
gem "pg", "~> 1.5"
gem "puma", ">= 5.0"
gem "redis", "~> 5.0"
gem "hiredis-client"
gem "bootsnap", require: false
gem "tzinfo-data", platforms: %i[windows jruby]
gem "sprockets-rails"
gem "importmap-rails"
gem "turbo-rails"
gem "stimulus-rails"
gem "jbuilder"
gem "rack-cors"
gem "foreman", group: :development

group :development, :test do
  gem "debug", platforms: %i[mri windows]
  gem "rspec-rails", "~> 6.1"
  gem "factory_bot_rails"
  gem "mock_redis"
end

group :development do
  gem "web-console"
end

group :test do
  gem "capybara"
  gem "selenium-webdriver"
end
