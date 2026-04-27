Rails.application.routes.draw do
  # JSON API (consumed by the React SPA in client/)
  namespace :api do
    resources :block_events, only: [:create]
    resources :players,      only: [:index, :show]
    resources :alerts,       only: [:index, :show, :update]
    get "stats",     to: "stats#show"
    get "bootstrap", to: "stats#bootstrap"
  end

  mount ActionCable.server => "/cable"

  # Existing ERB pages still work as a fallback while the SPA is being built
  root "dashboard#index"
  get "/dashboard", to: "dashboard#index"
  resources :alerts,  only: [:index, :show, :update]
  resources :players, only: [:index, :show]

  # SPA fallback (production): catch any non-API path and serve the built index.html
  get "/app", to: "spa#index"
  get "/app/*path", to: "spa#index"
end
