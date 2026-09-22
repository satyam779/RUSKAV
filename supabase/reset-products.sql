-- Empty the catalogue, so it can be rebuilt from the admin dashboard.
--
-- DESTRUCTIVE. This deletes every product row. Run it only when you mean to
-- start the catalogue from scratch — it is kept out of `schema.sql` precisely
-- so that re-running the schema can never do this by accident.
--
-- What it does NOT touch:
--   * orders and order_items — a past order copies its own prices and names in,
--     so it still reads correctly after the products behind it are gone
--   * enquiries — `product_codes` is a text array, not a foreign key
--   * categories, customers, trade bands, admins, settings
--
-- Uploaded images are left in the `product-images` bucket. Clear those from
-- Dashboard → Storage → product-images if you want the space back.

begin;

-- Read this first. If the count is not what you expect, roll back instead of
-- committing.
select count(*) as products_about_to_be_deleted from public.products;

delete from public.products;

commit;

-- Ranges are kept, because the dashboard's "Range" picker reads from them and
-- an empty list makes every new product unassigned. To clear those too:
--
--   delete from public.categories;
--
-- Re-seed the 2023 print catalogue instead of starting empty:
--
--   \i seed-catalogue.sql      -- or paste that file into the SQL editor
