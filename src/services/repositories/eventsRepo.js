import { getDb } from "../database";

export function getAll() {
  const db = getDb();
  const events = db.getAllSync("SELECT * FROM events ORDER BY date DESC");

  return events.map((event) => {
    const expenses = db.getAllSync(
      "SELECT * FROM event_expenses WHERE event_id = ? OR event_local_id = ?",
      [event.id, event.local_id]
    );
    return {
      id: event.id,
      localId: event.local_id,
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
        localId: exp.local_id,
        category: exp.category,
        amount: exp.amount,
        createdAt: exp.created_at,
      })),
    };
  });
}

export function upsert(event) {
  const db = getDb();
  db.runSync(
    `INSERT OR REPLACE INTO events
      (id, local_id, name, date, end_date, location, status, currency, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      event.id || null,
      event.local_id ?? event.localId ?? null,
      event.name,
      event.date,
      event.end_date ?? event.endDate,
      event.location || null,
      event.status,
      event.currency || "MYR",
      event.notes || null,
      event.created_at ?? event.createdAt ?? new Date().toISOString(),
    ]
  );
}

export function upsertWithExpenses(event) {
  const db = getDb();
  upsert(event);

  // Clear and re-insert expenses
  if (event.id) {
    db.runSync("DELETE FROM event_expenses WHERE event_id = ?", [event.id]);
  }
  if (event.local_id || event.localId) {
    db.runSync("DELETE FROM event_expenses WHERE event_local_id = ?", [event.local_id || event.localId]);
  }

  const expenses = event.expenses || [];
  for (const exp of expenses) {
    db.runSync(
      `INSERT INTO event_expenses
        (id, local_id, event_id, event_local_id, category, amount, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        exp.id || null,
        exp.local_id ?? exp.localId ?? null,
        event.id || null,
        event.local_id ?? event.localId ?? null,
        exp.category,
        exp.amount,
        exp.created_at ?? exp.createdAt ?? new Date().toISOString(),
      ]
    );
  }
}

export function insertExpense(expense, eventId, eventLocalId) {
  const db = getDb();
  db.runSync(
    `INSERT INTO event_expenses
      (id, local_id, event_id, event_local_id, category, amount, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      expense.id || null,
      expense.local_id ?? expense.localId ?? null,
      eventId || null,
      eventLocalId || null,
      expense.category,
      expense.amount,
      expense.created_at ?? expense.createdAt ?? new Date().toISOString(),
    ]
  );
}

export function deleteExpense(expenseId) {
  const db = getDb();
  db.runSync("DELETE FROM event_expenses WHERE id = ?", [expenseId]);
}

export function deleteEvent(eventId) {
  const db = getDb();
  db.runSync("DELETE FROM event_expenses WHERE event_id = ?", [eventId]);
  db.runSync("DELETE FROM events WHERE id = ?", [eventId]);
}

export function deleteByLocalId(localId) {
  const db = getDb();
  db.runSync("DELETE FROM event_expenses WHERE event_local_id = ?", [localId]);
  db.runSync("DELETE FROM events WHERE local_id = ?", [localId]);
}
