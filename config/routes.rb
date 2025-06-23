Rails.application.routes.draw do
  get "venues/index"
  get "venues/new"
  get "venues/create"
  get "venues/show"
  get "venues/edit"
  get "venues/update"
  get "venues/destroy"
  get "scheduled_events/index"
  get "scheduled_events/new"
  get "scheduled_events/create"
  get "scheduled_events/show"
  get "scheduled_events/edit"
  get "scheduled_events/update"
  get "scheduled_events/destroy"
  devise_for :users, controllers: {
    registrations: 'users/registrations'
  }
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Render dynamic PWA files from app/views/pwa/* (remember to link manifest in application.html.erb)
  # get "manifest" => "rails/pwa#manifest", as: :pwa_manifest
  # get "service-worker" => "rails/pwa#service_worker", as: :pwa_service_worker

  # API routes
  namespace :api do
    get 'nearby_places', to: 'nearby_places#index'
    get 'location_search', to: 'location_search#index'
  end

  # Defines the root path route ("/")
  # root "posts#index"
  root "pages#welcome"
  get "about", to: "pages#about", as: :pages_about
  get "contact", to: "pages#contact", as: :pages_contact
  get "welcome", to: "pages#welcome", as: :pages_welcome

  resources :scheduled_events
  resources :venues
end
