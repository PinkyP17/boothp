import { createContext, useContext, useReducer, useMemo, useEffect, useRef, useCallback } from "react";
import { AppState as RNAppState } from "react-native";

import { API_BASE_URL } from "../config/api";
import { isOnline } from "../services/connectivityService";
import * as inventoryRepo from "../services/repositories/inventoryRepo";
import * as salesRepo from "../services/repositories/salesRepo";
import * as eventsRepo from "../services/repositories/eventsRepo";
import * as syncQueueRepo from "../services/repositories/syncQueueRepo";
import { syncAll } from "../services/syncEngine";
import { useConnectivity } from "./ConnectivityContext";

const AppContext = createContext();

function generateLocalId() {
  return `local_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

const initialState = {
  inventory: [],
  sales: [],
  events: [],
  dashboard: null,
  isLoading: false,
};

function appReducer(state, action) {
  switch (action.type) {
    case "SET_INVENTORY":
      return { ...state, inventory: action.payload };

    case "ADD_TO_INVENTORY":
      return { ...state, inventory: [action.payload, ...state.inventory] };

    case "UPDATE_INVENTORY_ITEM":
      return {
        ...state,
        inventory: state.inventory.map((item) =>
          item.id === action.payload.id ? action.payload : item,
        ),
      };

    case "RESTOCK_ITEM":
      return {
        ...state,
        inventory: state.inventory.map((item) =>
          item.id === action.payload.itemId
            ? { ...item, stock: item.stock + action.payload.quantity }
            : item,
        ),
      };

    case "SET_SALES":
      return { ...state, sales: action.payload };

    case "ADD_SALE": {
      const sale = action.payload;
      const updatedInventory = state.inventory.map((item) => {
        const soldItem = sale.items.find((s) => s.itemId === item.id);
        if (soldItem) {
          return { ...item, stock: Math.max(0, item.stock - soldItem.quantity) };
        }
        return item;
      });
      return {
        ...state,
        sales: [sale, ...state.sales],
        inventory: updatedInventory,
      };
    }

    case "SET_EVENTS":
      return { ...state, events: action.payload };

    case "ADD_EVENT":
      return { ...state, events: [...state.events, action.payload] };

    case "UPDATE_EVENT":
      return {
        ...state,
        events: state.events.map((e) =>
          e.id === action.payload.id ? action.payload : e,
        ),
      };

    case "ADD_EVENT_EXPENSE":
      return {
        ...state,
        events: state.events.map((e) =>
          e.id === action.payload.eventId
            ? { ...e, expenses: [...e.expenses, action.payload.expense] }
            : e,
        ),
      };

    case "DELETE_EVENT_EXPENSE":
      return {
        ...state,
        events: state.events.map((e) =>
          e.id === action.payload.eventId
            ? {
                ...e,
                expenses: e.expenses.filter(
                  (exp) => exp.id !== action.payload.expenseId,
                ),
              }
            : e,
        ),
      };

    case "SET_DASHBOARD":
      return { ...state, dashboard: action.payload };

    case "DELETE_INVENTORY_ITEM":
      return {
        ...state,
        inventory: state.inventory.filter((item) => item.id !== action.payload),
      };

    case "DELETE_EVENT":
      return {
        ...state,
        events: state.events.filter((e) => e.id !== action.payload),
      };

    case "SET_LOADING":
      return { ...state, isLoading: action.payload };

    default:
      return state;
  }
}

// Map SQLite row to frontend shape for inventory
function mapInventoryItem(row) {
  return {
    id: row.id,
    localId: row.local_id,
    name: row.name,
    category: row.category,
    productionCost: row.production_cost,
    sellingPrice: row.selling_price,
    stock: row.stock,
    imageUri: row.image_uri,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function computeLocalDashboard() {
  const sales = salesRepo.getAll();
  const events = eventsRepo.getAll();
  const today = new Date().toISOString().split("T")[0];

  const income = sales.reduce((sum, s) => sum + (s.total || 0), 0);

  let totalExpenses = 0;
  const upcomingEvents = [];

  for (const event of events) {
    const eventExpenses = (event.expenses || []).reduce((sum, exp) => sum + exp.amount, 0);
    totalExpenses += eventExpenses;

    if (event.date >= today) {
      upcomingEvents.push(event);
    }
  }

  // Build recent transactions from sales + event expenses
  const transactions = [];
  for (const sale of sales.slice(0, 10)) {
    const itemNames = (sale.items || []).map((i) => `${i.quantity}x ${i.name}`).join(", ");
    transactions.push({
      id: sale.id || sale.localId,
      type: "income",
      description: itemNames || "Sale",
      amount: sale.total,
      date: sale.timestamp,
      paymentMethod: sale.paymentMethod,
    });
  }
  for (const event of events) {
    for (const exp of event.expenses || []) {
      transactions.push({
        id: exp.id || exp.localId,
        type: "event_expense",
        description: exp.category,
        amount: exp.amount,
        date: exp.createdAt || event.createdAt,
        eventName: event.name,
      });
    }
  }

  transactions.sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  return {
    income,
    totalExpenses,
    netProfit: income - totalExpenses,
    upcomingEvents: upcomingEvents.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5),
    transactions: transactions.slice(0, 10),
  };
}

export function AppStateProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { registerSyncFunction, triggerSync } = useConnectivity();

  const inventoryActions = useMemo(
    () => ({
      loadInventory: async (token) => {
        dispatch({ type: "SET_LOADING", payload: true });
        // 1. Read from SQLite first (instant UI)
        try {
          const localItems = inventoryRepo.getAll().map(mapInventoryItem);
          if (localItems.length > 0) {
            dispatch({ type: "SET_INVENTORY", payload: localItems });
          }
        } catch (e) {
          console.warn("SQLite inventory read failed:", e.message);
        }

        // 2. If online, fetch from API + upsert into SQLite + re-dispatch
        try {
          const online = await isOnline();
          if (!online) {
            dispatch({ type: "SET_LOADING", payload: false });
            return;
          }

          const res = await fetch(`${API_BASE_URL}/api/v1/inventory`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (res.ok) {
            for (const item of data) {
              inventoryRepo.upsert({
                id: item.id,
                name: item.name,
                category: item.category,
                production_cost: item.productionCost,
                selling_price: item.sellingPrice,
                stock: item.stock,
                created_at: item.createdAt,
                updated_at: item.updatedAt,
              });
            }
            const hydrated = inventoryRepo.getAll().map(mapInventoryItem);
            dispatch({ type: "SET_INVENTORY", payload: hydrated });
          }
        } catch (error) {
          console.warn("API inventory fetch failed:", error.message);
        } finally {
          dispatch({ type: "SET_LOADING", payload: false });
        }
      },

      addInventoryItem: async (token, itemData) => {
        const { imageUri, ...apiData } = itemData;
        const localId = generateLocalId();
        const now = new Date().toISOString();

        // Write to SQLite
        const localItem = {
          local_id: localId,
          name: apiData.name,
          category: apiData.category,
          production_cost: apiData.productionCost,
          selling_price: apiData.sellingPrice,
          stock: apiData.stock,
          image_uri: imageUri || null,
          created_at: now,
          updated_at: now,
        };
        inventoryRepo.upsert(localItem);

        // Enqueue sync
        syncQueueRepo.enqueue("inventory_item", "CREATE", localId, null, apiData);

        // Dispatch to state
        const stateItem = {
          ...mapInventoryItem({ ...localItem, id: null }),
          localId,
        };
        dispatch({ type: "ADD_TO_INVENTORY", payload: stateItem });

        // Try immediate sync if online
        try {
          const online = await isOnline();
          if (online) {
            const res = await fetch(`${API_BASE_URL}/api/v1/inventory`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(apiData),
            });
            const data = await res.json();
            if (res.ok) {
              inventoryRepo.updateServerId(localId, data.id);
              inventoryRepo.upsert({
                id: data.id,
                local_id: localId,
                name: data.name,
                category: data.category,
                production_cost: data.productionCost,
                selling_price: data.sellingPrice,
                stock: data.stock,
                image_uri: imageUri || null,
                created_at: data.createdAt,
                updated_at: data.updatedAt,
              });
              // Clear the sync queue entry
              const pending = syncQueueRepo.getPending();
              const entry = pending.find((e) => e.entity_local_id === localId);
              if (entry) syncQueueRepo.markCompleted(entry.id);

              dispatch({
                type: "UPDATE_INVENTORY_ITEM",
                payload: { ...data, imageUri: imageUri || null, localId },
              });
              return { success: true };
            }
            return { success: false, message: data.message, errors: data.errors };
          }
        } catch (error) {
          console.warn("Immediate sync failed, queued for later:", error.message);
        }
        return { success: true };
      },

      updateInventoryItem: async (token, itemId, itemData) => {
        const { imageUri, ...apiData } = itemData;

        // Write to SQLite
        inventoryRepo.upsert({
          id: itemId,
          name: apiData.name,
          category: apiData.category,
          production_cost: apiData.productionCost,
          selling_price: apiData.sellingPrice,
          stock: apiData.stock,
          image_uri: imageUri || null,
          updated_at: new Date().toISOString(),
          created_at: apiData.createdAt || new Date().toISOString(),
        });

        // Enqueue sync
        syncQueueRepo.enqueue("inventory_item", "UPDATE", null, itemId, apiData);

        // Dispatch to state
        dispatch({
          type: "UPDATE_INVENTORY_ITEM",
          payload: { ...apiData, id: itemId, imageUri: imageUri || null },
        });

        // Try immediate sync
        try {
          const online = await isOnline();
          if (online) {
            const res = await fetch(`${API_BASE_URL}/api/v1/inventory/${itemId}`, {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(apiData),
            });
            const data = await res.json();
            if (res.ok) {
              const pending = syncQueueRepo.getPending();
              const entry = pending.find(
                (e) => e.entity_type === "inventory_item" && e.operation === "UPDATE" && e.entity_server_id === itemId
              );
              if (entry) syncQueueRepo.markCompleted(entry.id);

              dispatch({
                type: "UPDATE_INVENTORY_ITEM",
                payload: { ...data, imageUri: imageUri || null },
              });
              return { success: true };
            }
            return { success: false, message: data.message, errors: data.errors };
          }
        } catch (error) {
          console.warn("Immediate sync failed, queued for later:", error.message);
        }
        return { success: true };
      },

      restockItem: async (token, itemId, restockData) => {
        // Update stock locally in SQLite
        const existing = inventoryRepo.getAll().find((i) => i.id === itemId);
        if (existing) {
          inventoryRepo.upsert({
            ...existing,
            stock: existing.stock + restockData.quantity,
            updated_at: new Date().toISOString(),
          });
        }

        // Enqueue sync
        syncQueueRepo.enqueue("restock", "CREATE", null, itemId, {
          ...restockData,
          _itemServerId: itemId,
        });

        // Dispatch to state
        dispatch({
          type: "RESTOCK_ITEM",
          payload: { itemId, quantity: restockData.quantity },
        });

        // Try immediate sync
        try {
          const online = await isOnline();
          if (online) {
            const res = await fetch(
              `${API_BASE_URL}/api/v1/inventory/${itemId}/restock`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(restockData),
              },
            );
            const data = await res.json();
            if (res.ok) {
              const pending = syncQueueRepo.getPending();
              const entry = pending.find(
                (e) => e.entity_type === "restock" && e.entity_server_id === itemId
              );
              if (entry) syncQueueRepo.markCompleted(entry.id);

              dispatch({ type: "UPDATE_INVENTORY_ITEM", payload: data });
              return { success: true };
            }
            return { success: false, message: data.message, errors: data.errors };
          }
        } catch (error) {
          console.warn("Immediate sync failed, queued for later:", error.message);
        }
        return { success: true };
      },

      deleteInventoryItem: async (token, itemId) => {
        // Delete from SQLite
        inventoryRepo.deleteItem(itemId);

        // Enqueue sync
        syncQueueRepo.enqueue("inventory_item", "DELETE", null, itemId, {});

        // Dispatch to state
        dispatch({ type: "DELETE_INVENTORY_ITEM", payload: itemId });

        // Try immediate sync
        try {
          const online = await isOnline();
          if (online) {
            const res = await fetch(`${API_BASE_URL}/api/v1/inventory/${itemId}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
              const pending = syncQueueRepo.getPending();
              const entry = pending.find(
                (e) => e.entity_type === "inventory_item" && e.operation === "DELETE" && e.entity_server_id === itemId
              );
              if (entry) syncQueueRepo.markCompleted(entry.id);
            }
          }
        } catch (error) {
          console.warn("Immediate sync failed, queued for later:", error.message);
        }
      },
    }),
    [],
  );

  const eventActions = useMemo(
    () => ({
      loadEvents: async (token) => {
        dispatch({ type: "SET_LOADING", payload: true });
        // 1. Read from SQLite first
        try {
          const localEvents = eventsRepo.getAll();
          if (localEvents.length > 0) {
            dispatch({ type: "SET_EVENTS", payload: localEvents });
          }
        } catch (e) {
          console.warn("SQLite events read failed:", e.message);
        }

        // 2. If online, fetch from API
        try {
          const online = await isOnline();
          if (!online) return;

          const res = await fetch(`${API_BASE_URL}/api/v1/events`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (res.ok) {
            for (const event of data) {
              eventsRepo.upsertWithExpenses(event);
            }
            const hydrated = eventsRepo.getAll();
            dispatch({ type: "SET_EVENTS", payload: hydrated });
          }
        } catch (error) {
          console.warn("API events fetch failed:", error.message);
        } finally {
          dispatch({ type: "SET_LOADING", payload: false });
        }
      },

      addEvent: async (token, eventData) => {
        const localId = generateLocalId();
        const now = new Date().toISOString();

        // Write to SQLite
        const localEvent = {
          local_id: localId,
          name: eventData.name,
          date: eventData.date,
          end_date: eventData.endDate,
          location: eventData.location || null,
          status: eventData.status || "upcoming",
          currency: eventData.currency || "MYR",
          notes: eventData.notes || null,
          created_at: now,
        };
        eventsRepo.upsert(localEvent);

        // Enqueue sync
        syncQueueRepo.enqueue("event", "CREATE", localId, null, eventData);

        // Dispatch to state
        const stateEvent = {
          localId,
          name: eventData.name,
          date: eventData.date,
          endDate: eventData.endDate,
          location: eventData.location,
          status: eventData.status || "upcoming",
          currency: eventData.currency || "MYR",
          notes: eventData.notes || null,
          createdAt: now,
          expenses: [],
        };
        dispatch({ type: "ADD_EVENT", payload: stateEvent });

        // Try immediate sync
        try {
          const online = await isOnline();
          if (online) {
            const res = await fetch(`${API_BASE_URL}/api/v1/events`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(eventData),
            });
            const data = await res.json();
            if (res.ok) {
              eventsRepo.updateServerId(localId, data.id);
              eventsRepo.upsertWithExpenses(data);
              const pending = syncQueueRepo.getPending();
              const entry = pending.find((e) => e.entity_local_id === localId);
              if (entry) syncQueueRepo.markCompleted(entry.id);

              dispatch({ type: "UPDATE_EVENT", payload: { ...data, localId } });
              return { success: true };
            }
            return { success: false, message: data.message, errors: data.errors };
          }
        } catch (error) {
          console.warn("Immediate sync failed, queued for later:", error.message);
        }
        return { success: true };
      },

      updateEvent: async (token, eventId, eventData) => {
        // Write to SQLite
        eventsRepo.upsert({
          id: eventId,
          name: eventData.name,
          date: eventData.date,
          end_date: eventData.endDate,
          location: eventData.location,
          status: eventData.status,
          currency: eventData.currency,
          notes: eventData.notes,
          created_at: eventData.createdAt || new Date().toISOString(),
        });

        // Enqueue sync
        syncQueueRepo.enqueue("event", "UPDATE", null, eventId, eventData);

        // Dispatch to state
        dispatch({
          type: "UPDATE_EVENT",
          payload: { ...eventData, id: eventId, expenses: eventData.expenses || [] },
        });

        // Try immediate sync
        try {
          const online = await isOnline();
          if (online) {
            const res = await fetch(`${API_BASE_URL}/api/v1/events/${eventId}`, {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(eventData),
            });
            const data = await res.json();
            if (res.ok) {
              eventsRepo.upsertWithExpenses(data);
              const pending = syncQueueRepo.getPending();
              const entry = pending.find(
                (e) => e.entity_type === "event" && e.operation === "UPDATE" && e.entity_server_id === eventId
              );
              if (entry) syncQueueRepo.markCompleted(entry.id);

              dispatch({ type: "UPDATE_EVENT", payload: data });
              return { success: true };
            }
            return { success: false, message: data.message, errors: data.errors };
          }
        } catch (error) {
          console.warn("Immediate sync failed, queued for later:", error.message);
        }
        return { success: true };
      },

      addEventExpense: async (token, eventId, expenseData) => {
        const localId = generateLocalId();
        const now = new Date().toISOString();

        // Write to SQLite
        eventsRepo.insertExpense(
          { local_id: localId, category: expenseData.category, amount: expenseData.amount, created_at: now },
          eventId,
          null,
        );

        // Enqueue sync
        syncQueueRepo.enqueue("event_expense", "CREATE", localId, null, {
          ...expenseData,
          _eventServerId: eventId,
        });

        // Dispatch — reload event from SQLite to get updated expenses
        const allEvents = eventsRepo.getAll();
        const updated = allEvents.find((e) => e.id === eventId);
        if (updated) {
          dispatch({ type: "UPDATE_EVENT", payload: updated });
        }

        // Try immediate sync
        try {
          const online = await isOnline();
          if (online) {
            const res = await fetch(
              `${API_BASE_URL}/api/v1/events/${eventId}/expenses`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(expenseData),
              },
            );
            const data = await res.json();
            if (res.ok) {
              eventsRepo.upsertWithExpenses(data);
              const pending = syncQueueRepo.getPending();
              const entry = pending.find((e) => e.entity_local_id === localId);
              if (entry) syncQueueRepo.markCompleted(entry.id);

              dispatch({ type: "UPDATE_EVENT", payload: data });
              return { success: true };
            }
            return { success: false, message: data.message, errors: data.errors };
          }
        } catch (error) {
          console.warn("Immediate sync failed, queued for later:", error.message);
        }
        return { success: true };
      },

      deleteEventExpense: async (token, eventId, expenseId) => {
        // Delete from SQLite
        eventsRepo.deleteExpense(expenseId);

        // Enqueue sync
        syncQueueRepo.enqueue("event_expense", "DELETE", null, null, {
          _eventServerId: eventId,
          _expenseServerId: expenseId,
        });

        // Dispatch
        dispatch({
          type: "DELETE_EVENT_EXPENSE",
          payload: { eventId, expenseId },
        });

        // Try immediate sync
        try {
          const online = await isOnline();
          if (online) {
            const res = await fetch(
              `${API_BASE_URL}/api/v1/events/${eventId}/expenses/${expenseId}`,
              {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
              },
            );
            if (res.ok) {
              const pending = syncQueueRepo.getPending();
              const entry = pending.find(
                (e) => e.entity_type === "event_expense" && e.operation === "DELETE"
              );
              if (entry) syncQueueRepo.markCompleted(entry.id);
            }
          }
        } catch (error) {
          console.warn("Immediate sync failed, queued for later:", error.message);
        }
      },

      deleteEvent: async (token, eventId) => {
        // Delete from SQLite
        eventsRepo.deleteEvent(eventId);

        // Enqueue sync
        syncQueueRepo.enqueue("event", "DELETE", null, eventId, {});

        // Dispatch to state
        dispatch({ type: "DELETE_EVENT", payload: eventId });

        // Try immediate sync
        try {
          const online = await isOnline();
          if (online) {
            const res = await fetch(`${API_BASE_URL}/api/v1/events/${eventId}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
              const pending = syncQueueRepo.getPending();
              const entry = pending.find(
                (e) => e.entity_type === "event" && e.operation === "DELETE" && e.entity_server_id === eventId
              );
              if (entry) syncQueueRepo.markCompleted(entry.id);
            }
          }
        } catch (error) {
          console.warn("Immediate sync failed, queued for later:", error.message);
        }
      },
    }),
    [],
  );

  const salesActions = useMemo(
    () => ({
      loadSales: async (token) => {
        dispatch({ type: "SET_LOADING", payload: true });
        // 1. Read from SQLite first
        try {
          const localSales = salesRepo.getAll();
          if (localSales.length > 0) {
            dispatch({ type: "SET_SALES", payload: localSales });
          }
        } catch (e) {
          console.warn("SQLite sales read failed:", e.message);
        }

        // 2. If online, fetch from API
        try {
          const online = await isOnline();
          if (!online) return;

          const res = await fetch(`${API_BASE_URL}/api/v1/sales`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (res.ok) {
            for (const sale of data) {
              salesRepo.upsertFromServer(sale);
            }
            const hydrated = salesRepo.getAll();
            dispatch({ type: "SET_SALES", payload: hydrated });
          }
        } catch (error) {
          console.warn("API sales fetch failed:", error.message);
        } finally {
          dispatch({ type: "SET_LOADING", payload: false });
        }
      },

      createSale: async (token, saleData) => {
        const localId = generateLocalId();
        const now = new Date().toISOString();

        // Write to SQLite
        const localSale = {
          local_id: localId,
          subtotal: saleData.subtotal,
          discount_type: saleData.discountType || null,
          discount_value: saleData.discountValue || null,
          discount_amount: saleData.discountAmount || null,
          total: saleData.total,
          payment_method: saleData.paymentMethod,
          timestamp: saleData.timestamp || now,
          items: saleData.items || [],
        };
        salesRepo.insert(localSale);

        // Decrement stock locally
        for (const item of (saleData.items || [])) {
          const invItem = inventoryRepo.getAll().find((i) => i.id === item.itemId);
          if (invItem) {
            inventoryRepo.updateStock(item.itemId, Math.max(0, invItem.stock - item.quantity));
          }
        }

        // Enqueue sync
        syncQueueRepo.enqueue("sale", "CREATE", localId, null, saleData);

        // Dispatch to state
        const stateSale = {
          localId,
          subtotal: saleData.subtotal,
          discountType: saleData.discountType,
          discountValue: saleData.discountValue,
          discountAmount: saleData.discountAmount,
          total: saleData.total,
          paymentMethod: saleData.paymentMethod,
          timestamp: saleData.timestamp || now,
          items: saleData.items || [],
        };
        dispatch({ type: "ADD_SALE", payload: stateSale });

        // Try immediate sync
        try {
          const online = await isOnline();
          if (online) {
            const res = await fetch(`${API_BASE_URL}/api/v1/sales`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(saleData),
            });
            const data = await res.json();
            if (res.ok) {
              salesRepo.updateServerId(localId, data.id);
              const pending = syncQueueRepo.getPending();
              const entry = pending.find((e) => e.entity_local_id === localId);
              if (entry) syncQueueRepo.markCompleted(entry.id);

              return { success: true, data };
            }
            return { success: false, message: data.message, errors: data.errors };
          }
        } catch (error) {
          console.warn("Immediate sync failed, queued for later:", error.message);
        }
        return { success: true, data: stateSale };
      },
    }),
    [],
  );

  const dashboardActions = useMemo(
    () => ({
      loadDashboard: async (token) => {
        // Always compute local dashboard first so screen is never blank
        try {
          const localDashboard = computeLocalDashboard();
          dispatch({ type: "SET_DASHBOARD", payload: localDashboard });
        } catch (e) {
          console.warn("Local dashboard compute failed:", e.message);
        }

        // If online, fetch from API for authoritative data
        try {
          const online = await isOnline();
          if (!online) return;

          const res = await fetch(`${API_BASE_URL}/api/v1/dashboard`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (res.ok) {
            dispatch({ type: "SET_DASHBOARD", payload: data });
          }
        } catch (error) {
          console.warn("Dashboard fetch failed:", error.message);
        }
      },
    }),
    [],
  );

  const syncActions = useMemo(
    () => ({
      runSync: wrappedRunSync,
    }),
    [wrappedRunSync],
  );

  // Wire auto-sync: when connectivity returns (offline → online), trigger sync
  const tokenRef = useRef(null);

  // Keep tokenRef updated — we can't access useAuth here directly,
  // but consumers pass token to runSync; store the last-used token.
  const wrappedRunSync = useCallback(async (token) => {
    tokenRef.current = token;
    await syncAll(token, dispatch);
  }, []);

  useEffect(() => {
    registerSyncFunction(() => {
      if (tokenRef.current) {
        triggerSync(() => syncAll(tokenRef.current, dispatch));
      }
    });
  }, [registerSyncFunction, triggerSync]);

  // Sync on app foreground
  useEffect(() => {
    const subscription = RNAppState.addEventListener("change", (nextState) => {
      if (nextState === "active" && tokenRef.current) {
        triggerSync(() => syncAll(tokenRef.current, dispatch));
      }
    });
    return () => subscription.remove();
  }, [triggerSync]);

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        ...inventoryActions,
        ...eventActions,
        ...salesActions,
        ...dashboardActions,
        ...syncActions,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppState must be used within an AppStateProvider");
  }
  return context;
}
