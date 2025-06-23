import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["locationInput", "nearbySuggestions", "currentLocationBtn"]
  static values = {
    userLatitude: Number,
    userLongitude: Number,
    userCity: String,
    userCountry: String
  }

  connect() {
    this.currentPosition = null
    this.nearbyPlaces = []
  }

  // Get user's current location
  getCurrentLocation() {
    if (!navigator.geolocation) {
      this.showError("Geolocation is not supported by this browser.")
      return
    }

    this.currentLocationBtnTarget.disabled = true
    this.currentLocationBtnTarget.textContent = "Getting location..."

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.currentPosition = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }

        this.currentLocationBtnTarget.textContent = "Location found!"
        this.currentLocationBtnTarget.classList.add("bg-green-500")

        // Store location in session storage for later use
        sessionStorage.setItem('userLatitude', this.currentPosition.latitude)
        sessionStorage.setItem('userLongitude', this.currentPosition.longitude)

        // Get nearby places
        this.getNearbyPlaces()
      },
      (error) => {
        this.currentLocationBtnTarget.disabled = false
        this.currentLocationBtnTarget.textContent = "Get My Location"

        switch(error.code) {
          case error.PERMISSION_DENIED:
            this.showError("Location access was denied. Please enable location services.")
            break
          case error.POSITION_UNAVAILABLE:
            this.showError("Location information is unavailable.")
            break
          case error.TIMEOUT:
            this.showError("Location request timed out.")
            break
          default:
            this.showError("An unknown error occurred.")
            break
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    )
  }

  // Get nearby places using Mapbox API
  async getNearbyPlaces() {
    if (!this.currentPosition) return

    try {
      const response = await fetch(`/api/nearby_places?lat=${this.currentPosition.latitude}&lng=${this.currentPosition.longitude}`)
      const data = await response.json()

      if (data.success) {
        this.nearbyPlaces = data.places
        this.showNearbySuggestions()
      }
    } catch (error) {
      console.error('Error fetching nearby places:', error)
    }
  }

  // Show nearby place suggestions
  showNearbySuggestions() {
    if (!this.nearbySuggestionsTarget || this.nearbyPlaces.length === 0) return

    const suggestionsHtml = this.nearbyPlaces.map(place => `
      <div class="suggestion-item p-3 border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
           data-action="click->location#selectPlace"
           data-place-name="${place.name}"
           data-place-address="${place.address}">
        <div class="font-medium text-gray-900">${place.name}</div>
        <div class="text-sm text-gray-600">${place.address}</div>
        <div class="text-xs text-gray-500">${place.distance}km away</div>
      </div>
    `).join('')

    this.nearbySuggestionsTarget.innerHTML = `
      <div class="bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
        <div class="p-3 border-b border-gray-200 bg-gray-50">
          <h3 class="font-medium text-gray-900">Nearby Places</h3>
          <p class="text-sm text-gray-600">Click to select a location</p>
        </div>
        ${suggestionsHtml}
      </div>
    `
    this.nearbySuggestionsTarget.classList.remove('hidden')
  }

  // Select a place from suggestions
  selectPlace(event) {
    const placeName = event.currentTarget.dataset.placeName
    const placeAddress = event.currentTarget.dataset.placeAddress

    if (this.locationInputTarget) {
      this.locationInputTarget.value = placeName
    }

    this.nearbySuggestionsTarget.classList.add('hidden')

    // Trigger input event to update any dependent fields
    this.locationInputTarget.dispatchEvent(new Event('input', { bubbles: true }))
  }

  // Use current location as context for location input
  useCurrentLocationAsContext() {
    if (!this.currentPosition) {
      this.showError("Please get your current location first.")
      return
    }

    // Add a note to the location input about using current location context
    if (this.locationInputTarget) {
      const currentValue = this.locationInputTarget.value
      if (currentValue) {
        this.locationInputTarget.placeholder = `e.g., "Park near me" or "Restaurant in ${this.userCityValue || 'your area'}"`
      }
    }
  }

  // Show error message
  showError(message) {
    // Create a temporary error message
    const errorDiv = document.createElement('div')
    errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50'
    errorDiv.textContent = message

    document.body.appendChild(errorDiv)

    setTimeout(() => {
      errorDiv.remove()
    }, 5000)
  }

  // Hide suggestions when clicking outside
  hideSuggestions() {
    if (this.nearbySuggestionsTarget) {
      this.nearbySuggestionsTarget.classList.add('hidden')
    }
  }
}
