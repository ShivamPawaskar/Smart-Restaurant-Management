INSERT INTO menu_items (name, description, category, price, image_url)
VALUES
  ('Paneer Tikka', 'Smoky cottage cheese cubes with mint chutney', 'Starters', 289.00, '/menu/paneer-tikka.jpg'),
  ('Hara Bhara Kebab', 'Crispy spinach and peas patties', 'Starters', 229.00, '/menu/hara-bhara-kebab.jpg'),
  ('Dahi Ke Kebab', 'Creamy hung-curd kebabs with spices', 'Starters', 249.00, '/menu/dahi-ke-kebab.jpg'),
  ('Chicken Malai Tikka', 'Creamy grilled chicken chunks', 'Starters', 329.00, '/menu/chicken-malai-tikka.jpg'),
  ('Tandoori Chicken', 'Classic red tandoori half chicken', 'Starters', 379.00, '/menu/tandoori-chicken.jpg'),
  ('Chilli Paneer', 'Indo-Chinese paneer in spicy sauce', 'Starters', 279.00, '/menu/chilli-paneer.jpg'),
  ('Veg Manchurian', 'Fried veg balls in tangy sauce', 'Starters', 249.00, '/menu/veg-manchurian.jpg'),
  ('Butter Chicken', 'Rich tomato-butter chicken curry', 'North Indian', 399.00, '/menu/butter-chicken.jpg'),
  ('Chicken Tikka Masala', 'Spiced tikka in creamy masala gravy', 'North Indian', 389.00, '/menu/chicken-tikka-masala.jpg'),
  ('Kadhai Paneer', 'Paneer with capsicum in kadhai masala', 'North Indian', 339.00, '/menu/kadhai-paneer.jpg'),
  ('Shahi Paneer', 'Velvety cashew-onion tomato gravy', 'North Indian', 349.00, '/menu/shahi-paneer.jpg'),
  ('Dal Makhani', 'Slow-cooked black lentils and cream', 'North Indian', 299.00, '/menu/dal-makhani.jpg'),
  ('Chole Masala', 'Punjabi chickpeas in robust gravy', 'North Indian', 269.00, '/menu/chole-masala.jpg'),
  ('Palak Paneer', 'Paneer cubes in spinach puree', 'North Indian', 329.00, '/menu/palak-paneer.jpg'),
  ('Aloo Gobi', 'Potato-cauliflower stir curry', 'North Indian', 249.00, '/menu/aloo-gobi.jpg'),
  ('Hyderabadi Chicken Biryani', 'Aromatic dum biryani with chicken', 'Biryani & Rice', 379.00, '/menu/hyderabadi-chicken-biryani.jpg'),
  ('Hyderabadi Veg Biryani', 'Fragrant dum biryani with vegetables', 'Biryani & Rice', 319.00, '/menu/hyderabadi-veg-biryani.jpg'),
  ('Mutton Biryani', 'Spiced basmati with tender mutton', 'Biryani & Rice', 459.00, '/menu/mutton-biryani.jpg'),
  ('Jeera Rice', 'Steamed basmati with cumin tempering', 'Biryani & Rice', 179.00, '/menu/jeera-rice.jpg'),
  ('Peas Pulao', 'Mildly spiced rice with green peas', 'Biryani & Rice', 199.00, '/menu/peas-pulao.jpg'),
  ('Plain Naan', 'Soft tandoor-baked flatbread', 'Breads', 59.00, '/menu/plain-naan.jpg'),
  ('Butter Naan', 'Naan brushed with melted butter', 'Breads', 69.00, '/menu/butter-naan.jpg'),
  ('Garlic Naan', 'Naan topped with garlic and coriander', 'Breads', 79.00, '/menu/garlic-naan.jpg'),
  ('Tandoori Roti', 'Whole wheat tandoor roti', 'Breads', 39.00, '/menu/tandoori-roti.jpg'),
  ('Laccha Paratha', 'Layered flaky whole wheat bread', 'Breads', 79.00, '/menu/laccha-paratha.jpg'),
  ('Masala Chaas', 'Spiced buttermilk cooler', 'Beverages', 79.00, '/menu/masala-chaas.jpg'),
  ('Sweet Lassi', 'Traditional Punjabi sweet yogurt drink', 'Beverages', 109.00, '/menu/sweet-lassi.jpg'),
  ('Masala Lemon Soda', 'Sparkling lemon soda with masala', 'Beverages', 99.00, '/menu/masala-lemon-soda.jpg'),
  ('Veg Grill Sandwich', 'Toasted sandwich with veggies, cheese, and green chutney', 'Snacks', 169.00, '/menu/veg-grill-sandwich.jpg'),
  ('Gulab Jamun', 'Warm khoya dumplings in sugar syrup', 'Desserts', 129.00, '/menu/gulab-jamun.jpg'),
  ('Rasmalai', 'Soft paneer patties in saffron milk', 'Desserts', 149.00, '/menu/rasmalai.jpg'),
  ('Gajar Halwa', 'Slow-cooked carrot pudding with nuts', 'Desserts', 139.00, '/menu/gajar-halwa.jpg'),
  ('Jalebi', 'Crispy spiral-shaped sweets soaked in saffron-infused sugar syrup', 'Desserts', 99.00, '/menu/jalebi.jpg'),
  ('Rasgulla', 'Spongy cottage cheese balls soaked in light sugar syrup', 'Desserts', 129.00, '/menu/rasgulla.jpg'),
  ('Kheer', 'Traditional rice pudding cooked with milk, sugar, and dry fruits', 'Desserts', 109.00, '/menu/kheer.jpg')


ON CONFLICT(name) DO UPDATE SET
  description = excluded.description,
  category = excluded.category,
  price = excluded.price,
  image_url = excluded.image_url;

UPDATE menu_items
SET price = CASE name
  WHEN 'Veg Burger' THEN 189.00
  WHEN 'Pasta Alfredo' THEN 279.00
  WHEN 'Caesar Salad' THEN 219.00
  WHEN 'Chocolate Brownie' THEN 179.00
  WHEN 'Mutton Biryani' THEN 429.00
  ELSE price
END
WHERE name IN ('Veg Burger', 'Pasta Alfredo', 'Caesar Salad', 'Chocolate Brownie', 'Mutton Biryani');
