class ScheduledEvent < ApplicationRecord
  belongs_to :venue

  # Predefined event categories
  EVENT_CATEGORIES = [
    "Art & Culture",
    "Live Music & Concerts",
    "Nightlife & Parties",
    "Education & Workshops",
    "Sports & Wellness",
    "Family & Kids",
    "Food & Drinks",
    "Business & Networking",
    "Technology & Gaming",
    "Fashion & Shopping",
    "Sustainability & Environment",
    "Personal Growth & Spirituality"
  ].freeze

  # Virtual attributes for direct coordinates from autocomplete
  attr_accessor :user_latitude, :user_longitude

  # Class method to access categories
  def self.categories
    EVENT_CATEGORIES
  end

  # Class method to update coordinates for existing events
  def self.update_coordinates_for_existing_events
    find_each do |event|
      begin
        if event.location.present?
          puts "Processing: #{event.title} at #{event.location}"

          # Force re-geocoding by temporarily clearing coordinates
          old_lat = event.latitude
          old_lng = event.longitude

          event.latitude = nil
          event.longitude = nil
          event.geocode

          if event.latitude.present? && event.longitude.present?
            event.save!
            updated_count += 1
            puts "  ✓ Updated coordinates: #{event.latitude}, #{event.longitude}"
          else
            # Restore old coordinates if geocoding failed
            event.latitude = old_lat
            event.longitude = old_lng
            error_count += 1
            puts "  ✗ Failed to geocode"
          end
        end

        # Rate limiting
        sleep(0.1) # Rate limiting to avoid hitting API limits
      rescue => e
        error_count += 1
        puts "  ✗ Error processing #{event.title}: #{e.message}"
      end
    end
  end

  # Validations
  validates :title, presence: true
  validates :location, presence: true
  validates :category, presence: true, inclusion: { in: EVENT_CATEGORIES, message: "must be one of the predefined categories" }
  validates :starting_time, presence: true
  validates :price, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :capacity, presence: true, numericality: { greater_than: 0 }

  # Photo validations
  validate :photos_presence_and_count
  validate :acceptable_photos

  # Ensure ending_time is after starting_time
  validate :ending_time_after_starting_time

  # Geocoding with improved accuracy
  geocoded_by :location_with_context do |obj, results|
    if results.present?
      # Prefer results that are closer to the venue owner's location if available
      if obj.venue&.user&.latitude.present? && obj.venue&.user&.longitude.present?
        # Sort results by distance from venue owner's location
        user_coords = [obj.venue.user.longitude, obj.venue.user.latitude]
        sorted_results = results.sort_by do |result|
          result_coords = [result.longitude, result.latitude]
          Geocoder::Calculations.distance_between(user_coords, result_coords)
        end
        obj.latitude = sorted_results.first.latitude
        obj.longitude = sorted_results.first.longitude
      else
        # Fallback to first result
        obj.latitude = results.first.latitude
        obj.longitude = results.first.longitude
      end
    end
  end

  after_validation :geocode, if: :should_geocode?
  has_many_attached :photos

  private

  def location_with_context
    # Add context to improve geocoding accuracy
    if location.present?
      # If venue owner has location info, add it as context
      if venue&.user&.city.present? && venue&.user&.country.present?
        "#{location}, #{venue.user.city}, #{venue.user.country}"
      elsif venue&.user&.city.present?
        "#{location}, #{venue.user.city}"
      else
        location
      end
    end
  end

  def should_geocode?
    # Only geocode if coordinates are not already set from autocomplete
    will_save_change_to_location? && location.present? && latitude.blank? && longitude.blank?
  end

  def ending_time_after_starting_time
    if ending_time.present? && starting_time.present? && ending_time <= starting_time
      errors.add(:ending_time, "must be after starting time")
    end
  end

  def photos_presence_and_count
    # Require photos to be attached
    unless photos.attached?
      errors.add(:photos, "must have between 2 and 6 photos")
      return
    end

    total_photos = photos.size
    if total_photos < 2 || total_photos > 6
      errors.add(:photos, "must have between 2 and 6 photos")
    end
  end

  def acceptable_photos
    return unless photos.attached?

    photos.each do |photo|
      unless photo.content_type.in?(%w[image/jpeg image/png image/jpg image/gif])
        errors.add(:photos, "must be a JPEG, PNG, JPG, or GIF")
        break
      end

      unless photo.byte_size <= 5.megabytes
        errors.add(:photos, "must be less than 5MB each")
        break
      end
    end
  end
end
