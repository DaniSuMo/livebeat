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

    this.adjustMapHeight();
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
    this.resizeHandler = () => {
      this.adjustMapHeight();
      this.resize();
    };
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

    // Group events by location (latitude, longitude)
    const eventGroups = this.groupEventsByLocation(this.eventsValue);

    // Create markers for each group
    Object.keys(eventGroups).forEach(locationKey => {
      const events = eventGroups[locationKey];
      const firstEvent = events[0]; // Use first event for coordinates

      if (events.length === 1) {
        // Single event - create individual marker
        this.createEventMarker(firstEvent);
      } else {
        // Multiple events - create cluster marker
        this.createClusterMarker(events, firstEvent.latitude, firstEvent.longitude);
      }
    });
  }

  groupEventsByLocation(events) {
    const groups = {};

    events.forEach(event => {
      if (event.latitude && event.longitude) {
        // Create a key based on coordinates (rounded to 6 decimal places for grouping)
        const lat = parseFloat(event.latitude).toFixed(6);
        const lng = parseFloat(event.longitude).toFixed(6);
        const key = `${lat},${lng}`;

        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(event);
      }
    });

    return groups;
  }

  createEventMarker(event) {
    // Create a custom marker element
    const markerEl = document.createElement('div');
    markerEl.className = 'event-marker';
    markerEl.innerHTML = `
      <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 0C10.477 0 6 4.477 6 10c0 7 10 30 10 30s10-23 10-30c0-5.523-4.477-10-10-10z" fill="#8b5cf6" stroke="white" stroke-width="2"/>
        <circle cx="16" cy="12" r="6" fill="white"/>
        <text x="16" y="16" text-anchor="middle" font-size="12" font-weight="bold" fill="#8b5cf6">${event.category ? event.category.charAt(0).toUpperCase() : 'E'}</text>
      </svg>
    `;

    // Create popup content for single event
    const popupContent = this.createEventPopupContent(event);

    // Create popup
    const popup = new mapboxgl.Popup({
      offset: 25,
      closeButton: true,
      closeOnClick: false,
      className: 'custom-popup',
      maxWidth: '320px'
    }).setHTML(popupContent);

    // Add marker to map
    const marker = new mapboxgl.Marker(markerEl)
      .setLngLat([event.longitude, event.latitude])
      .setPopup(popup)
      .addTo(this.map);

    // Add carousel functionality after popup is added
    popup.on('open', () => {
      const popupEl = popup.getElement();

      // Ensure the close button has the gradient styling
      const closeButton = popupEl.querySelector('.mapboxgl-popup-close-button');
      if (closeButton) {
        closeButton.style.position = 'absolute';
        closeButton.style.top = '8px';
        closeButton.style.right = '8px';
        closeButton.style.width = '28px';
        closeButton.style.height = '28px';
        closeButton.style.background = 'linear-gradient(to right, #a855f7, #60a5fa)';
        closeButton.style.color = 'white';
        closeButton.style.borderRadius = '50%';
        closeButton.style.border = 'none';
        closeButton.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        closeButton.style.transition = 'all 0.2s ease-in-out';
        closeButton.style.zIndex = '1000';
        closeButton.style.display = 'flex';
        closeButton.style.alignItems = 'center';
        closeButton.style.justifyContent = 'center';
        closeButton.style.cursor = 'pointer';

        // Ensure the popup content has relative positioning
        const popupContent = popupEl.querySelector('.mapboxgl-popup-content');
        if (popupContent) {
          popupContent.style.position = 'relative';
        }

        // Add hover effect
        closeButton.addEventListener('mouseenter', () => {
          closeButton.style.transform = 'scale(1.1)';
          closeButton.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
          closeButton.style.background = 'linear-gradient(to right, #8b5cf6, #3b82f6)';
        });

        closeButton.addEventListener('mouseleave', () => {
          closeButton.style.transform = 'scale(1)';
          closeButton.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
          closeButton.style.background = 'linear-gradient(to right, #a855f7, #60a5fa)';
        });
      }

      this.setupCarousel(popupEl, event.photos);
      this.ensurePopupVisible(popup);
    });
  }

  createClusterMarker(events, latitude, longitude) {
    // Create a custom cluster marker element
    const markerEl = document.createElement('div');
    markerEl.className = 'cluster-marker';
    markerEl.innerHTML = `
      <div style="
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, #8b5cf6, #3b82f6);
        border: 3px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 14px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        cursor: pointer;
        transition: all 0.2s ease;
      " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
        ${events.length}
      </div>
    `;

    // Create popup content for cluster
    const popupContent = this.createClusterPopupContent(events);

    // Create popup
    const popup = new mapboxgl.Popup({
      offset: 25,
      closeButton: true,
      closeOnClick: false,
      className: 'custom-popup cluster-popup',
      maxWidth: '400px'
    }).setHTML(popupContent);

    // Add marker to map
    const marker = new mapboxgl.Marker(markerEl)
      .setLngLat([longitude, latitude])
      .setPopup(popup)
      .addTo(this.map);

    // Add carousel functionality for each event in cluster
    popup.on('open', () => {
      const popupEl = popup.getElement();

      // Ensure the close button has the gradient styling
      const closeButton = popupEl.querySelector('.mapboxgl-popup-close-button');
      if (closeButton) {
        closeButton.style.position = 'absolute';
        closeButton.style.top = '8px';
        closeButton.style.right = '8px';
        closeButton.style.width = '28px';
        closeButton.style.height = '28px';
        closeButton.style.background = 'linear-gradient(to right, #a855f7, #60a5fa)';
        closeButton.style.color = 'white';
        closeButton.style.borderRadius = '50%';
        closeButton.style.border = 'none';
        closeButton.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        closeButton.style.transition = 'all 0.2s ease-in-out';
        closeButton.style.zIndex = '1000';
        closeButton.style.display = 'flex';
        closeButton.style.alignItems = 'center';
        closeButton.style.justifyContent = 'center';
        closeButton.style.cursor = 'pointer';

        // Ensure the popup content has relative positioning
        const popupContent = popupEl.querySelector('.mapboxgl-popup-content');
        if (popupContent) {
          popupContent.style.position = 'relative';
        }

        // Add hover effect
        closeButton.addEventListener('mouseenter', () => {
          closeButton.style.transform = 'scale(1.1)';
          closeButton.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
          closeButton.style.background = 'linear-gradient(to right, #8b5cf6, #3b82f6)';
        });

        closeButton.addEventListener('mouseleave', () => {
          closeButton.style.transform = 'scale(1)';
          closeButton.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
          closeButton.style.background = 'linear-gradient(to right, #a855f7, #60a5fa)';
        });
      }

      this.setupClusterCarousels(popupEl, events);
      this.ensurePopupVisible(popup);
    });
  }

  createEventPopupContent(event) {
    return `
      <div class="p-4 max-w-sm">
        ${event.photos && event.photos.length > 0 ? `
          <div class="mb-4">
            <div class="relative group">
              <div class="photo-carousel overflow-hidden rounded-lg" style="height: 200px;">
                ${event.photos.map((photo, photoIndex) => `
                  <img src="${photo.url}"
                       alt="Event photo ${photoIndex + 1}"
                       class="w-full h-full object-cover ${photoIndex === 0 ? 'block' : 'hidden'}"
                       data-photo-index="${photoIndex}">
                `).join('')}
              </div>

              ${event.photos.length > 1 ? `
                <!-- Photo counter indicator -->
                <div style="position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,0.6); color: white; font-size: 10px; padding: 2px 6px; border-radius: 8px; font-weight: 500; z-index: 1000;">
                  <span class="current-photo">1</span> / <span class="total-photos">${event.photos.length}</span>
                </div>

                <!-- Previous button -->
                <button class="carousel-prev"
                        style="position: absolute; left: 4px; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.7); color: white; border-radius: 50%; width: 28px; height: 28px; border: none; cursor: pointer; transition: all 0.3s; z-index: 1000; display: flex; align-items: center; justify-content: center;"
                        title="Previous photo">
                  <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
                  </svg>
                </button>

                <!-- Next button -->
                <button class="carousel-next"
                        style="position: absolute; right: 4px; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.7); color: white; border-radius: 50%; width: 28px; height: 28px; border: none; cursor: pointer; transition: all 0.3s; z-index: 1000; display: flex; align-items: center; justify-content: center;"
                        title="Next photo">
                  <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
                  </svg>
                </button>
              ` : ''}
            </div>
          </div>
        ` : ''}
        <h3 class="font-bold text-lg mb-3 text-gray-900 text-center">${event.title}</h3>
        <div class="space-y-2 mb-4 text-sm text-gray-700">
          <p class="flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <span>${event.location}</span>
          </p>
          <p class="flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-3 text-gray-500" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a1 1 0 011-1h5a1 1 0 01.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" /></svg>
            <span>${event.category}</span>
          </p>
          <p class="flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <span>${this.formatEventDate(event.starting_time, event.ending_time)}</span>
          </p>
          <p class="flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
            <span>${event.price == 0 ? 'Free entry' : `$${event.price}`}</span>
          </p>
        </div>
        <div class="flex justify-center mt-4">
          <a href="${event.url}" class="inline-block px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-xl hover:from-purple-700 hover:to-blue-600 transition-all duration-300 font-semibold text-sm shadow-lg">
            View Details
          </a>
        </div>
      </div>
    `;
  }

  createClusterPopupContent(events) {
    const eventsList = events.map(event => `
      <div class="event-item border-b border-gray-200 pb-3 mb-3 last:border-b-0 last:pb-0 last:mb-0">
        <div class="flex items-start space-x-3">
          ${event.photos && event.photos.length > 0 ? `
            <div class="flex-shrink-0">
              <img src="${event.photos[0].url}" alt="${event.title}" class="w-16 h-16 object-cover rounded-lg">
            </div>
          ` : ''}
          <div class="flex-1 min-w-0">
            <h4 class="font-semibold text-gray-900 text-sm mb-1">${event.title}</h4>
            <p class="text-gray-600 text-xs mb-1">${event.category}</p>
            <p class="text-gray-500 text-xs mb-1">${this.formatEventDate(event.starting_time, event.ending_time)}</p>
            <p class="text-gray-500 text-xs mb-2">${event.price == 0 ? 'Free entry' : `$${event.price}`}</p>
            <a href="${event.url}" class="inline-block px-3 py-1 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-lg hover:from-purple-700 hover:to-blue-600 transition-all duration-300 font-semibold text-xs shadow-md">
              View Details
            </a>
          </div>
        </div>
      </div>
    `).join('');

    return `
      <div class="p-4 max-w-sm">
        <h3 class="font-bold text-lg mb-3 text-gray-900 text-center">
          ${events.length} Event${events.length > 1 ? 's' : ''} at this location
        </h3>
        <div class="space-y-2 mb-4 text-sm text-gray-700">
          <p class="flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <span>${events[0].location}</span>
          </p>
        </div>
        <div class="max-h-64 overflow-y-auto">
          ${eventsList}
        </div>
      </div>
    `;
  }

  setupClusterCarousels(popupElement, events) {
    // For cluster popups, we don't need carousel functionality since we show thumbnails
    // But we can add any additional functionality here if needed
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

  // Setup carousel functionality for popup
  setupCarousel(popupElement, photos) {
    if (!photos || photos.length <= 1) return;

    const carousel = popupElement.querySelector('.photo-carousel');
    const prevBtn = popupElement.querySelector('.carousel-prev');
    const nextBtn = popupElement.querySelector('.carousel-next');
    const images = popupElement.querySelectorAll('.photo-carousel img');
    const currentPhotoSpan = popupElement.querySelector('.current-photo');

    let currentIndex = 0;
    let autoAdvanceInterval;

    const showImage = (index) => {
      // Update images
      images.forEach((img, i) => {
        img.classList.toggle('block', i === index);
        img.classList.toggle('hidden', i !== index);
      });

      // Update photo counter
      if (currentPhotoSpan) {
        currentPhotoSpan.textContent = index + 1;
      }

      // Reset auto-advance timer
      this.resetAutoAdvance();
    };

    // Add hover effects for navigation buttons
    if (prevBtn) {
      prevBtn.addEventListener('mouseenter', () => {
        prevBtn.style.background = 'rgba(0,0,0,0.8)';
        prevBtn.style.transform = 'translateY(-50%) scale(1.1)';
      });
      prevBtn.addEventListener('mouseleave', () => {
        prevBtn.style.background = 'rgba(0,0,0,0.7)';
        prevBtn.style.transform = 'translateY(-50%) scale(1)';
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('mouseenter', () => {
        nextBtn.style.background = 'rgba(0,0,0,0.8)';
        nextBtn.style.transform = 'translateY(-50%) scale(1.1)';
      });
      nextBtn.addEventListener('mouseleave', () => {
        nextBtn.style.background = 'rgba(0,0,0,0.7)';
        nextBtn.style.transform = 'translateY(-50%) scale(1)';
      });
    }

    // Previous button
    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        currentIndex = (currentIndex - 1 + images.length) % images.length;
        showImage(currentIndex);
      });
    }

    // Next button
    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        currentIndex = (currentIndex + 1) % images.length;
        showImage(currentIndex);
      });
    }

    // Keyboard navigation
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowLeft') {
        currentIndex = (currentIndex - 1 + images.length) % images.length;
        showImage(currentIndex);
      } else if (e.key === 'ArrowRight') {
        currentIndex = (currentIndex + 1) % images.length;
        showImage(currentIndex);
      }
    };

    // Add keyboard listeners when popup is focused
    popupElement.addEventListener('keydown', handleKeyPress);
    popupElement.setAttribute('tabindex', '0'); // Make popup focusable

    // Auto-advance functionality
    this.resetAutoAdvance = () => {
      if (autoAdvanceInterval) {
        clearInterval(autoAdvanceInterval);
      }

      autoAdvanceInterval = setInterval(() => {
        currentIndex = (currentIndex + 1) % images.length;
        showImage(currentIndex);
      }, 4000); // Increased to 4 seconds for better UX
    };

    // Start auto-advance
    this.resetAutoAdvance();

    // Pause auto-advance on hover
    carousel.addEventListener('mouseenter', () => {
      if (autoAdvanceInterval) {
        clearInterval(autoAdvanceInterval);
      }
    });

    carousel.addEventListener('mouseleave', () => {
      this.resetAutoAdvance();
    });

    // Touch/swipe support for mobile
    let startX = 0;
    let endX = 0;

    carousel.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
    }, { passive: true });

    carousel.addEventListener('touchend', (e) => {
      endX = e.changedTouches[0].clientX;
      const diffX = startX - endX;
      const threshold = 50; // Minimum swipe distance

      if (Math.abs(diffX) > threshold) {
        if (diffX > 0) {
          // Swipe left - next image
          currentIndex = (currentIndex + 1) % images.length;
        } else {
          // Swipe right - previous image
          currentIndex = (currentIndex - 1 + images.length) % images.length;
        }
        showImage(currentIndex);
      }
    }, { passive: true });

    // Clean up function
    const cleanup = () => {
      if (autoAdvanceInterval) {
        clearInterval(autoAdvanceInterval);
      }
      popupElement.removeEventListener('keydown', handleKeyPress);
    };

    // Clean up when popup closes
    popupElement.addEventListener('mouseleave', cleanup);

    // Also clean up when popup is removed from DOM
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.removedNodes.forEach((node) => {
            if (node === popupElement || node.contains?.(popupElement)) {
              cleanup();
              observer.disconnect();
            }
          });
        }
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  ensurePopupVisible(popup) {
    // A setTimeout is needed to wait for the popup to be fully rendered
    // before we can get its dimensions.
    setTimeout(() => {
      const popupEl = popup.getElement();
      if (!popupEl) return;

      const mapContainer = this.map.getContainer();
      const popupRect = popupEl.getBoundingClientRect();
      const mapRect = mapContainer.getBoundingClientRect();

      let panX = 0;
      let panY = 0;

      // Check for vertical overflow
      if (popupRect.bottom > mapRect.bottom) {
        // Popup is cut off at the bottom, pan up
        panY = popupRect.bottom - mapRect.bottom + 15; // 15px padding
      } else if (popupRect.top < mapRect.top) {
        // Popup is cut off at the top, pan down
        panY = popupRect.top - mapRect.top - 15; // 15px padding
      }

      // Check for horizontal overflow
      if (popupRect.right > mapRect.right) {
        // Popup is cut off at the right, pan left
        panX = popupRect.right - mapRect.right + 15;
      } else if (popupRect.left < mapRect.left) {
        // Popup is cut off at the left, pan right
        panX = popupRect.left - mapRect.left - 15;
      }

      if (panX !== 0 || panY !== 0) {
        this.map.panBy([panX, panY], { duration: 300, easing: (t) => t * (2 - t) });
      }
    }, 100);
  }

  adjustMapHeight() {
    const bottomNavbar = document.querySelector('nav.fixed.bottom-0');
    const navbarHeight = bottomNavbar ? bottomNavbar.offsetHeight : 0;

    // The map's direct parent is the div we need to style.
    const mapContainer = this.element.parentElement;

    if (mapContainer) {
      const mapTopOffset = mapContainer.getBoundingClientRect().top;
      const availableHeight = window.innerHeight - mapTopOffset - navbarHeight;
      mapContainer.style.height = `${availableHeight}px`;
    }
  }

  formatEventDate(startTime, endTime) {
    const start = new Date(startTime);
    const end = new Date(endTime);

    const weekday = start.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
    const day = start.toLocaleDateString('en-US', { day: 'numeric', timeZone: 'UTC' });
    const month = start.toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' });

    const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' };
    const startTimePart = start.toLocaleTimeString('en-GB', timeOptions);
    const endTimePart = end.toLocaleTimeString('en-GB', timeOptions);

    return `${weekday} ${day} of ${month} at ${startTimePart} to ${endTimePart}`;
  }
}
