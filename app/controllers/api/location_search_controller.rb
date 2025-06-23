class Api::LocationSearchController < ApplicationController
  skip_before_action :verify_authenticity_token

  def index
    query = params[:q]
    lat = params[:lat] # Optional: user's current latitude for proximity bias
    lng = params[:lng] # Optional: user's current longitude for proximity bias

    if query.blank?
      render json: { success: false, error: 'Query parameter is required' }, status: :bad_request
      return
    end

    begin
      places = search_places(query, lat, lng)
      render json: { success: true, places: places }
    rescue => e
      render json: { success: false, error: e.message }, status: :internal_server_error
    end
  end

  private

  def search_places(query, lat = nil, lng = nil)
    mapbox_token = ENV['MAPBOX_API_KEY']

    if mapbox_token.blank?
      raise 'Mapbox API key not configured'
    end

    # Convert lat/lng to float if present
    lat_f = lat.present? ? lat.to_f : nil
    lng_f = lng.present? ? lng.to_f : nil

    # Try multiple search strategies for better results
    all_places = []

    # Strategy 1: Search with POI priority
    places_poi = search_with_strategy(query, mapbox_token, 'poi,place,address', lat_f, lng_f)
    all_places.concat(places_poi)

    # Strategy 2: If it's a transit-related query, try a broader search
    if query.downcase.include?('station') || query.downcase.include?('train') || query.downcase.include?('metro')
      places_broad = search_with_strategy(query, mapbox_token, 'place,address', lat_f, lng_f)
      all_places.concat(places_broad)
    end

    # Strategy 3: For specific landmarks, try exact name matching
    if query.downcase.include?('centraal') || query.downcase.include?('central')
      exact_query = query.gsub(/centraal/i, 'central').gsub(/central/i, 'centraal')
      places_exact = search_with_strategy(exact_query, mapbox_token, 'poi,place,address', lat_f, lng_f)
      all_places.concat(places_exact)
    end

    # Remove duplicates and apply custom relevance scoring
    unique_places = remove_duplicates(all_places)
    scored_places = apply_custom_relevance_scoring(unique_places, query, lat_f, lng_f)

    # Return top results
    scored_places.first(10)
  end

  def search_with_strategy(query, token, types, lat_f, lng_f)
    url = "https://api.mapbox.com/geocoding/v5/mapbox.places/#{URI.encode_www_form_component(query)}.json"
    params = {
      access_token: token,
      limit: 10,
      types: types,
      language: 'en'
    }

    # Add proximity bias if user location is available
    if lat_f && lng_f
      params[:proximity] = "#{lng_f},#{lat_f}"
      bbox_size = 0.05
      params[:bbox] = "#{lng_f - bbox_size},#{lat_f - bbox_size},#{lng_f + bbox_size},#{lat_f + bbox_size}"
    end

    uri = URI(url)
    uri.query = URI.encode_www_form(params)

    response = Net::HTTP.get_response(uri)

    if response.is_a?(Net::HTTPSuccess)
      data = JSON.parse(response.body)

      data['features'].map do |feature|
        {
          id: feature['id'],
          name: feature['text'],
          full_name: feature['place_name'],
          address: feature['place_name'],
          latitude: feature['center'][1],
          longitude: feature['center'][0],
          type: feature['place_type'][0],
          relevance: feature['relevance']
        }
      end
    else
      []
    end
  end

  def remove_duplicates(places)
    seen = Set.new
    places.select do |place|
      key = "#{place[:latitude]},#{place[:longitude]}"
      if seen.include?(key)
        false
      else
        seen.add(key)
        true
      end
    end
  end

  def apply_custom_relevance_scoring(places, query, lat_f, lng_f)
    query_lower = query.downcase

    places.map do |place|
      # Start with the original relevance score
      custom_score = place[:relevance]

      # Boost exact name matches
      if place[:name].downcase == query_lower || place[:full_name].downcase.include?(query_lower)
        custom_score += 0.4
      end

      # Boost partial name matches
      if place[:name].downcase.include?(query_lower) || query_lower.include?(place[:name].downcase)
        custom_score += 0.3
      end

      # Boost specific landmark types
      if query_lower.include?('station') && (place[:type] == 'poi' || place[:full_name].downcase.include?('station'))
        custom_score += 0.5
      end

      if query_lower.include?('park') && (place[:type] == 'poi' || place[:full_name].downcase.include?('park'))
        custom_score += 0.4
      end

      if query_lower.include?('airport') && (place[:type] == 'poi' || place[:full_name].downcase.include?('airport'))
        custom_score += 0.5
      end

      # Boost results in the same city/region as the query
      if query_lower.include?('rotterdam') && place[:full_name].downcase.include?('rotterdam')
        custom_score += 0.3
      end

      # Boost results closer to user location if available
      if lat_f && lng_f
        distance = Geocoder::Calculations.distance_between([lat_f, lng_f], [place[:latitude], place[:longitude]])
        # Boost closer results (max 0.3 boost for very close results)
        distance_boost = [0.3, (10 - distance) / 10.0 * 0.3].max
        custom_score += distance_boost
      end

      # Cap the score at 1.0
      place[:relevance] = [custom_score, 1.0].min
      place
    end.sort_by { |place| -place[:relevance] }
  end
end
