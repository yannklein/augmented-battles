class AddCategoryToSoldiers < ActiveRecord::Migration[7.0]
  def change
    add_column :soldiers, :category, :integer
  end
end
