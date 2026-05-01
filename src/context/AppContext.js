import { createContext, useContext, useReducer, useMemo } from "react";
import { events } from "../data/mockData";
import { API_BASE_URL } from "../config/api";

const AppContext = createContext();

const initialState = {
  inventory: [],
  sales: [],
  events: [...events],
};

function appReducer(state, action) {
  switch (action.type) {
    case "SET_INVENTORY":
      return {
        ...state,
        inventory: action.payload,
      };

    case "ADD_TO_INVENTORY":
      return {
        ...state,
        inventory: [action.payload, ...state.inventory],
      };

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

    case "ADD_EVENT":
      return {
        ...state,
        events: [...state.events, action.payload],
      };

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

    default:
      return state;
  }
}

export function AppStateProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const inventoryActions = useMemo(
    () => ({
      loadInventory: async (token) => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/v1/inventory`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (res.ok) {
            dispatch({ type: "SET_INVENTORY", payload: data });
          }
        } catch (error) {
          console.error("Failed to load inventory:", error);
        }
      },

      addInventoryItem: async (token, itemData) => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/v1/inventory`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(itemData),
          });
          const data = await res.json();
          if (res.ok) {
            dispatch({ type: "ADD_TO_INVENTORY", payload: data });
          }
        } catch (error) {
          console.error("Failed to add inventory item:", error);
        }
      },

      updateInventoryItem: async (token, itemId, itemData) => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/v1/inventory/${itemId}`, {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(itemData),
          });
          const data = await res.json();
          if (res.ok) {
            dispatch({ type: "UPDATE_INVENTORY_ITEM", payload: data });
          }
        } catch (error) {
          console.error("Failed to update inventory item:", error);
        }
      },
    }),
    [],
  );

  return (
    <AppContext.Provider value={{ state, dispatch, ...inventoryActions }}>
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
