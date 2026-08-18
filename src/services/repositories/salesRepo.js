import { getDb } from "../database";

export function getAll() {
  const db = getDb();
  const sales = db.getAllSync("SELECT * FROM sales ORDER BY timestamp DESC");

  return sales.map((sale) => {
    const items = db.getAllSync(
      "SELECT * FROM sale_items WHERE sale_id = ? OR sale_local_id = ?",
      [sale.id, sale.local_id]
    );
    return {
      ...sale,
      items: items.map((si) => ({
        itemId: si.item_id,
        name: si.name,
        quantity: si.quantity,
        unitPrice: si.unit_price,
        originalPrice: si.original_price,
      })),
    };
  });
}

export function insert(sale) {
  const db = getDb();
  db.runSync(
    `INSERT OR REPLACE INTO sales
      (id, local_id, subtotal, discount_type, discount_value, discount_amount, total, payment_method, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      sale.id || null,
      sale.local_id || null,
      sale.subtotal,
      sale.discountType ?? sale.discount_type ?? null,
      sale.discountValue ?? sale.discount_value ?? null,
      sale.discountAmount ?? sale.discount_amount ?? null,
      sale.total,
      sale.paymentMethod ?? sale.payment_method,
      sale.timestamp,
    ]
  );

  const saleItems = sale.items || [];
  for (const item of saleItems) {
    db.runSync(
      `INSERT INTO sale_items
        (sale_id, sale_local_id, item_id, name, quantity, unit_price, original_price)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        sale.id || null,
        sale.local_id || null,
        item.itemId ?? item.item_id,
        item.name,
        item.quantity,
        item.unitPrice ?? item.unit_price,
        item.originalPrice ?? item.original_price,
      ]
    );
  }
}

