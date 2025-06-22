class ScheduledEvent < ApplicationRecord
  belongs_to :venue

  # Validations
  validates :title, presence: true
  validates :location, presence: true
  validates :category, presence: true
  validates :starting_time, presence: true
  validates :price, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :capacity, presence: true, numericality: { greater_than: 0 }

  # Photo validations
  validates :photos, presence: true
  validates :photos, length: { minimum: 2, maximum: 6, message: "must have between 2 and 6 photos" }
  validate :acceptable_photos

  # Ensure ending_time is after starting_time
  validate :ending_time_after_starting_time
  geocoded_by :location
  after_validation :geocode, if: :will_save_change_to_location?
  has_many_attached :photos

  private

  def ending_time_after_starting_time
    if ending_time.present? && starting_time.present? && ending_time <= starting_time
      errors.add(:ending_time, "must be after starting time")
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
