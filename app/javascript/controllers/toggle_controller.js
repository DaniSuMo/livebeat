import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["slider", "userLabel", "venueLabel", "userIcon", "venueIcon"]

  connect() {
    this.updateSlider()
    this.toggleVenueNameField()
  }

  toggleUser() {
    this.updateSelection('user')
  }

  toggleVenue() {
    this.updateSelection('venue')
  }

  updateSelection(userType) {
    // Find the hidden field and update its value
    const hiddenField = this.element.querySelector('input[type="hidden"][name*="user_type"]')
    if (hiddenField) {
      hiddenField.value = userType
    }

    this.updateSlider(userType)
    this.updateLabels(userType)
    this.toggleVenueNameField()
  }

  updateSlider(userType = null) {
    // If no userType provided, try to get it from the hidden field
    if (!userType) {
      const hiddenField = this.element.querySelector('input[type="hidden"][name*="user_type"]')
      userType = hiddenField ? hiddenField.value : 'user'
    }

    const slider = this.sliderTarget
    const isUser = userType === 'user'

    if (isUser) {
      slider.style.transform = 'translateX(0)'
      slider.style.width = 'calc(50% - 2px)'
    } else {
      slider.style.transform = 'translateX(100%)'
      slider.style.width = 'calc(50% - 2px)'
    }
  }

  updateLabels(userType = null) {
    // If no userType provided, try to get it from the hidden field
    if (!userType) {
      const hiddenField = this.element.querySelector('input[type="hidden"][name*="user_type"]')
      userType = hiddenField ? hiddenField.value : 'user'
    }

    const isUser = userType === 'user'

    if (this.hasUserLabelTarget && this.hasVenueLabelTarget) {
      if (isUser) {
        this.userLabelTarget.classList.add('text-purple-700', 'font-semibold')
        this.userLabelTarget.classList.remove('text-white/80')
        this.venueLabelTarget.classList.remove('text-purple-700', 'font-semibold')
        this.venueLabelTarget.classList.add('text-white/80')
      } else {
        this.venueLabelTarget.classList.add('text-purple-700', 'font-semibold')
        this.venueLabelTarget.classList.remove('text-white/80')
        this.userLabelTarget.classList.remove('text-purple-700', 'font-semibold')
        this.userLabelTarget.classList.add('text-white/80')
      }
    }

    if (this.hasUserIconTarget && this.hasVenueIconTarget) {
      if (isUser) {
        this.userIconTarget.classList.add('text-purple-700')
        this.userIconTarget.classList.remove('text-white/80')
        this.venueIconTarget.classList.remove('text-purple-700')
        this.venueIconTarget.classList.add('text-white/80')
      } else {
        this.venueIconTarget.classList.add('text-purple-700')
        this.venueIconTarget.classList.remove('text-white/80')
        this.userIconTarget.classList.remove('text-purple-700')
        this.userIconTarget.classList.add('text-white/80')
      }
    }
  }

  toggleVenueNameField() {
    const hiddenField = this.element.querySelector('input[type="hidden"][name*="user_type"]')
    const venueNameField = document.getElementById('venue-name-field')
    const venueNameInput = document.querySelector('input[name*="venue_name"]')

    if (!hiddenField || !venueNameField || !venueNameInput) return

    if (hiddenField.value === 'venue') {
      venueNameField.style.display = 'block'
      venueNameInput.setAttribute('required', 'required')
    } else {
      venueNameField.style.display = 'none'
      venueNameInput.removeAttribute('required')
      venueNameInput.value = ''
    }
  }
}
