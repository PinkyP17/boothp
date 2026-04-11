import { useState, useEffect } from 'react';
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
} from 'react-native';
import { COLORS, SIZES } from '../constants/theme';
import { CATEGORIES } from '../data/mockData';

const editableCategories = CATEGORIES.filter((c) => c !== 'All');

const emptyForm = {
  name: '',
  category: 'Prints',
  productionCost: '',
  sellingPrice: '',
  stock: '',
};

export default function InventoryItemModal({ visible, onClose, onSave, item, mode }) {
  const [form, setForm] = useState(emptyForm);
  const [restockQty, setRestockQty] = useState('');
  const [restockCost, setRestockCost] = useState('');

  useEffect(() => {
    if (mode === 'add') {
      setForm(emptyForm);
    } else if (mode === 'edit' && item) {
      setForm({
        name: item.name,
        category: item.category,
        productionCost: item.productionCost.toString(),
        sellingPrice: item.sellingPrice.toString(),
        stock: item.stock.toString(),
      });
    } else if (mode === 'restock') {
      setRestockQty('');
      setRestockCost('');
    }
  }, [visible, mode, item]);

  const title = mode === 'add' ? 'Add Item' : mode === 'edit' ? 'Edit Item' : `Restock ${item?.name}`;
  const saveLabel = mode === 'add' ? 'Add' : mode === 'edit' ? 'Save' : 'Restock';

  const handleSave = () => {
    if (mode === 'restock') {
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
      });
    }
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modal}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>{title}</Text>

            {mode === 'restock' ? (
              <>
                <Text style={styles.stockInfo}>Current stock: {item?.stock}</Text>

                <Text style={styles.label}>Quantity to Add</Text>
                <TextInput
                  style={styles.input}
                  value={restockQty}
                  onChangeText={setRestockQty}
                  keyboardType="number-pad"
                  placeholder="e.g. 50"
                  placeholderTextColor={COLORS.textSecondary}
                />

                <Text style={styles.label}>Total Cost for This Batch</Text>
                <TextInput
                  style={styles.input}
                  value={restockCost}
                  onChangeText={setRestockCost}
                  keyboardType="decimal-pad"
                  placeholder="e.g. 75.00"
                  placeholderTextColor={COLORS.textSecondary}
                />

                <View style={styles.noteBox}>
                  <Text style={styles.noteText}>
                    This will be logged as a Production/Restock expense.
                  </Text>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.label}>Item Name</Text>
                <TextInput
                  style={styles.input}
                  value={form.name}
                  onChangeText={(text) => setForm({ ...form, name: text })}
                  placeholder="e.g. Gojo Print A4"
                  placeholderTextColor={COLORS.textSecondary}
                />

                <Text style={styles.label}>Category</Text>
                <View style={styles.categoryRow}>
                  {editableCategories.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.categoryPill, form.category === cat && styles.categoryPillSelected]}
                      onPress={() => setForm({ ...form, category: cat })}
                    >
                      <Text style={[styles.categoryPillText, form.category === cat && styles.categoryPillTextSelected]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.label}>Production Cost</Text>
                <TextInput
                  style={styles.input}
                  value={form.productionCost}
                  onChangeText={(text) => setForm({ ...form, productionCost: text })}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={COLORS.textSecondary}
                />

                <Text style={styles.label}>Selling Price</Text>
                <TextInput
                  style={styles.input}
                  value={form.sellingPrice}
                  onChangeText={(text) => setForm({ ...form, sellingPrice: text })}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={COLORS.textSecondary}
                />

                <Text style={styles.label}>Stock Count</Text>
                <TextInput
                  style={styles.input}
                  value={form.stock}
                  onChangeText={(text) => setForm({ ...form, stock: text })}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor={COLORS.textSecondary}
                />
              </>
            )}
          </ScrollView>

          {/* Footer buttons */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
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
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: SIZES.padding,
    paddingTop: 20,
    paddingBottom: 32,
    maxHeight: '85%',
  },
  title: {
    fontSize: SIZES.fontTitle,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 20,
  },
  stockInfo: {
    fontSize: SIZES.fontBody,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  label: {
    fontSize: SIZES.fontCaption,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: SIZES.fontBody,
    color: COLORS.textPrimary,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.background,
  },
  categoryPillSelected: {
    backgroundColor: COLORS.primary,
  },
  categoryPillText: {
    fontSize: SIZES.fontCaption,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  categoryPillTextSelected: {
    color: '#FFFFFF',
  },
  noteBox: {
    backgroundColor: COLORS.primary + '10',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  noteText: {
    fontSize: SIZES.fontCaption,
    color: COLORS.primary,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: SIZES.fontBody,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  saveText: {
    fontSize: SIZES.fontBody,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
