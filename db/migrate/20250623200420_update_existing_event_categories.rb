class UpdateExistingEventCategories < ActiveRecord::Migration[8.0]
  def change
    # Define the valid categories
    valid_categories = [
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
    ]

    # Update any events with invalid categories to use "Live Music & Concerts" as default
    # This is a safe default for most events
    execute <<-SQL
      UPDATE scheduled_events
      SET category = 'Live Music & Concerts'
      WHERE category NOT IN (#{valid_categories.map { |cat| "'#{cat}'" }.join(', ')})
    SQL
  end
end
