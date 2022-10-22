Rails.application.routes.draw do
  get 'games/index'
  devise_for :users
  root to: "pages#home"
  resources :games, only: [:index, :create, :update] do
    resources :armies, only: [:create]
  end

  resources :armies do
    resources :soldiers, only: [:update]
  end
end
