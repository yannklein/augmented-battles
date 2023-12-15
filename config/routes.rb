Rails.application.routes.draw do
  get 'games/index'
  devise_for :users
  root to: "pages#home"
  get 'games/:id/join', to: 'games#join', as: 'game_join'
  get 'games/:id/live', to: 'games#live', as: 'game_live'
  get 'games/:id/next_turn', to: 'games#next_turn', as: 'next_turn' 
  resources :games, only: [:index, :show, :create, :update] do
    resources :armies, only: [:create]
  end

  # resources :armies do
  resources :soldiers, only: [:update]
  # end
end
