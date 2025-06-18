class AddCoordinatesToScheduledEvent < ActiveRecord::Migration[8.0]
  def change
    add_column :scheduled_events, :latitude, :float
    add_column :scheduled_events, :longitude, :float
  end
end
