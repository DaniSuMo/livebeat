class ScheduledEventsController < ApplicationController
  before_action :set_scheduled_event, only: [:show, :edit, :update, :destroy]
  before_action :authenticate_user!
  before_action :ensure_venue_user!, only: [:new, :create]
  before_action :ensure_event_owner!, only: [:edit, :update, :destroy]

  def index
    @scheduled_events = ScheduledEvent.all
    @mapbox_token = ENV['MAPBOX_API_KEY']

    # Prepare events data for the map
    @events_for_map = @scheduled_events.map do |event|
      {
        id: event.id,
        title: event.title,
        location: event.location,
        category: event.category,
        price: event.price,
        starting_time: event.starting_time.iso8601,
        ending_time: event.ending_time.iso8601,
        latitude: event.latitude || 51.9225, # Fallback to Rotterdam coordinates
        longitude: event.longitude || 4.4792,
        url: scheduled_event_path(event),
        photos: event.photos.attached? ? event.photos.map { |photo| { key: photo.key, url: rails_blob_url(photo) } } : [],
        cloud_name: ENV['CLOUDINARY_CLOUD_NAME'] || 'dos5yrffh'
      }
    end.compact
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
    @scheduled_event.venue = current_user.venue

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

  def ensure_venue_user!
    unless current_user.venue?
      redirect_to scheduled_events_path, alert: 'Only venue owners can create events.'
    end
  end

  def ensure_event_owner!
    unless current_user.venue? && @scheduled_event.venue == current_user.venue
      redirect_to scheduled_events_path, alert: 'You can only modify events you own.'
    end
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
      :capacity,
      photos: []
    )
  end
end
