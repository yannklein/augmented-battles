class Soldier < ApplicationRecord
  belongs_to :army
  CATEGORIES = [
    :m1,
    :m2,
    :m3
  ]
  enum :category, CATEGORIES
  validates :name, :category, :skirmish_power, :distance_power, :max_distance, :speed, presence: true
end