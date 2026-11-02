import { supabase } from '@/lib/supabase';
import type { PaymentMethod, Sale, SaleWithDetails } from '@/types/models';

export const SALES_PAGE_SIZE = 30;

/** One page of a business's sales, newest first, optionally since `from`. */
export async function fetchSales({
  businessId,
  from,
  page,
}: {
  businessId: string;
  from: string | null;
  page: number;
}): Promise<Sale[]> {
  const start = page * SALES_PAGE_SIZE;
  let query = supabase
    .from('sales')
    .select('*')
    .eq('business_id', businessId)
    .order('sold_at', { ascending: false })
    .order('id')
    .range(start, start + SALES_PAGE_SIZE - 1);
  if (from) query = query.gte('sold_at', from);

  const { data, error } = await query;
  if (error) throw error;
  return data as Sale[];
}

export async function fetchSale(id: string): Promise<SaleWithDetails> {
  const { data, error } = await supabase
    .from('sales')
    .select('*, sale_items(*), sale_payments(*)')
    .eq('id', id)
    .order('created_at', { referencedTable: 'sale_items' })
    .order('paid_at', { referencedTable: 'sale_payments' })
    .single();
  if (error) throw error;
  return data as SaleWithDetails;
}

export type NewSale = {
  businessId: string;
  /** Created once per cart; a retry with the same id returns the same sale. */
  clientRequestId: string;
  items: { productId: string; quantity: number }[];
  discount: number;
  /** `null` = paid in full. */
  amountPaid: number | null;
  method: PaymentMethod;
  customerName: string | null;
  note: string | null;
};

/** Saves the whole sale in one transaction: lines, stock, payment and sale number. */
export async function createSale(sale: NewSale): Promise<Sale> {
  const { data, error } = await supabase.rpc('create_sale', {
    p_business_id: sale.businessId,
    p_client_request_id: sale.clientRequestId,
    p_items: sale.items.map((item) => ({ product_id: item.productId, quantity: item.quantity })),
    p_discount: sale.discount,
    p_amount_paid: sale.amountPaid,
    p_payment_method: sale.method,
    p_customer_name: sale.customerName,
    p_note: sale.note,
  });
  if (error) throw error;
  return data as Sale;
}

export async function addSalePayment({
  saleId,
  amount,
  method,
}: {
  saleId: string;
  amount: number;
  method: PaymentMethod;
}): Promise<Sale> {
  const { data, error } = await supabase.rpc('add_sale_payment', {
    p_sale_id: saleId,
    p_amount: amount,
    p_method: method,
  });
  if (error) throw error;
  return data as Sale;
}

/** Restores stock, refunds payments and marks the sale cancelled; nothing is deleted. */
export async function cancelSale({
  saleId,
  reason,
}: {
  saleId: string;
  reason: string | null;
}): Promise<Sale> {
  const { data, error } = await supabase.rpc('cancel_sale', {
    p_sale_id: saleId,
    p_reason: reason,
  });
  if (error) throw error;
  return data as Sale;
}
