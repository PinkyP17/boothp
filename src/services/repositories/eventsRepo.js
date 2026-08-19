import { getDb } from "../database";

export function getAll() {
  const db = getDb();
  const events = db.getAllSync("SELECT * FROM events ORDER BY date DESC");

  return events.map((event) => {
    const expenses = db.getAllSync(
      "SELECT * FROM event_expenses WHERE event_id = ?",
      [event.id]
    );
    return {
      id: event.id,
      name: event.name,
      date: event.date,
      endDate: event.end_date,
      location: event.location,
      status: event.status,
      currency: event.currency,
      notes: event.notes,
      createdAt: event.created_at,
      expenses: expenses.map((exp) => ({
        id: exp.id,
        category: exp.category,
        amount: exp.amount,
        createdAt: exp.created_at,
      })),
    };
  });
}

export function insert(event) {
  const db = getDb();
  const result = db.runSync(
    `INSERT INTO events
      (name, date, end_date, location, status, currency, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      event.name,
      event.date,
      event.end_date,
      event.location || null,
      event.status,
      event.currency || "MYR",
      event.notes || null,
      event.created_at,
    ]
  );
  return result.lastInsertRowId;
}

export function update(event) {
  const db = getDb();
  db.runSync(
    `UPDATE events
    SET name = ?, date = ?, end_date = ?, location = ?, status = ?, currency = ?, notes = ?
    WHERE id = ?`,
    [
      event.name,
      event.date,
      event.end_date,
      event.location || null,
      event.status,
      event.currency || "MYR",
      event.notes || null,
      event.id,
    ]
  );
}

export function insertExpense(expense, eventId) {
  const db = getDb();
  db.runSync(
    `INSERT INTO event_expenses (event_id, category, amount, created_at)
    VALUES (?, ?, ?, ?)`,
    [eventId, expense.category, expense.amount, expense.created_at]
  );
}

export function deleteExpense(expenseId) {
  const db = getDb();
  db.runSync("DELETE FROM event_expenses WHERE id = ?", [expenseId]);
}

export function deleteEvent(eventId) {
  const db = getDb();
  // event_expenses rows are removed automatically via ON DELETE CASCADE
  db.runSync("DELETE FROM events WHERE id = ?", [eventId]);
}
