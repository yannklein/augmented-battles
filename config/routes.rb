Rails.application.routes.draw do
  get 'games/index'
  devise_for :users
  root to: "pages#home"
  get 'games/:id/live', to: 'games#live', as: 'game_live'
  resources :games, only: [:index, :show, :create, :update] do
    resources :armies, only: [:create]
  end

  resources :armies do
    resources :soldiers, only: [:update]
  end
end
