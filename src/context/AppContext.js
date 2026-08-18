import { createContext, useContext, useReducer, useMemo } from "react";

import * as inventoryRepo from "../services/repositories/inventoryRepo";
import * as salesRepo from "../services/repositories/salesRepo";
import * as eventsRepo from "../services/repositories/eventsRepo";
import * as itemImagesRepo from "../services/repositories/itemImagesRepo";
import * as restockRepo from "../services/repositories/restockRepo";

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
  // Load images from junction table
  const imageRows = row.id
    ? itemImagesRepo.getByItemId(row.id)
    : row.local_id
      ? itemImagesRepo.getByItemLocalId(row.local_id)
      : [];
  const images = imageRows.map((r) => r.image_uri);

  // Fallback: if no images in junction table but legacy image_uri exists, use it
  if (images.length === 0 && row.image_uri) {
    images.push(row.image_uri);
  }

  return {
    id: row.id,
    localId: row.local_id,
    name: row.name,
    category: row.category,
    productionCost: row.production_cost,
    sellingPrice: row.selling_price,
    stock: row.stock,
    imageUri: images[0] || null,
    images,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function computeDashboard() {
  const sales = salesRepo.getAll();
  const events = eventsRepo.getAll();
  const restocks = restockRepo.getAll();
  const today = new Date().toISOString().split("T")[0];

  const income = sales.reduce((sum, s) => sum + (s.total || 0), 0);

  let totalEventExpenses = 0;
  const upcomingEvents = [];
  const allEventsWithTotals = [];

  for (const event of events) {
    const eventExpenseTotal = (event.expenses || []).reduce((sum, exp) => sum + exp.amount, 0);
    totalEventExpenses += eventExpenseTotal;

    const eventWithTotals = { ...event, totalExpenses: eventExpenseTotal };
    allEventsWithTotals.push(eventWithTotals);

    if (event.date >= today) {
      upcomingEvents.push(eventWithTotals);
    }
  }

  const restockExpenses = restocks.reduce((sum, r) => sum + r.cost, 0);
  const totalExpenses = totalEventExpenses + restockExpenses;

  // Build recent transactions from sales + event expenses
  const transactions = [];
  for (const sale of sales) {
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

  // Revenue by day for line chart
  const revenueByDay = {};
  for (const sale of sales) {
    const day = (sale.timestamp || "").split("T")[0];
    if (day) {
      revenueByDay[day] = (revenueByDay[day] || 0) + (sale.total || 0);
    }
  }

  // Expense breakdown by category
  const expenseByCategory = {};
  for (const event of events) {
    for (const exp of event.expenses || []) {
      expenseByCategory[exp.category] = (expenseByCategory[exp.category] || 0) + exp.amount;
    }
  }
  if (restockExpenses > 0) {
    expenseByCategory["Restock"] = (expenseByCategory["Restock"] || 0) + restockExpenses;
  }

  // Income breakdown by event
  const incomeByEvent = {};
  for (const event of events) {
    const endDate = event.endDate || event.date;
    let eventIncome = 0;
    for (const sale of sales) {
      const saleDay = (sale.timestamp || "").split("T")[0];
      if (saleDay && saleDay >= event.date && saleDay <= endDate) {
        eventIncome += sale.total || 0;
      }
    }
    if (eventIncome > 0) {
      incomeByEvent[event.name] = (incomeByEvent[event.name] || 0) + eventIncome;
    }
  }

  // Expense by day for comparison chart
  const expenseByDay = {};
  for (const event of events) {
    for (const exp of event.expenses || []) {
      const day = (exp.createdAt || event.createdAt || "").split("T")[0];
      if (day) {
        expenseByDay[day] = (expenseByDay[day] || 0) + exp.amount;
      }
    }
  }

  return {
    income,
    totalExpenses,
    restockExpenses,
    netProfit: income - totalExpenses,
    upcomingEvents: upcomingEvents.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5),
    allEvents: allEventsWithTotals,
    transactions: transactions.slice(0, 20),
    revenueByDay,
    expenseByDay,
    expenseByCategory,
    incomeByEvent,
  };
}

export function AppStateProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const inventoryActions = useMemo(
    () => ({
      loadInventory: () => {
        dispatch({ type: "SET_LOADING", payload: true });
        try {
          const items = inventoryRepo.getAll().map(mapInventoryItem);
          dispatch({ type: "SET_INVENTORY", payload: items });
        } catch (e) {
          console.warn("Loading inventory failed:", e.message);
        } finally {
          dispatch({ type: "SET_LOADING", payload: false });
        }
      },

      addInventoryItem: (itemData) => {
        const { imageUri, images: itemImages, ...data } = itemData;
        const imageList = itemImages && itemImages.length > 0 ? itemImages : imageUri ? [imageUri] : [];
        const localId = generateLocalId();
        const now = new Date().toISOString();

        const localItem = {
          local_id: localId,
          name: data.name,
          category: data.category,
          production_cost: data.productionCost,
          selling_price: data.sellingPrice,
          stock: data.stock,
          image_uri: imageList[0] || null,
          created_at: now,
          updated_at: now,
        };

        try {
          inventoryRepo.upsert(localItem);
        } catch (error) {
          console.warn("Failed to save inventory item:", error.message);
          return { success: false, message: "Failed to save item" };
        }

        if (imageList.length > 0) {
          itemImagesRepo.replaceImages(null, localId, imageList);
        }

        const stateItem = {
          ...mapInventoryItem({ ...localItem, id: null }),
          localId,
        };
        dispatch({ type: "ADD_TO_INVENTORY", payload: stateItem });
        return { success: true };
      },

      updateInventoryItem: (itemId, itemData) => {
        const { imageUri, images: itemImages, ...data } = itemData;
        const imageList = itemImages && itemImages.length > 0 ? itemImages : imageUri ? [imageUri] : [];

        try {
          inventoryRepo.upsert({
            id: itemId,
            name: data.name,
            category: data.category,
            production_cost: data.productionCost,
            selling_price: data.sellingPrice,
            stock: data.stock,
            image_uri: imageList[0] || null,
            updated_at: new Date().toISOString(),
            created_at: data.createdAt || new Date().toISOString(),
          });
        } catch (error) {
          console.warn("Failed to update inventory item:", error.message);
          return { success: false, message: "Failed to update item" };
        }

        itemImagesRepo.replaceImages(itemId, null, imageList);

        dispatch({
          type: "UPDATE_INVENTORY_ITEM",
          payload: { ...data, id: itemId, imageUri: imageList[0] || null, images: imageList },
        });
        return { success: true };
      },

      restockItem: (itemId, restockData) => {
        const existing = inventoryRepo.getAll().find((i) => i.id === itemId);
        if (!existing) {
          return { success: false, message: "Item not found" };
        }

        try {
          inventoryRepo.upsert({
            ...existing,
            stock: existing.stock + restockData.quantity,
            updated_at: new Date().toISOString(),
          });
          restockRepo.insert(itemId, restockData.quantity, restockData.cost || 0);
        } catch (error) {
          console.warn("Failed to restock item:", error.message);
          return { success: false, message: "Failed to restock item" };
        }

        dispatch({
          type: "RESTOCK_ITEM",
          payload: { itemId, quantity: restockData.quantity },
        });
        return { success: true };
      },

      deleteInventoryItem: (itemId) => {
        itemImagesRepo.removeAllForItem(itemId);
        inventoryRepo.deleteItem(itemId);
        dispatch({ type: "DELETE_INVENTORY_ITEM", payload: itemId });
      },
    }),
    [],
  );

  const eventActions = useMemo(
    () => ({
      loadEvents: () => {
        dispatch({ type: "SET_LOADING", payload: true });
        try {
          const events = eventsRepo.getAll();
          dispatch({ type: "SET_EVENTS", payload: events });
        } catch (e) {
          console.warn("Loading events failed:", e.message);
        } finally {
          dispatch({ type: "SET_LOADING", payload: false });
        }
      },

      addEvent: (eventData) => {
        const localId = generateLocalId();
        const now = new Date().toISOString();

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

        try {
          eventsRepo.upsert(localEvent);
        } catch (error) {
          console.warn("Failed to save event:", error.message);
          return { success: false, message: "Failed to save event" };
        }

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
        return { success: true };
      },

      updateEvent: (eventId, eventData) => {
        try {
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
        } catch (error) {
          console.warn("Failed to update event:", error.message);
          return { success: false, message: "Failed to update event" };
        }

        dispatch({
          type: "UPDATE_EVENT",
          payload: { ...eventData, id: eventId, expenses: eventData.expenses || [] },
        });
        return { success: true };
      },

      addEventExpense: (eventId, expenseData) => {
        const localId = generateLocalId();
        const now = new Date().toISOString();

        try {
          eventsRepo.insertExpense(
            { local_id: localId, category: expenseData.category, amount: expenseData.amount, created_at: now },
            eventId,
            null,
          );
        } catch (error) {
          console.warn("Failed to add expense:", error.message);
          return { success: false, message: "Failed to add expense" };
        }

        const allEvents = eventsRepo.getAll();
        const updated = allEvents.find((e) => e.id === eventId);
        if (updated) {
          dispatch({ type: "UPDATE_EVENT", payload: updated });
        }
        return { success: true };
      },

      deleteEventExpense: (eventId, expenseId) => {
        eventsRepo.deleteExpense(expenseId);
        dispatch({
          type: "DELETE_EVENT_EXPENSE",
          payload: { eventId, expenseId },
        });
      },

      deleteEvent: (eventId) => {
        eventsRepo.deleteEvent(eventId);
        dispatch({ type: "DELETE_EVENT", payload: eventId });
      },
    }),
    [],
  );

  const salesActions = useMemo(
    () => ({
      loadSales: () => {
        dispatch({ type: "SET_LOADING", payload: true });
        try {
          const sales = salesRepo.getAll();
          dispatch({ type: "SET_SALES", payload: sales });
        } catch (e) {
          console.warn("Loading sales failed:", e.message);
        } finally {
          dispatch({ type: "SET_LOADING", payload: false });
        }
      },

      createSale: (saleData) => {
        const localId = generateLocalId();
        const now = new Date().toISOString();
        const items = saleData.items || [];
        const subtotal = items.reduce(
          (sum, item) => sum + item.unitPrice * item.quantity,
          0,
        );

        const localSale = {
          local_id: localId,
          subtotal,
          discount_type: saleData.discount?.type || null,
          discount_value: saleData.discount?.value || null,
          discount_amount: saleData.discount?.amount || null,
          total: saleData.total,
          payment_method: saleData.paymentMethod,
          timestamp: saleData.timestamp || now,
          items,
        };

        try {
          salesRepo.insert(localSale);
        } catch (error) {
          console.warn("Failed to record sale:", error.message);
          return { success: false, message: "Failed to record sale" };
        }

        for (const item of items) {
          const invItem = inventoryRepo.getAll().find((i) => i.id === item.itemId);
          if (invItem) {
            inventoryRepo.updateStock(item.itemId, Math.max(0, invItem.stock - item.quantity));
          }
        }

        const stateSale = {
          localId,
          subtotal,
          discountType: saleData.discount?.type,
          discountValue: saleData.discount?.value,
          discountAmount: saleData.discount?.amount,
          total: saleData.total,
          paymentMethod: saleData.paymentMethod,
          timestamp: saleData.timestamp || now,
          items,
        };
        dispatch({ type: "ADD_SALE", payload: stateSale });

        return { success: true, data: stateSale };
      },
    }),
    [],
  );

  const dashboardActions = useMemo(
    () => ({
      loadDashboard: () => {
        try {
          const dashboard = computeDashboard();
          dispatch({ type: "SET_DASHBOARD", payload: dashboard });
        } catch (e) {
          console.warn("Dashboard compute failed:", e.message);
        }
      },
    }),
    [],
  );

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        ...inventoryActions,
        ...eventActions,
        ...salesActions,
        ...dashboardActions,
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
