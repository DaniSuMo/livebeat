import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  connect() {
    // Listen for visibility changes
    this.visibilityHandler = () => this.handleVisibilityChange();
    document.addEventListener('visibilitychange', this.visibilityHandler);

    // Check if this is a back/forward navigation
    if (window.performance && window.performance.navigation.type === window.performance.navigation.TYPE_BACK_FORWARD) {
      window.location.reload();
    }
  }

  disconnect() {
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
    }
  }

  handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
      // Check if this is a back/forward navigation
      if (window.performance && window.performance.navigation.type === window.performance.navigation.TYPE_BACK_FORWARD) {
        window.location.reload();
      }
    }
  }
}
