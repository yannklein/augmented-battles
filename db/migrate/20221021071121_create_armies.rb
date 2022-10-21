class CreateArmies < ActiveRecord::Migration[7.0]
  def change
    create_table :armies do |t|
      t.integer :category
      t.references :game, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true

      t.timestamps
    end
  end
end
