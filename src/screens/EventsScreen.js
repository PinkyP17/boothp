import { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { SIZES } from "../constants/theme";
import { EVENT_STATUSES } from "../constants/categories";
import { useAppState } from "../context/AppContext";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../components/Toast";
import SummaryCard from "../components/SummaryCard";
import SearchBar from "../components/SearchBar";
import CategoryFilter from "../components/CategoryFilter";
import EventTimelineCard from "../components/event/EventTimelineCard";
import EventModal from "../components/event/EventModal";

export default function EventsScreen({ navigation }) {
  const {
    state,
    loadEvents,
    addEvent,
    updateEvent,
  } = useAppState();
  const { showToast } = useToast();
  const { colors: C } = useTheme();
  const events = state.events;

  useEffect(() => {
    loadEvents();
  }, []);

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");

  const [eventModalVisible, setEventModalVisible] = useState(false);
  const [eventModalMode, setEventModalMode] = useState("add");
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Close modal when navigating away
  useFocusEffect(
    useCallback(() => {
      return () => {
        setEventModalVisible(false);
      };
    }, []),
  );

  const filteredEvents = events
    .filter((event) => {
      const matchesStatus =
        selectedStatus === "All" ||
        event.status === selectedStatus.toLowerCase();
      const matchesSearch = event.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  const totalExpenses = events.reduce(
    (sum, event) => sum + event.expenses.reduce((s, exp) => s + exp.amount, 0),
    0,
  );

  const openAddModal = () => {
    setSelectedEvent(null);
    setEventModalMode("add");
    setEventModalVisible(true);
  };

  const openEventDetail = (event) => {
    navigation.navigate("EventDetail", { eventId: event.id });
  };

  const handleSaveEvent = (eventData) => {
    let result;
    if (eventModalMode === "add") {
      result = addEvent(eventData);
    } else {
      result = updateEvent(eventData.id, eventData);
    }
    if (result && !result.success) {
      showToast(result.message || "Failed to save event", "error");
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadEvents();
              setRefreshing(false);
            }}
            colors={[C.primary]}
            tintColor={C.primary}
          />
        }
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: C.textPrimary }]}>Events</Text>
          <Text style={[styles.subtitle, { color: C.textSecondary }]}>
            {events.length} events
          </Text>
        </View>

        <View style={styles.cardsRow}>
          <SummaryCard
            title="Total Events"
            amount={events.length}
            color={C.primary}
            format="number"
          />
          <SummaryCard
            title="Total Expenses"
            amount={totalExpenses}
            color={C.expense}
          />
        </View>

        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search events..."
        />
        <CategoryFilter
          categories={EVENT_STATUSES}
          selected={selectedStatus}
          onSelect={setSelectedStatus}
        />

        {state.isLoading && events.length === 0 ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color={C.primary} />
          </View>
        ) : filteredEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="calendar-outline"
              size={48}
              color={C.textSecondary}
            />
            <Text style={[styles.emptyText, { color: C.textSecondary }]}>
              No events found
            </Text>
          </View>
        ) : (
          filteredEvents.map((event, index) => (
            <EventTimelineCard
              key={event.id}
              event={event}
              isLast={index === filteredEvents.length - 1}
              onPress={() => openEventDetail(event)}
            />
          ))
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: C.primary }]}
        onPress={openAddModal}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      <EventModal
        visible={eventModalVisible}
        onClose={() => setEventModalVisible(false)}
        onSave={handleSaveEvent}
        event={selectedEvent}
        mode={eventModalMode}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: SIZES.padding,
  },
  header: {
    marginTop: 8,
    marginBottom: 20,
  },
  title: {
    fontSize: SIZES.fontTitle,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: SIZES.fontBody,
    marginTop: 4,
  },
  cardsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: SIZES.fontBody,
    marginTop: 12,
  },
  bottomSpacer: {
    height: 80,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
