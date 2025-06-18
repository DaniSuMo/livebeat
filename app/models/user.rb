class User < ApplicationRecord
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable

  # Associations
  has_one :venue, dependent: :destroy

  # Virtual attribute for venue name during registration
  attr_accessor :venue_name

  # Validations
  validates :first_name, presence: true, length: { minimum: 2, maximum: 50 }
  validates :last_name, presence: true, length: { minimum: 2, maximum: 50 }
  # Stricter email regex: must have at least one dot after the @
  VALID_EMAIL_REGEX = /\A[^\s@]+@[^\s@]+\.[^\s@]+\z/
  validates :email, presence: true, uniqueness: true,
            format: { with: VALID_EMAIL_REGEX, message: "must be a valid email address (e.g. user@example.com)" }
  validates :user_type, presence: true, inclusion: { in: %w[user venue], message: "must be either 'user' or 'venue'" }
  validates :phone_number, presence: true, format: { with: /\A\+?[\d\s\-\(\)]{10,}\z/, message: "must be a valid phone number" }
  validates :address, presence: true, length: { minimum: 10, maximum: 200 }
  validates :date_of_birth, presence: true
  validate :date_of_birth_cannot_be_in_the_future
  validate :user_must_be_at_least_18_years_old
  validate :venue_name_required_for_venue_users

  # User type constants
  USER_TYPES = %w[user venue].freeze

  # Helper methods
  def full_name
    "#{first_name} #{last_name}".strip
  end

  def user?
    user_type == 'user'
  end

  def venue?
    user_type == 'venue'
  end

  def user_type_display
    user? ? 'Music Lover' : 'Venue Owner'
  end

  def user_type_description
    user? ? 'Find and attend events' : 'Host and manage events'
  end

  def age
    return nil unless date_of_birth
    now = Time.current.to_date
    now.year - date_of_birth.year - (date_of_birth.to_date.change(year: now.year) > now ? 1 : 0)
  end

  private

  def date_of_birth_cannot_be_in_the_future
    if date_of_birth.present? && date_of_birth > Date.current
      errors.add(:date_of_birth, "cannot be in the future")
    end
  end

  def user_must_be_at_least_18_years_old
    if date_of_birth.present? && age && age < 18
      errors.add(:date_of_birth, "user must be at least 18 years old")
    end
  end

  def venue_name_required_for_venue_users
    if venue? && venue_name.blank?
      errors.add(:venue_name, "is required for venue owners")
    end
  end
end
