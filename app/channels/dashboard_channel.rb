class DashboardChannel < ApplicationCable::Channel
  def subscribed
    stream_from "dashboard"
  end

  def unsubscribed
  end
end
