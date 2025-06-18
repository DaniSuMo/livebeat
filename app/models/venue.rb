class Venue < ApplicationRecord
  belongs_to :user
  has_many :scheduled_events, dependent: :destroy

  validates :name, presence: true, length: { minimum: 2, maximum: 100 }
end
