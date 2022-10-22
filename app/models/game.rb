class Game < ApplicationRecord
  belongs_to :user
  belongs_to :winner
  belongs_to :turn
  has_many :armies
  has_many :players, through: armies, source: :users
end
