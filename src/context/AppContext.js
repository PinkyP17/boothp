import { createContext, useContext, useReducer, useMemo } from "react";

import * as inventoryRepo from "../services/repositories/inventoryRepo";
import * as salesRepo from "../services/repositories/salesRepo";
import * as eventsRepo from "../services/repositories/eventsRepo";
import * as itemImagesRepo from "../services/repositories/itemImagesRepo";
import * as restockRepo from "../services/repositories/restockRepo";

const AppContext = createContext();

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
      const { sale, stockUpdates } = action.payload;
      const updatedInventory = state.inventory.map((item) => {
        const update = stockUpdates.find((u) => u.itemId === item.id);
        return update ? { ...item, stock: update.newStock } : item;
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
  const imageRows = itemImagesRepo.getByItemId(row.id);
  const images = imageRows.map((r) => r.image_uri);

  // Fallback: if no images in junction table but legacy image_uri exists, use it
  if (images.length === 0 && row.image_uri) {
    images.push(row.image_uri);
  }

  return {
    id: row.id,
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
      id: sale.id,
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
        id: exp.id,
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
          return { success: true };
        } catch (e) {
          console.warn("Loading inventory failed:", e.message);
          return { success: false, message: "Failed to load inventory" };
        } finally {
          dispatch({ type: "SET_LOADING", payload: false });
        }
      },

      addInventoryItem: (itemData) => {
        const { imageUri, images: itemImages, ...data } = itemData;
        const imageList = itemImages && itemImages.length > 0 ? itemImages : imageUri ? [imageUri] : [];
        const now = new Date().toISOString();

        const newItem = {
          name: data.name,
          category: data.category,
          production_cost: data.productionCost,
          selling_price: data.sellingPrice,
          stock: data.stock,
          image_uri: imageList[0] || null,
          created_at: now,
          updated_at: now,
        };

        let itemId;
        try {
          itemId = inventoryRepo.insert(newItem);
        } catch (error) {
          console.warn("Failed to save inventory item:", error.message);
          return { success: false, message: "Failed to save item" };
        }

        if (imageList.length > 0) {
          itemImagesRepo.replaceImages(itemId, imageList);
        }

        const stateItem = mapInventoryItem({ ...newItem, id: itemId });
        dispatch({ type: "ADD_TO_INVENTORY", payload: stateItem });
        return { success: true };
      },

      updateInventoryItem: (itemId, itemData) => {
        const { imageUri, images: itemImages, ...data } = itemData;
        const imageList = itemImages && itemImages.length > 0 ? itemImages : imageUri ? [imageUri] : [];

        try {
          inventoryRepo.update({
            id: itemId,
            name: data.name,
            category: data.category,
            production_cost: data.productionCost,
            selling_price: data.sellingPrice,
            stock: data.stock,
            image_uri: imageList[0] || null,
            updated_at: new Date().toISOString(),
          });
        } catch (error) {
          console.warn("Failed to update inventory item:", error.message);
          return { success: false, message: "Failed to update item" };
        }

        itemImagesRepo.replaceImages(itemId, imageList);

        dispatch({
          type: "UPDATE_INVENTORY_ITEM",
          payload: { ...data, id: itemId, imageUri: imageList[0] || null, images: imageList },
        });
        return { success: true };
      },

      restockItem: (itemId, restockData) => {
        const existing = inventoryRepo.getById(itemId);
        if (!existing) {
          return { success: false, message: "Item not found" };
        }

        try {
          inventoryRepo.update({
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
        try {
          // item_images and restocks rows are removed automatically via ON DELETE CASCADE
          inventoryRepo.deleteItem(itemId);
        } catch (error) {
          console.warn("Failed to delete inventory item:", error.message);
          return { success: false, message: "Failed to delete item" };
        }
        dispatch({ type: "DELETE_INVENTORY_ITEM", payload: itemId });
        return { success: true };
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
          return { success: true };
        } catch (e) {
          console.warn("Loading events failed:", e.message);
          return { success: false, message: "Failed to load events" };
        } finally {
          dispatch({ type: "SET_LOADING", payload: false });
        }
      },

      addEvent: (eventData) => {
        const now = new Date().toISOString();

        const newEvent = {
          name: eventData.name,
          date: eventData.date,
          end_date: eventData.endDate,
          location: eventData.location || null,
          status: eventData.status || "upcoming",
          currency: eventData.currency || "MYR",
          notes: eventData.notes || null,
          created_at: now,
        };

        let eventId;
        try {
          eventId = eventsRepo.insert(newEvent);
        } catch (error) {
          console.warn("Failed to save event:", error.message);
          return { success: false, message: "Failed to save event" };
        }

        const stateEvent = {
          id: eventId,
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
          eventsRepo.update({
            id: eventId,
            name: eventData.name,
            date: eventData.date,
            end_date: eventData.endDate,
            location: eventData.location,
            status: eventData.status,
            currency: eventData.currency,
            notes: eventData.notes,
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
        const now = new Date().toISOString();

        try {
          eventsRepo.insertExpense(
            { category: expenseData.category, amount: expenseData.amount, created_at: now },
            eventId,
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
        try {
          eventsRepo.deleteExpense(expenseId);
        } catch (error) {
          console.warn("Failed to delete expense:", error.message);
          return { success: false, message: "Failed to delete expense" };
        }
        dispatch({
          type: "DELETE_EVENT_EXPENSE",
          payload: { eventId, expenseId },
        });
        return { success: true };
      },

      deleteEvent: (eventId) => {
        try {
          eventsRepo.deleteEvent(eventId);
        } catch (error) {
          console.warn("Failed to delete event:", error.message);
          return { success: false, message: "Failed to delete event" };
        }
        dispatch({ type: "DELETE_EVENT", payload: eventId });
        return { success: true };
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
          return { success: true };
        } catch (e) {
          console.warn("Loading sales failed:", e.message);
          return { success: false, message: "Failed to load sales" };
        } finally {
          dispatch({ type: "SET_LOADING", payload: false });
        }
      },

      createSale: (saleData) => {
        const now = new Date().toISOString();
        const items = saleData.items || [];
        const subtotal = items.reduce(
          (sum, item) => sum + item.unitPrice * item.quantity,
          0,
        );

        const newSale = {
          subtotal,
          discount_type: saleData.discount?.type || null,
          discount_value: saleData.discount?.value || null,
          discount_amount: saleData.discount?.amount || null,
          total: saleData.total,
          payment_method: saleData.paymentMethod,
          timestamp: saleData.timestamp || now,
          items,
        };

        let saleId;
        try {
          saleId = salesRepo.insert(newSale);
        } catch (error) {
          console.warn("Failed to record sale:", error.message);
          return { success: false, message: "Failed to record sale" };
        }

        const stockUpdates = [];
        for (const item of items) {
          const invItem = inventoryRepo.getById(item.itemId);
          if (invItem) {
            const newStock = Math.max(0, invItem.stock - item.quantity);
            inventoryRepo.updateStock(item.itemId, newStock);
            stockUpdates.push({ itemId: item.itemId, newStock });
          }
        }

        const stateSale = {
          id: saleId,
          subtotal,
          discountType: saleData.discount?.type,
          discountValue: saleData.discount?.value,
          discountAmount: saleData.discount?.amount,
          total: saleData.total,
          paymentMethod: saleData.paymentMethod,
          timestamp: saleData.timestamp || now,
          items,
        };
        dispatch({ type: "ADD_SALE", payload: { sale: stateSale, stockUpdates } });

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
          return { success: true };
        } catch (e) {
          console.warn("Dashboard compute failed:", e.message);
          return { success: false, message: "Failed to load dashboard" };
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
