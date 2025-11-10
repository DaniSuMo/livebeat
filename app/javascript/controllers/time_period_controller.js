import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["button", "container"]

  selectPeriod(event) {
    const period = event.currentTarget.dataset.period

    // Update button styles
    this.buttonTargets.forEach(button => {
      if (button.dataset.period === period) {
        button.classList.add('bg-white', 'shadow-sm', 'text-gray-900')
        button.classList.remove('text-gray-600')
      } else {
        button.classList.remove('bg-white', 'shadow-sm', 'text-gray-900')
        button.classList.add('text-gray-600')
      }
    })

    // Update URL with new time period parameter
    const url = new URL(window.location.href)
    url.searchParams.set('time_period', period)

    // Use Turbo to navigate to the new URL
    window.Turbo.visit(url.toString())
  }
}
