class AddManaToSoldiers < ActiveRecord::Migration[7.0]
  def change
    add_column :soldiers, :mana, :integer
  end
end
