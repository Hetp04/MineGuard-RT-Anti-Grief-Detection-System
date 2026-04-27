class AlertsController < ApplicationController
  before_action :set_alert, only: [:show, :update]

  def index
    @severity = params[:severity].to_s
    @status   = params[:status].to_s
    scope = Alert.includes(:player)
    scope = scope.where(severity: @severity) if Alert::SEVERITIES.include?(@severity)
    scope = scope.where(status: @status)     if Alert::STATUSES.include?(@status)
    @alerts = scope.recent(200)
  end

  def show
    @events = @alert.player.block_events.where("occurred_at >= ?", @alert.created_at - 5.minutes)
                          .order(occurred_at: :desc).limit(100)
  end

  def update
    if @alert.update(status: params.require(:alert).permit(:status)[:status])
      redirect_to alert_path(@alert), notice: "Alert updated."
    else
      redirect_to alert_path(@alert), alert: "Could not update alert."
    end
  end

  private

  def set_alert
    @alert = Alert.includes(:player).find(params[:id])
  end
end
