class PlayersController < ApplicationController
  def index
    @q = params[:q].to_s.strip
    @status = params[:status].to_s
    scope = Player.all
    scope = scope.where("LOWER(name) LIKE ? OR LOWER(uuid) LIKE ?", "%#{@q.downcase}%", "%#{@q.downcase}%") if @q.present?
    scope = scope.where(status: @status) if Player::STATUSES.include?(@status)
    @players = scope.ranked.limit(200)
  end

  def show
    @player = Player.find(params[:id])
    @events = @player.block_events.recent(100)
    @alerts = @player.alerts.recent(20)
    @timeline = @player.block_events.where("occurred_at >= ?", 15.minutes.ago)
                       .group("date_trunc('minute', occurred_at)").count
                       .transform_keys { |k| k.strftime("%H:%M") }
  end
end
