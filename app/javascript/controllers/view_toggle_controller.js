import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["listView", "mapView", "listViewBtn", "mapViewBtn"]

  connect() {
    // Controller connected
  }

  showListView() {
    this.listViewTarget.classList.remove('hidden');
    this.mapViewTarget.classList.add('hidden');
    this.listViewBtnTarget.classList.add('bg-white', 'shadow-sm', 'text-gray-900');
    this.listViewBtnTarget.classList.remove('text-gray-600');
    this.mapViewBtnTarget.classList.remove('bg-white', 'shadow-sm', 'text-gray-900');
    this.mapViewBtnTarget.classList.add('text-gray-600');
  }

  showMapView() {
    this.listViewTarget.classList.add('hidden');
    this.mapViewTarget.classList.remove('hidden');
    this.mapViewBtnTarget.classList.add('bg-white', 'shadow-sm', 'text-gray-900');
    this.mapViewBtnTarget.classList.remove('text-gray-600');
    this.listViewBtnTarget.classList.remove('bg-white', 'shadow-sm', 'text-gray-900');
    this.listViewBtnTarget.classList.add('text-gray-600');

    // Trigger map resize after a short delay to ensure the container is visible
    setTimeout(() => {
      // Dispatch a custom event to trigger map resize
      const resizeEvent = new CustomEvent('mapResize');
      document.dispatchEvent(resizeEvent);

      // Also trigger map initialization for any map controllers that haven't initialized yet
      const mapControllers = document.querySelectorAll('[data-controller*="map"]');
      mapControllers.forEach(element => {
        // Trigger a custom event on the element to signal it should initialize
        const initEvent = new CustomEvent('mapInit');
        element.dispatchEvent(initEvent);
      });
    }, 100);
  }
}
