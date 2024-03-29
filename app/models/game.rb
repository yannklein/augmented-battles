class Game < ApplicationRecord
  belongs_to :user
  belongs_to :turn, class_name: "User"
  has_many :armies, dependent: :destroy
  has_many :players, through: :armies, source: :user

  def finished?
    armies.any? { |army| army.isDecimated } 
  end
  def winner
    armies.find { |army| !army.isDecimated } if finished?
  end

  def loser
    armies.find { |army| !army.isDecimated } if finished?
  end
end
