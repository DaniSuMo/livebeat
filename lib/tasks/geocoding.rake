namespace :geocoding do
  desc "Update coordinates for existing events with improved geocoding"
  task update_existing_events: :environment do
    puts "Starting to update coordinates for existing events..."

    total_events = ScheduledEvent.count
    updated_count = 0
    error_count = 0

    ScheduledEvent.find_each do |event|
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
        sleep(0.2)
      rescue => e
        error_count += 1
        puts "  ✗ Error processing #{event.title}: #{e.message}"
      end
    end

    puts "\nGeocoding update completed!"
    puts "Total events: #{total_events}"
    puts "Successfully updated: #{updated_count}"
    puts "Errors: #{error_count}"
  end

  desc "Update coordinates for existing users"
  task update_user_coordinates: :environment do
    puts "Starting to update coordinates for existing users..."

    total_users = User.count
    updated_count = 0
    error_count = 0

    User.find_each do |user|
      begin
        if user.address.present? && (user.latitude.blank? || user.longitude.blank?)
          puts "Processing: #{user.full_name} at #{user.address}"

          # Force re-geocoding by temporarily clearing coordinates
          old_lat = user.latitude
          old_lng = user.longitude

          user.latitude = nil
          user.longitude = nil
          user.geocode

          if user.latitude.present? && user.longitude.present?
            user.save!
            updated_count += 1
            puts "  ✓ Updated coordinates: #{user.latitude}, #{user.longitude}"
          else
            # Restore old coordinates if geocoding failed
            user.latitude = old_lat
            user.longitude = old_lng
            error_count += 1
            puts "  ✗ Failed to geocode"
          end
        end

        # Rate limiting
        sleep(0.2)
      rescue => e
        error_count += 1
        puts "  ✗ Error processing #{user.full_name}: #{e.message}"
      end
    end

    puts "\nUser geocoding update completed!"
    puts "Total users: #{total_users}"
    puts "Successfully updated: #{updated_count}"
    puts "Errors: #{error_count}"
  end

  desc "Test geocoding for a specific location"
  task :test_location, [:location] => :environment do |task, args|
    location = args[:location]
    if location.blank?
      puts "Usage: rake geocoding:test_location[location_name]"
      exit
    end

    puts "Testing geocoding for: #{location}"

    # Create a temporary event to test geocoding
    temp_event = ScheduledEvent.new(location: location)
    temp_event.geocode

    if temp_event.latitude.present? && temp_event.longitude.present?
      puts "✓ Successfully geocoded!"
      puts "  Coordinates: #{temp_event.latitude}, #{temp_event.longitude}"
      puts "  Location with context: #{temp_event.send(:location_with_context)}"
    else
      puts "✗ Failed to geocode"
    end
  end

  desc "Test geocoding with venue context"
  task :test_with_venue_context, [:location, :venue_id] => :environment do |task, args|
    location = args[:location]
    venue_id = args[:venue_id]

    if location.blank? || venue_id.blank?
      puts "Usage: rake geocoding:test_with_venue_context[location_name,venue_id]"
      exit
    end

    venue = Venue.find(venue_id)
    puts "Testing geocoding for: #{location}"
    puts "Venue context: #{venue.user.address} (#{venue.user.city}, #{venue.user.country})"

    # Create a temporary event with venue context
    temp_event = ScheduledEvent.new(location: location, venue: venue)
    temp_event.geocode

    if temp_event.latitude.present? && temp_event.longitude.present?
      puts "✓ Successfully geocoded!"
      puts "  Coordinates: #{temp_event.latitude}, #{temp_event.longitude}"
      puts "  Location with context: #{temp_event.send(:location_with_context)}"
    else
      puts "✗ Failed to geocode"
    end
  end
end
