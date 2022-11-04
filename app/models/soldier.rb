class Soldier < ApplicationRecord
  belongs_to :army
  CATEGORIES = [
    :alien,
    :ancestor,
    :black_hole,
    :eva,
    :gaia,
    :god_eye,
    :light_cone,
    :lilith,
    :nova,
    :ocean,
    :octopod,
    :omni_eye,
    :rising_sun,
    :shell,
    :triangle
  ]
  enum :category, CATEGORIES
  validates :name, :category, :skirmish_power, :distance_power, :max_distance, :speed, presence: true
end