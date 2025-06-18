import { Controller } from "@hotwired/stimulus"
import mapboxgl from "mapbox-gl"

export default class extends Controller {
  static values = {
    token: String,
    events: Array
  }

  connect() {
    if (!this.tokenValue) {
      console.error("Mapbox token not provided")
      this.element.innerHTML = '<div class="flex items-center justify-center h-full bg-gray-100 text-gray-500">Mapbox API key not configured</div>'
      return
    }

    mapboxgl.accessToken = this.tokenValue

    // Always start fresh when connecting (for page navigation scenarios)
    this.map = null;

    // Add event listeners first
    this.addEventListeners();

    // Initialize map immediately since container dimensions are correct
    this.initializeMap();
  }

  addEventListeners() {
    // Add resize listener
    this.resizeHandler = () => this.resize();
    window.addEventListener('resize', this.resizeHandler);

    // Add custom event listener for map resize
    this.mapResizeHandler = () => this.resize();
    document.addEventListener('mapResize', this.mapResizeHandler);

    // Add custom event listener for map initialization
    this.mapInitHandler = () => this.forceInitialize();
    this.element.addEventListener('mapInit', this.mapInitHandler);
  }

  initializeMap() {
    try {
      // Create the map
      this.map = new mapboxgl.Map({
        container: this.element,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-74.006, 40.7128], // Default to NYC, will be adjusted based on events
        zoom: 10
      })

      // Add navigation controls
      this.map.addControl(new mapboxgl.NavigationControl())

      // Wait for map to load before adding markers
      this.map.on('load', () => {
        this.addEventMarkers()
        this.fitMapToEvents()
      })

      this.map.on('error', (e) => {
        console.error('Map error:', e);
      })
    } catch (error) {
      console.error('Error creating map:', error);
      this.element.innerHTML = '<div class="flex items-center justify-center h-full bg-red-100 text-red-600">Error loading map. Please refresh the page.</div>';
    }
  }

  addEventMarkers() {
    if (!this.eventsValue || this.eventsValue.length === 0) return;

    this.eventsValue.forEach((event, index) => {
      if (event.latitude && event.longitude) {
        // Create a custom marker element
        const markerEl = document.createElement('div')
        markerEl.className = 'event-marker'
        markerEl.innerHTML = `
          <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 0C10.477 0 6 4.477 6 10c0 7 10 30 10 30s10-23 10-30c0-5.523-4.477-10-10-10z" fill="#8b5cf6" stroke="white" stroke-width="2"/>
            <circle cx="16" cy="12" r="6" fill="white"/>
            <text x="16" y="16" text-anchor="middle" font-size="12" font-weight="bold" fill="#8b5cf6">${event.category ? event.category.charAt(0).toUpperCase() : 'E'}</text>
          </svg>
        `

        // Create popup content
        const popupContent = `
          <div class="p-3 max-w-xs">
            <h3 class="font-bold text-lg mb-2">${event.title}</h3>
            <p class="text-gray-600 mb-1"><strong>Location:</strong> ${event.location}</p>
            <p class="text-gray-600 mb-1"><strong>Category:</strong> ${event.category}</p>
            <p class="text-gray-600 mb-1"><strong>Date:</strong> ${event.starting_time}</p>
            <p class="text-gray-600 mb-3"><strong>Price:</strong> $${event.price}</p>
            <a href="${event.url}" class="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors">
              View Details
            </a>
          </div>
        `

        // Create popup
        const popup = new mapboxgl.Popup({
          offset: 25,
          closeButton: true,
          closeOnClick: false
        }).setHTML(popupContent)

        // Add marker to map
        new mapboxgl.Marker(markerEl)
          .setLngLat([event.longitude, event.latitude])
          .setPopup(popup)
          .addTo(this.map)
      }
    })
  }

  fitMapToEvents() {
    if (!this.eventsValue || this.eventsValue.length === 0) return

    const coordinates = this.eventsValue
      .filter(event => event.latitude && event.longitude)
      .map(event => [event.longitude, event.latitude])

    if (coordinates.length === 0) return

    if (coordinates.length === 1) {
      // If only one event, center on it with a reasonable zoom
      this.map.setCenter(coordinates[0])
      this.map.setZoom(12)
    } else {
      // If multiple events, fit bounds to include all
      const bounds = new mapboxgl.LngLatBounds()
      coordinates.forEach(coord => bounds.extend(coord))
      this.map.fitBounds(bounds, {
        padding: 50,
        maxZoom: 15
      })
    }
  }

  disconnect() {
    // Clean up the map when disconnecting (for page navigation)
    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    // Clean up event listeners
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
    if (this.mapResizeHandler) {
      document.removeEventListener('mapResize', this.mapResizeHandler);
    }
    if (this.mapInitHandler) {
      this.element.removeEventListener('mapInit', this.mapInitHandler);
    }
  }

  // Method to resize the map when it becomes visible
  resize() {
    if (this.map) {
      this.map.resize();
    }
  }

  // Method to force map initialization
  forceInitialize() {
    if (!this.map) {
      this.initializeMap();
    } else {
      this.resize();
      // Also refit to events to ensure they're visible
      this.fitMapToEvents();
    }
  }
}
