class ScheduledEvent < ApplicationRecord
  belongs_to :venue

  # Validations
  validates :title, presence: true
  validates :location, presence: true
  validates :category, presence: true
  validates :starting_time, presence: true
  validates :price, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :capacity, presence: true, numericality: { greater_than: 0 }

  # Ensure ending_time is after starting_time
  validate :ending_time_after_starting_time
  geocoded_by :location
  after_validation :geocode, if: :will_save_change_to_location?

  private

  def ending_time_after_starting_time
    if ending_time.present? && starting_time.present? && ending_time <= starting_time
      errors.add(:ending_time, "must be after starting time")
    end
  end
end
