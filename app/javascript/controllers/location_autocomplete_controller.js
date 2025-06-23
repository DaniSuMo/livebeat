import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["input", "suggestions", "latitude", "longitude"]
  static values = {
    userLatitude: Number,
    userLongitude: Number
  }

  connect() {
    this.searchTimeout = null
    this.suggestions = []
    this.selectedIndex = -1
    this.isSettingValue = false // Flag to prevent search when setting value
  }

  // Handle input changes
  onInput() {
    // Don't search if we're programmatically setting the value
    if (this.isSettingValue) return

    const query = this.inputTarget.value.trim()

    if (query.length < 2) {
      this.hideSuggestions()
      return
    }

    // Debounce the search
    clearTimeout(this.searchTimeout)
    this.searchTimeout = setTimeout(() => {
      this.searchLocations()
    }, 300)
  }

  // Search for locations
  async searchLocations() {
    const query = this.inputTarget.value.trim()

    if (query.length < 2) return

    try {
      let url = `/api/location_search?q=${encodeURIComponent(query)}`

      // Optionally add user location as proximity bias if available
      if (this.hasUserLatitudeValue && this.hasUserLongitudeValue) {
        url += `&lat=${this.userLatitudeValue}&lng=${this.userLongitudeValue}`
      }

      const response = await fetch(url)
      const data = await response.json()

      if (data.success) {
        this.suggestions = data.places
        this.showSuggestions()
      } else {
        console.error('Search failed:', data.error)
      }
    } catch (error) {
      console.error('Error searching locations:', error)
    }
  }

  // Show location suggestions
  showSuggestions() {
    if (!this.suggestionsTarget || this.suggestions.length === 0) return

    const suggestionsHtml = this.suggestions.map((place, index) => `
      <div class="suggestion-item p-3 border-b border-gray-200 hover:bg-gray-50 cursor-pointer ${index === this.selectedIndex ? 'bg-blue-50' : ''}"
           data-action="click->location-autocomplete#selectPlace"
           data-index="${index}"
           data-place-name="${place.name}"
           data-place-address="${place.full_name}"
           data-place-lat="${place.latitude}"
           data-place-lng="${place.longitude}">
        <div class="font-medium text-gray-900">${place.name}</div>
        <div class="text-sm text-gray-600">${place.full_name}</div>
        <div class="text-xs text-gray-500">${this.getPlaceTypeIcon(place.type)} ${place.type}</div>
      </div>
    `).join('')

    this.suggestionsTarget.innerHTML = `
      <div class="bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto z-50">
        <div class="p-3 border-b border-gray-200 bg-gray-50">
          <h3 class="font-medium text-gray-900">Location Suggestions</h3>
          <p class="text-sm text-gray-600">Click to select a location</p>
        </div>
        ${suggestionsHtml}
      </div>
    `
    this.suggestionsTarget.classList.remove('hidden')
  }

  // Get icon for place type
  getPlaceTypeIcon(type) {
    const icons = {
      'poi': '🏢',
      'place': '📍',
      'address': '🏠',
      'neighborhood': '🏘️',
      'postcode': '📮',
      'country': '🌍',
      'region': '🗺️'
    }
    return icons[type] || '📍'
  }

  // Select a place from suggestions
  selectPlace(event) {
    const index = parseInt(event.currentTarget.dataset.index)
    const place = this.suggestions[index]

    if (place) {
      // Set flag to prevent search
      this.isSettingValue = true

      // Set the full address in the input
      this.inputTarget.value = place.full_name
      this.latitudeTarget.value = place.latitude
      this.longitudeTarget.value = place.longitude

      this.hideSuggestions()
      this.inputTarget.blur() // Blur to prevent dropdown reopening

      // Reset flag after a short delay
      setTimeout(() => {
        this.isSettingValue = false
      }, 100)

      // Trigger input event to update any dependent fields
      this.inputTarget.dispatchEvent(new Event('input', { bubbles: true }))
    }
  }

  // Handle keyboard navigation
  onKeydown(event) {
    if (!this.suggestionsTarget.classList.contains('hidden')) {
      switch(event.key) {
        case 'ArrowDown':
          event.preventDefault()
          this.selectedIndex = Math.min(this.selectedIndex + 1, this.suggestions.length - 1)
          this.updateSelectedSuggestion()
          break
        case 'ArrowUp':
          event.preventDefault()
          this.selectedIndex = Math.max(this.selectedIndex - 1, -1)
          this.updateSelectedSuggestion()
          break
        case 'Enter':
          event.preventDefault()
          if (this.selectedIndex >= 0 && this.selectedIndex < this.suggestions.length) {
            const place = this.suggestions[this.selectedIndex]
            this.isSettingValue = true
            this.inputTarget.value = place.full_name
            this.latitudeTarget.value = place.latitude
            this.longitudeTarget.value = place.longitude
            this.hideSuggestions()
            setTimeout(() => {
              this.isSettingValue = false
            }, 100)
          }
          break
        case 'Escape':
          this.hideSuggestions()
          break
      }
    }
  }

  updateSelectedSuggestion() {
    const items = this.suggestionsTarget.querySelectorAll('.suggestion-item')
    items.forEach((item, index) => {
      if (index === this.selectedIndex) {
        item.classList.add('bg-blue-50')
      } else {
        item.classList.remove('bg-blue-50')
      }
    })
  }

  // Hide suggestions
  hideSuggestions() {
    if (this.suggestionsTarget) {
      this.suggestionsTarget.classList.add('hidden')
    }
    this.selectedIndex = -1
  }

  // Show error message
  showError(message) {
    const errorDiv = document.createElement('div')
    errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50'
    errorDiv.textContent = message

    document.body.appendChild(errorDiv)

    setTimeout(() => {
      errorDiv.remove()
    }, 5000)
  }
}
