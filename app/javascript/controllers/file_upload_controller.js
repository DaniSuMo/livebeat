import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["input", "preview", "error"]

  connect() {
    this.updatePreview()
  }

  updatePreview() {
    const files = this.inputTarget.files
    this.previewTarget.innerHTML = ""
    this.errorTarget.textContent = ""

    if (files.length < 2) {
      this.errorTarget.textContent = "Please select at least 2 photos"
      return
    }

    if (files.length > 6) {
      this.errorTarget.textContent = "Please select no more than 6 photos"
      return
    }

    Array.from(files).forEach((file, index) => {
      if (!file.type.startsWith('image/')) {
        this.errorTarget.textContent = "Please select only image files"
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        this.errorTarget.textContent = "Each file must be less than 5MB"
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const preview = document.createElement('div')
        preview.className = 'inline-block mr-2 mb-2'
        preview.innerHTML = `
          <img src="${e.target.result}" class="w-16 h-16 object-cover rounded border" alt="Preview ${index + 1}">
        `
        this.previewTarget.appendChild(preview)
      }
      reader.readAsDataURL(file)
    })
  }
}
