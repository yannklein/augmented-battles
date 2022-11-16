class Game < ApplicationRecord
  belongs_to :user
  belongs_to :winner, class_name: "User", optional: true
  belongs_to :turn, class_name: "User"
  has_many :armies, dependent: :destroy
  has_many :players, through: :armies, source: :user
end
