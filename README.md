# LiveBeat

A Rails application for managing live music events and venues.

## Features

- User authentication with Devise
- Venue management
- Event scheduling with photo uploads
- Interactive map view using Mapbox
- Responsive design with Tailwind CSS

## Photo Upload Feature

The application supports photo uploads for scheduled events with the following specifications:

- **Minimum photos**: 2
- **Maximum photos**: 6
- **Supported formats**: JPEG, PNG, JPG, GIF
- **Maximum file size**: 5MB per photo
- **Storage**: Cloudinary cloud storage
- **Preview**: Real-time image previews during upload

### Environment Variables Required

To use the photo upload feature, you need to set the following environment variable:

```bash
CLOUDINARY_URL=cloudinary://<your_api_key>:<your_api_secret>@<your_cloud_name>
```

Alternatively, you can use separate environment variables:

```bash
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Setup

1. Clone the repository
2. Install dependencies: `bundle install`
3. Set up the database: `bin/rails db:setup`
4. Configure environment variables
5. Start the server: `bin/rails server`

## Development

- Run tests: `bin/rails test`
- Check code style: `bin/rubocop`
- Security audit: `bin/brakeman`
