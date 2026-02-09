INSERT INTO menu_items (name, description, category, price, image_url)
VALUES
  ('Paneer Tikka', 'Smoky cottage cheese cubes with mint chutney', 'Starters', 289.00, 'https://source.unsplash.com/800x600/?paneer,tikka'),
  ('Hara Bhara Kebab', 'Crispy spinach and peas patties', 'Starters', 229.00, 'https://source.unsplash.com/800x600/?kebab,indian'),
  ('Dahi Ke Kebab', 'Creamy hung-curd kebabs with spices', 'Starters', 249.00, 'https://source.unsplash.com/800x600/?kebab,vegetarian'),
  ('Chicken Malai Tikka', 'Creamy grilled chicken chunks', 'Starters', 329.00, 'https://source.unsplash.com/800x600/?chicken,tikka'),
  ('Tandoori Chicken', 'Classic red tandoori half chicken', 'Starters', 379.00, 'https://source.unsplash.com/800x600/?tandoori,chicken'),
  ('Chilli Paneer', 'Indo-Chinese paneer in spicy sauce', 'Starters', 279.00, 'https://source.unsplash.com/800x600/?chilli,paneer'),
  ('Veg Manchurian', 'Fried veg balls in tangy sauce', 'Starters', 249.00, 'https://source.unsplash.com/800x600/?manchurian'),
  ('Butter Chicken', 'Rich tomato-butter chicken curry', 'North Indian', 399.00, 'https://source.unsplash.com/800x600/?butter,chicken,curry'),
  ('Chicken Tikka Masala', 'Spiced tikka in creamy masala gravy', 'North Indian', 389.00, 'https://source.unsplash.com/800x600/?chicken,tikka,masala'),
  ('Kadhai Paneer', 'Paneer with capsicum in kadhai masala', 'North Indian', 339.00, 'https://source.unsplash.com/800x600/?kadhai,paneer'),
  ('Shahi Paneer', 'Velvety cashew-onion tomato gravy', 'North Indian', 349.00, 'https://source.unsplash.com/800x600/?shahi,paneer'),
  ('Dal Makhani', 'Slow-cooked black lentils and cream', 'North Indian', 299.00, 'https://source.unsplash.com/800x600/?dal,makhani'),
  ('Chole Masala', 'Punjabi chickpeas in robust gravy', 'North Indian', 269.00, 'https://source.unsplash.com/800x600/?chole,masala'),
  ('Palak Paneer', 'Paneer cubes in spinach puree', 'North Indian', 329.00, 'https://source.unsplash.com/800x600/?palak,paneer'),
  ('Aloo Gobi', 'Potato-cauliflower stir curry', 'North Indian', 249.00, 'https://source.unsplash.com/800x600/?aloo,gobi'),
  ('Hyderabadi Chicken Biryani', 'Aromatic dum biryani with chicken', 'Biryani & Rice', 379.00, 'https://source.unsplash.com/800x600/?chicken,biryani'),
  ('Hyderabadi Veg Biryani', 'Fragrant dum biryani with vegetables', 'Biryani & Rice', 319.00, 'https://source.unsplash.com/800x600/?veg,biryani'),
  ('Mutton Biryani', 'Spiced basmati with tender mutton', 'Biryani & Rice', 459.00, 'https://source.unsplash.com/800x600/?mutton,biryani'),
  ('Jeera Rice', 'Steamed basmati with cumin tempering', 'Biryani & Rice', 179.00, 'https://source.unsplash.com/800x600/?jeera,rice'),
  ('Peas Pulao', 'Mildly spiced rice with green peas', 'Biryani & Rice', 199.00, 'https://source.unsplash.com/800x600/?pulao,rice'),
  ('Plain Naan', 'Soft tandoor-baked flatbread', 'Breads', 59.00, 'https://source.unsplash.com/800x600/?naan'),
  ('Butter Naan', 'Naan brushed with melted butter', 'Breads', 69.00, 'https://source.unsplash.com/800x600/?butter,naan'),
  ('Garlic Naan', 'Naan topped with garlic and coriander', 'Breads', 79.00, 'https://source.unsplash.com/800x600/?garlic,naan'),
  ('Tandoori Roti', 'Whole wheat tandoor roti', 'Breads', 39.00, 'https://source.unsplash.com/800x600/?roti'),
  ('Laccha Paratha', 'Layered flaky whole wheat bread', 'Breads', 79.00, 'https://source.unsplash.com/800x600/?paratha'),
  ('Masala Chaas', 'Spiced buttermilk cooler', 'Beverages', 79.00, 'https://source.unsplash.com/800x600/?buttermilk'),
  ('Sweet Lassi', 'Traditional Punjabi sweet yogurt drink', 'Beverages', 109.00, 'https://source.unsplash.com/800x600/?lassi'),
  ('Masala Lemon Soda', 'Sparkling lemon soda with masala', 'Beverages', 99.00, 'https://source.unsplash.com/800x600/?lemon,soda'),
  ('Veg Grill Sandwich', 'Toasted sandwich with veggies, cheese, and green chutney', 'Snacks', 169.00, 'https://source.unsplash.com/800x600/?veg,grilled,sandwich'),
  ('Gulab Jamun', 'Warm khoya dumplings in sugar syrup', 'Desserts', 129.00, 'https://source.unsplash.com/800x600/?gulab,jamun'),
  ('Rasmalai', 'Soft paneer patties in saffron milk', 'Desserts', 149.00, 'https://source.unsplash.com/800x600/?rasmalai'),
  ('Gajar Halwa', 'Slow-cooked carrot pudding with nuts', 'Desserts', 139.00, 'https://source.unsplash.com/800x600/?gajar,halwa'),
  ('Jalebi', 'Crispy spiral-shaped sweets soaked in saffron-infused sugar syrup', 'Desserts', 99.00, 'https://source.unsplash.com/800x600/?jalebi'),
  ('Rasgulla', 'Spongy cottage cheese balls soaked in light sugar syrup', 'Desserts', 129.00, 'https://source.unsplash.com/800x600/?rasgulla'),
  ('Kheer', 'Traditional rice pudding cooked with milk, sugar, and dry fruits', 'Desserts', 109.00, 'https://source.unsplash.com/800x600/?kheer')


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
