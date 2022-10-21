class Game < ApplicationRecord
  belongs_to :user
  belongs_to :winner
  belongs_to :turn
end
