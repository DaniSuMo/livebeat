Geocoder.configure(
  # Geocoding options
  timeout: 10,                 # geocoding service timeout (secs) - increased for better reliability
  lookup: :mapbox,             # name of geocoding service (symbol)
  ip_lookup: :ipinfo_io,       # name of IP address geocoding service (symbol)
  language: :en,               # ISO-639 language code
  use_https: true,             # use HTTPS for lookup requests? (if supported)
  # http_proxy: nil,            # HTTP proxy server (user:pass@host:port)
  # https_proxy: nil,           # HTTPS proxy server (user:pass@host:port)
  api_key: ENV['MAPBOX_API_KEY'], # API key for geocoding service
  # cache: nil,                 # cache object (must respond to #[], #[]=, and #del)

  # Exceptions that should not be rescued by default
  # (if you want to implement custom error handling);
  # supports SocketError and Timeout::Error
  always_raise: [Geocoder::OverQueryLimitError, Geocoder::RequestDenied, Geocoder::InvalidRequest, Geocoder::InvalidApiKey],

  # Calculation options
  units: :km,                  # :km for kilometers or :mi for miles
  distances: :spherical,       # :spherical or :linear

  # Cache configuration
  cache_options: {
    expiration: 30.days,       # Cache geocoding results for 30 days
    prefix: 'geocoder:'
  }
)
