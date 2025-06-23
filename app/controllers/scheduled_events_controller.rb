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

    # Set coordinates directly if provided from autocomplete
    if params[:scheduled_event][:latitude].present? && params[:scheduled_event][:longitude].present?
      @scheduled_event.latitude = params[:scheduled_event][:latitude]
      @scheduled_event.longitude = params[:scheduled_event][:longitude]
    end

    # Try to geocode the location
    begin
      if @scheduled_event.save
        if @scheduled_event.latitude.present? && @scheduled_event.longitude.present?
          redirect_to @scheduled_event, notice: 'Event was successfully created.'
        else
          redirect_to @scheduled_event, notice: 'Event was created, but location could not be geocoded. Please check the location name.'
        end
      else
        render :new, status: :unprocessable_entity
      end
    rescue Geocoder::Error => e
      @scheduled_event.errors.add(:location, "could not be geocoded. Please check the location name and try again.")
      render :new, status: :unprocessable_entity
    end
  end

  def update
    # Remove selected photos if requested
    if params[:remove_photo_ids].present?
      params[:remove_photo_ids].each do |photo_id|
        photo = @scheduled_event.photos.find_by_id(photo_id)
        photo.purge if photo
      end
    end

    # Set coordinates directly if provided from autocomplete
    if params[:scheduled_event][:latitude].present? && params[:scheduled_event][:longitude].present?
      @scheduled_event.latitude = params[:scheduled_event][:latitude]
      @scheduled_event.longitude = params[:scheduled_event][:longitude]
    end

    # Try to update with geocoding
    begin
      if @scheduled_event.update(scheduled_event_params)
        if @scheduled_event.latitude.present? && @scheduled_event.longitude.present?
          redirect_to @scheduled_event, notice: 'Event was successfully updated.'
        else
          redirect_to @scheduled_event, notice: 'Event was updated, but location could not be geocoded. Please check the location name.'
        end
      else
        render :edit, status: :unprocessable_entity
      end
    rescue Geocoder::Error => e
      @scheduled_event.errors.add(:location, "could not be geocoded. Please check the location name and try again.")
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
    permitted = [
      :title,
      :location,
      :category,
      :starting_time,
      :ending_time,
      :description,
      :price,
      :capacity,
      :latitude,
      :longitude
    ]

    # Only permit photos if there are actual files uploaded (not empty array)
    if params[:scheduled_event][:photos].present? &&
       params[:scheduled_event][:photos].any? { |photo| photo.is_a?(ActionDispatch::Http::UploadedFile) }
      permitted << { photos: [] }
    end

    params.require(:scheduled_event).permit(*permitted)
  end
end
