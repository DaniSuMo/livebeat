class Users::RegistrationsController < Devise::RegistrationsController
  before_action :configure_sign_up_params, only: [:create]
  before_action :configure_account_update_params, only: [:update]
  after_action :create_venue_for_venue_user, only: [:create]

  protected

  def configure_sign_up_params
    devise_parameter_sanitizer.permit(:sign_up, keys: [
      :first_name,
      :last_name,
      :user_type,
      :phone_number,
      :address,
      :date_of_birth,
      :venue_name
    ])
  end

  def configure_account_update_params
    devise_parameter_sanitizer.permit(:account_update, keys: [
      :first_name,
      :last_name,
      :user_type,
      :phone_number,
      :address,
      :date_of_birth,
      :venue_name
    ])
  end

  private

  def create_venue_for_venue_user
    if resource.persisted? && resource.venue? && resource.venue_name.present?
      # Create the venue for the user
      venue = resource.build_venue(name: resource.venue_name)
      if venue.save
        Rails.logger.info "Created venue '#{venue.name}' for user #{resource.email}"
      else
        Rails.logger.error "Failed to create venue for user #{resource.email}: #{venue.errors.full_messages}"
      end
    end
  end
end
