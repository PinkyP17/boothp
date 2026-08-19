import { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SIZES } from "../../constants/theme";
import { useTheme } from "../../context/ThemeContext";
import { CATEGORIES } from "../../constants/categories";
import { pickImage, saveImageLocally, deleteImage } from "../../services/imageService";

const editableCategories = CATEGORIES.filter((c) => c !== "All");
const MAX_IMAGES = 5;

const emptyForm = {
  name: "",
  category: "Prints",
  productionCost: "",
  sellingPrice: "",
  stock: "",
  images: [],
};

export default function InventoryItemModal({
  visible,
  onClose,
  onSave,
  item,
  mode,
}) {
  const { colors: C } = useTheme();
  const [form, setForm] = useState(emptyForm);
  const [restockQty, setRestockQty] = useState("");
  const [restockCost, setRestockCost] = useState("");

  useEffect(() => {
    if (mode === "add") {
      setForm(emptyForm);
    } else if (mode === "edit" && item) {
      const existingImages = item.images && item.images.length > 0
        ? [...item.images]
        : item.imageUri
          ? [item.imageUri]
          : [];
      setForm({
        name: item.name,
        category: item.category,
        productionCost: item.productionCost.toString(),
        sellingPrice: item.sellingPrice.toString(),
        stock: item.stock.toString(),
        images: existingImages,
      });
    } else if (mode === "restock") {
      setRestockQty("");
      setRestockCost("");
    }
  }, [visible, mode, item]);

  const title =
    mode === "add"
      ? "Add Item"
      : mode === "edit"
        ? "Edit Item"
        : `Restock ${item?.name}`;
  const saveLabel =
    mode === "add" ? "Add" : mode === "edit" ? "Save" : "Restock";

  const handleSave = () => {
    if (mode === "restock") {
      const qty = parseInt(restockQty, 10);
      const cost = parseFloat(restockCost);
      if (!qty || qty <= 0) return;
      onSave({ itemId: item.id, quantity: qty, cost: cost || 0 });
    } else {
      if (!form.name.trim()) return;
      onSave({
        id: item?.id || Date.now().toString(),
        name: form.name.trim(),
        category: form.category,
        productionCost: parseFloat(form.productionCost) || 0,
        sellingPrice: parseFloat(form.sellingPrice) || 0,
        stock: parseInt(form.stock, 10) || 0,
        images: form.images,
        imageUri: form.images[0] || null,
      });
    }
    onClose();
  };

  const handleAddImage = () => {
    if (form.images.length >= MAX_IMAGES) {
      Alert.alert("Limit Reached", `You can add up to ${MAX_IMAGES} photos per item.`);
      return;
    }

    Alert.alert("Add Photo", "Choose a source", [
      {
        text: "Take Photo",
        onPress: async () => {
          const uri = await pickImage("camera");
          if (uri) {
            const itemId = item?.id || Date.now().toString();
            const saved = await saveImageLocally(uri, itemId);
            setForm((prev) => ({ ...prev, images: [...prev.images, saved] }));
          }
        },
      },
      {
        text: "Choose from Gallery",
        onPress: async () => {
          const uri = await pickImage("gallery");
          if (uri) {
            const itemId = item?.id || Date.now().toString();
            const saved = await saveImageLocally(uri, itemId);
            setForm((prev) => ({ ...prev, images: [...prev.images, saved] }));
          }
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleRemoveImage = (index) => {
    Alert.alert("Remove Photo", "Are you sure you want to remove this photo?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          const removed = form.images[index];
          setForm((prev) => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index),
          }));
          deleteImage(removed);
        },
      },
    ]);
  };

  const renderImageItem = ({ item: uri, index }) => (
    <View style={styles.imageThumbWrapper}>
      <Image source={{ uri }} style={styles.imageThumb} />
      <TouchableOpacity
        style={styles.removeImageBtn}
        onPress={() => handleRemoveImage(index)}
      >
        <Ionicons name="close-circle" size={22} color="#FF3B30" />
      </TouchableOpacity>
      {index === 0 && (
        <View style={[styles.primaryBadge, { backgroundColor: C.primary }]}>
          <Text style={styles.primaryBadgeText}>Main</Text>
        </View>
      )}
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={[styles.modal, { backgroundColor: C.card }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={[styles.title, { color: C.textPrimary }]}>{title}</Text>

            {mode === "restock" ? (
              <>
                <Text style={[styles.stockInfo, { color: C.textSecondary }]}>
                  Current stock: {item?.stock}
                </Text>

                <Text style={[styles.label, { color: C.textSecondary }]}>Quantity to Add</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: C.background, color: C.textPrimary }]}
                  value={restockQty}
                  onChangeText={setRestockQty}
                  keyboardType="number-pad"
                  placeholder="e.g. 50"
                  placeholderTextColor={C.textSecondary}
                />

                <Text style={[styles.label, { color: C.textSecondary }]}>Total Cost for This Batch</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: C.background, color: C.textPrimary }]}
                  value={restockCost}
                  onChangeText={setRestockCost}
                  keyboardType="decimal-pad"
                  placeholder="e.g. 75.00"
                  placeholderTextColor={C.textSecondary}
                />

                <View style={[styles.noteBox, { backgroundColor: C.primary + "10" }]}>
                  <Text style={[styles.noteText, { color: C.primary }]}>
                    This will be logged as a Production/Restock expense.
                  </Text>
                </View>
              </>
            ) : (
              <>
                {/* Multi-image gallery */}
                <View style={styles.imageSection}>
                  <FlatList
                    data={form.images}
                    renderItem={renderImageItem}
                    keyExtractor={(uri, i) => `${uri}-${i}`}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    ListFooterComponent={
                      form.images.length < MAX_IMAGES ? (
                        <TouchableOpacity
                          style={[styles.addImageBtn, { backgroundColor: C.background, borderColor: C.textSecondary + "40" }]}
                          onPress={handleAddImage}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="camera-outline" size={28} color={C.textSecondary} />
                          <Text style={[styles.addImageText, { color: C.textSecondary }]}>
                            {form.images.length === 0 ? "Add Photos" : `${form.images.length}/${MAX_IMAGES}`}
                          </Text>
                        </TouchableOpacity>
                      ) : null
                    }
                    contentContainerStyle={styles.imageList}
                  />
                </View>

                <Text style={[styles.label, { color: C.textSecondary }]}>Item Name</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: C.background, color: C.textPrimary }]}
                  value={form.name}
                  onChangeText={(text) => setForm({ ...form, name: text })}
                  placeholder="e.g. Gojo Print A4"
                  placeholderTextColor={C.textSecondary}
                />

                <Text style={[styles.label, { color: C.textSecondary }]}>Category</Text>
                <View style={styles.categoryRow}>
                  {editableCategories.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryPill,
                        { backgroundColor: C.background },
                        form.category === cat && { backgroundColor: C.primary },
                      ]}
                      onPress={() => setForm({ ...form, category: cat })}
                    >
                      <Text
                        style={[
                          styles.categoryPillText,
                          { color: C.textSecondary },
                          form.category === cat && { color: "#FFFFFF" },
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.label, { color: C.textSecondary }]}>Production Cost</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: C.background, color: C.textPrimary }]}
                  value={form.productionCost}
                  onChangeText={(text) => setForm({ ...form, productionCost: text })}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={C.textSecondary}
                />

                <Text style={[styles.label, { color: C.textSecondary }]}>Selling Price</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: C.background, color: C.textPrimary }]}
                  value={form.sellingPrice}
                  onChangeText={(text) => setForm({ ...form, sellingPrice: text })}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={C.textSecondary}
                />

                <Text style={[styles.label, { color: C.textSecondary }]}>Stock Count</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: C.background, color: C.textPrimary }]}
                  value={form.stock}
                  onChangeText={(text) => setForm({ ...form, stock: text })}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor={C.textSecondary}
                />
              </>
            )}
          </ScrollView>

          {/* Footer buttons */}
          <View style={styles.footer}>
            <TouchableOpacity style={[styles.cancelButton, { backgroundColor: C.background }]} onPress={onClose}>
              <Text style={[styles.cancelText, { color: C.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.saveButton, { backgroundColor: C.primary }]} onPress={handleSave}>
              <Text style={styles.saveText}>{saveLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: SIZES.padding,
    paddingTop: 20,
    paddingBottom: 32,
    maxHeight: "85%",
  },
  title: {
    fontSize: SIZES.fontTitle,
    fontWeight: "700",
    marginBottom: 20,
  },
  stockInfo: {
    fontSize: SIZES.fontBody,
    marginBottom: 16,
  },
  label: {
    fontSize: SIZES.fontCaption,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: SIZES.fontBody,
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryPillText: {
    fontSize: SIZES.fontCaption,
    fontWeight: "500",
  },
  // Multi-image styles
  imageSection: {
    marginBottom: 8,
  },
  imageList: {
    gap: 10,
    paddingVertical: 4,
  },
  imageThumbWrapper: {
    position: "relative",
    width: 88,
    height: 88,
    borderRadius: 12,
    overflow: "hidden",
  },
  imageThumb: {
    width: 88,
    height: 88,
  },
  removeImageBtn: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 11,
  },
  primaryBadge: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 2,
    alignItems: "center",
  },
  primaryBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  addImageBtn: {
    width: 88,
    height: 88,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderStyle: "dashed",
  },
  addImageText: {
    fontSize: 11,
    marginTop: 4,
  },
  noteBox: {
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  noteText: {
    fontSize: SIZES.fontCaption,
    lineHeight: 18,
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelText: {
    fontSize: SIZES.fontBody,
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  saveText: {
    fontSize: SIZES.fontBody,
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
