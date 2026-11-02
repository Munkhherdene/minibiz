import type { PostgrestError } from '@supabase/supabase-js';

import type { ProductInput } from '@/features/products/schemas';
import { removeImage, uploadImage, type LocalImage } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import type { InventoryTransaction, Product } from '@/types/models';

export const PRODUCTS_PAGE_SIZE = 30;

/** Turns unique-index violations into codes that getErrorMessage() maps. */
function productError(error: PostgrestError) {
  if (error.code === '23505') {
    if (error.message.includes('products_business_sku_key')) {
      return { ...error, message: 'DUPLICATE_SKU' };
    }
    if (error.message.includes('products_business_barcode_key')) {
      return { ...error, message: 'DUPLICATE_BARCODE' };
    }
  }
  return error;
}

/** Characters that would break PostgREST's `or` filter or act as wildcards. */
function searchTerm(search: string) {
  return search.replace(/[%_,()"\\*]/g, ' ').trim();
}

/** One page of a business's active or archived products, by name. */
export async function fetchProducts({
  businessId,
  search,
  archived,
  page,
}: {
  businessId: string;
  search: string;
  archived: boolean;
  page: number;
}): Promise<Product[]> {
  const from = page * PRODUCTS_PAGE_SIZE;
  let query = supabase
    .from('products')
    .select('*')
    .eq('business_id', businessId)
    .eq('is_active', !archived)
    .order('name')
    .order('id')
    .range(from, from + PRODUCTS_PAGE_SIZE - 1);

  const term = searchTerm(search);
  if (term) {
    query = query.or(
      `name.ilike."%${term}%",sku.ilike."%${term}%",barcode.ilike."%${term}%"`,
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Product[];
}

export async function fetchProduct(id: string): Promise<Product> {
  const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
  if (error) throw error;
  return data as Product;
}

/** Latest stock movements of a product, newest first. */
export async function fetchProductMovements(product: Product): Promise<InventoryTransaction[]> {
  const { data, error } = await supabase
    .from('inventory_transactions')
    .select('*')
    .eq('business_id', product.business_id)
    .eq('product_id', product.id)
    .order('occurred_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return data as InventoryTransaction[];
}

/** Creates the product and its opening-stock movement in one transaction. */
export async function createProduct({
  businessId,
  input,
}: {
  businessId: string;
  input: ProductInput;
}): Promise<Product> {
  const { data, error } = await supabase.rpc('create_product', {
    p_business_id: businessId,
    p_name: input.name,
    p_selling_price: input.sellingPrice,
    p_cost_price: input.costPrice ?? 0,
    p_unit: input.unit,
    p_opening_stock: input.openingStock ?? 0,
    p_sku: input.sku,
    p_barcode: input.barcode,
    p_low_stock_threshold: input.lowStockThreshold,
  });
  if (error) throw productError(error);
  return data as Product;
}

type EditableProductFields = Pick<
  Product,
  | 'name'
  | 'sku'
  | 'barcode'
  | 'unit'
  | 'image_path'
  | 'cost_price'
  | 'selling_price'
  | 'low_stock_threshold'
  | 'is_active'
>;

/** Stock and average cost are not editable here; they change only through movements. */
export async function updateProduct({
  id,
  changes,
}: {
  id: string;
  changes: Partial<EditableProductFields>;
}): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .update(changes)
    .eq('id', id)
    .select()
    .single();
  if (error) throw productError(error);
  return data as Product;
}

export function productChanges(input: ProductInput): Partial<EditableProductFields> {
  return {
    name: input.name,
    sku: input.sku,
    barcode: input.barcode,
    unit: input.unit,
    cost_price: input.costPrice ?? 0,
    selling_price: input.sellingPrice,
    low_stock_threshold: input.lowStockThreshold,
  };
}

/** Uploads a new photo, points the product at it, then removes the previous file. */
export async function uploadProductImage({
  product,
  image,
}: {
  product: Product;
  image: LocalImage;
}): Promise<Product> {
  const path = await uploadImage(`${product.business_id}/products`, image);
  const updated = await updateProduct({ id: product.id, changes: { image_path: path } });
  if (product.image_path) await removeImage(product.image_path);
  return updated;
}

export async function removeProductImage(product: Product): Promise<Product> {
  const updated = await updateProduct({ id: product.id, changes: { image_path: null } });
  if (product.image_path) await removeImage(product.image_path);
  return updated;
}
