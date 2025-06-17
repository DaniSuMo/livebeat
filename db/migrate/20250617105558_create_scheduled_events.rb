class CreateScheduledEvents < ActiveRecord::Migration[8.0]
  def change
    create_table :scheduled_events do |t|
      t.string :title
      t.string :location
      t.string :category
      t.datetime :starting_time
      t.datetime :ending_time
      t.text :description
      t.decimal :price
      t.references :venue, null: false, foreign_key: true
      t.integer :capacity

      t.timestamps
    end
  end
end
