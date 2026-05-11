import { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SIZES } from "../constants/theme";
import { EVENT_STATUSES } from "../data/mockData";
import { useAppState } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
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
  const { token } = useAuth();
  const events = state.events;

  useEffect(() => {
    if (token) {
      loadEvents(token);
    }
  }, [token]);

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

  const handleSaveEvent = async (eventData) => {
    if (eventModalMode === "add") {
      await addEvent(token, eventData);
    } else {
      await updateEvent(token, eventData.id, eventData);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Events</Text>
          <Text style={styles.subtitle}>{events.length} events</Text>
        </View>

        <View style={styles.cardsRow}>
          <SummaryCard
            title="Total Events"
            amount={events.length}
            color={COLORS.primary}
            format="number"
          />
          <SummaryCard
            title="Total Expenses"
            amount={totalExpenses}
            color={COLORS.expense}
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

        {filteredEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="calendar-outline"
              size={48}
              color={COLORS.textSecondary}
            />
            <Text style={styles.emptyText}>No events found</Text>
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
        style={styles.fab}
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
    backgroundColor: COLORS.background,
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
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: SIZES.fontBody,
    color: COLORS.textSecondary,
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
    color: COLORS.textSecondary,
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
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
