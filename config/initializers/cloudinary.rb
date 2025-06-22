# Cloudinary configuration
Cloudinary.config do |config|
  config.cloud_name = ENV['CLOUDINARY_CLOUD_NAME'] || 'dos5yrffh'
  config.api_key = ENV['CLOUDINARY_API_KEY']
  config.api_secret = ENV['CLOUDINARY_API_SECRET']
  config.secure = true
end

# Alternative configuration using CLOUDINARY_URL
if ENV['CLOUDINARY_URL']
  Cloudinary.config_from_url(ENV['CLOUDINARY_URL'])
  Cloudinary.config.secure = true
end
