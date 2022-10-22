class Army < ApplicationRecord
  belongs_to :game
  belongs_to :user
  has_many :soldiers, dependent: :destroy
end
