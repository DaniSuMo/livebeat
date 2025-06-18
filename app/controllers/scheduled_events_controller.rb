class ScheduledEventsController < ApplicationController
  before_action :set_scheduled_event, only: [:show, :edit, :update, :destroy]
  before_action :authenticate_user!

  def index
    @scheduled_events = ScheduledEvent.all
  end

  def show
  end

  def new
    @scheduled_event = ScheduledEvent.new
  end

  def edit
  end

  def create
    @scheduled_event = ScheduledEvent.new(scheduled_event_params)

    if @scheduled_event.save
      redirect_to @scheduled_event, notice: 'Event was successfully created.'
    else
      render :new, status: :unprocessable_entity
    end
  end

  def update
    if @scheduled_event.update(scheduled_event_params)
      redirect_to @scheduled_event, notice: 'Event was successfully updated.'
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @scheduled_event.destroy
    redirect_to scheduled_events_url, notice: 'Event was successfully deleted.'
  end

  private

  def set_scheduled_event
    @scheduled_event = ScheduledEvent.find(params[:id])
  end

  def scheduled_event_params
    params.require(:scheduled_event).permit(
      :title,
      :location,
      :category,
      :starting_time,
      :ending_time,
      :description,
      :price,
      :venue_id,
      :capacity
    )
  end
end
