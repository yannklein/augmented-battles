class CreateSoldiers < ActiveRecord::Migration[7.0]
  def change
    create_table :soldiers do |t|
      t.integer :type
      t.integer :skirmish_power
      t.integer :distance_power
      t.integer :max_distance
      t.integer :speed
      t.references :army, null: false, foreign_key: true

      t.timestamps
    end
  end
end
