ALTER TABLE categories
  DROP FOREIGN KEY categories_ibfk_1,
  DROP INDEX user_category,
  ADD UNIQUE KEY user_category (user_id, transaction_type_id, category_name),
  ADD CONSTRAINT categories_ibfk_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;