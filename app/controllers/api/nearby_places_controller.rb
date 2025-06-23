class Api::NearbyPlacesController < ApplicationController
  skip_before_action :verify_authenticity_token

  def index
    lat = params[:lat]
    lng = params[:lng]

    if lat.blank? || lng.blank?
      render json: { success: false, error: 'Latitude and longitude are required' }, status: :bad_request
      return
    end

    begin
      places = get_nearby_places(lat, lng)
      render json: { success: true, places: places }
    rescue => e
      render json: { success: false, error: e.message }, status: :internal_server_error
    end
  end

  private

  def get_nearby_places(lat, lng)
    mapbox_token = ENV['MAPBOX_API_KEY']

    if mapbox_token.blank?
      raise 'Mapbox API key not configured'
    end

    # Search for nearby places using Mapbox API
    url = "https://api.mapbox.com/geocoding/v5/mapbox.places/poi.json"
    params = {
      proximity: "#{lng},#{lat}",
      access_token: mapbox_token,
      limit: 10,
      types: 'poi'
    }

    uri = URI(url)
    uri.query = URI.encode_www_form(params)

    response = Net::HTTP.get_response(uri)

    if response.is_a?(Net::HTTPSuccess)
      data = JSON.parse(response.body)

      data['features'].map do |feature|
        {
          name: feature['text'],
          address: feature['place_name'],
          latitude: feature['center'][1],
          longitude: feature['center'][0],
          distance: calculate_distance(lat.to_f, lng.to_f, feature['center'][1], feature['center'][0])
        }
      end
    else
      raise "Mapbox API error: #{response.code}"
    end
  end

  def calculate_distance(lat1, lng1, lat2, lng2)
    Geocoder::Calculations.distance_between([lat1, lng1], [lat2, lng2]).round(1)
  end
end
