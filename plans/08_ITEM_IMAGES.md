# Phase 8: Item Images (Device-Local)

## Context
Inventory items and POS tiles currently show only text (name, price, stock). Adding images helps the user (and customers browsing at the booth) quickly identify items. Since this app will be built as an APK and used at conventions with poor internet, images are stored locally on the device — no cloud hosting needed.

---

## Dependencies to Install

```bash
npx expo install expo-image-picker expo-file-system expo-image-manipulator
```

- `expo-image-picker` — camera and gallery access
- `expo-file-system` — save picked images to the app's permanent document directory
- `expo-image-manipulator` — resize/compress before saving (convention phone photos can be 5-10 MB)

## app.json Plugin Config

Add to `plugins` array:
```json
["expo-image-picker", {
  "photosPermission": "Allow $(PRODUCT_NAME) to access your photos for item images.",
  "cameraPermission": "Allow $(PRODUCT_NAME) to use the camera for item images."
}]
```

---

## New Files (2)

### 1. `src/services/imageService.js`

Utility module for image handling:

| Function | Purpose |
|----------|---------|
| `pickImage(source)` | Wraps `ImagePicker.launchImageLibraryAsync` or `launchCameraAsync`. Returns temp URI or `null` if cancelled. |
| `saveImageLocally(tempUri, itemId)` | Resizes to max 800px wide, JPEG 0.7 quality via `ImageManipulator`. Copies to `FileSystem.documentDirectory + 'item_images/item_<itemId>_<timestamp>.jpg'`. Returns permanent URI. |
| `deleteImage(uri)` | Deletes a file from the document directory (for when user replaces an image). |

### 2. `src/services/imageMapping.js`

Interim persistence for image URIs (until Phase 9 adds SQLite):

| Function | Purpose |
|----------|---------|
| `getImageMap()` | Reads and parses `documentDirectory + 'image_map.json'`. Returns `{}` if not found. |
| `setImageUri(itemId, uri)` | Updates the map and writes it back. |
| `removeImageUri(itemId)` | Removes an entry from the map. |

> **Note:** This file becomes obsolete once Phase 9 (Offline Mode) adds SQLite with an `image_uri` column.

---

## Modified Files (5)

### 3. `src/components/inventory/InventoryItemModal.js`

- Add `imageUri` field to `emptyForm` (default `null`)
- In add/edit mode, add image picker section **above** the "Item Name" field:
  - If `form.imageUri` exists: show `<Image>` with a small "Change" overlay
  - If null: show a placeholder with camera icon + "Add Photo" text
  - On press: show two-button choice — "Take Photo" / "Choose from Gallery"
  - Call `pickImage()` → `saveImageLocally()` → set `form.imageUri`
- `handleSave`: include `imageUri` in the data object passed to `onSave`
- Edit mode: pre-populate `form.imageUri` from `item.imageUri`

### 4. `src/components/inventory/InventoryItemCard.js`

- Import `Image` from react-native
- Add a 48x48 rounded thumbnail on the left side of the card, before the name
- If `item.imageUri` exists: `<Image source={{ uri: item.imageUri }} />`
- If no image: fallback to `cube-outline` Ionicon in a small container (current behavior)

### 5. `src/components/pos/POSItemTile.js`

- Import `Image` from react-native
- Add an image area at the top of the tile (~60px height, full width, `resizeMode="cover"`)
- If `item.imageUri` exists: render the image
- If no image: keep current layout unchanged (name + price, centered)
- Increase `minHeight` from 100 to ~140 to accommodate the image

### 6. `src/context/AppContext.js`

- In `addInventoryItem` and `updateInventoryItem`:
  - Strip `imageUri` from the data before sending to the backend API
  - After successful API response, re-attach `imageUri` to the response data before dispatching
  - Call `setImageUri(itemId, imageUri)` to persist the mapping
- In `loadInventory`:
  - After fetching from API, hydrate each item's `imageUri` from the image mapping

### 7. `app.json`

- Add `expo-image-picker` to plugins array with permission strings

---

## Data Flow

```
User picks image → pickImage() returns temp URI
    → saveImageLocally() resizes + saves to documentDirectory → permanent URI
    → URI stored on item in AppContext state
    → URI persisted in image_map.json (interim) or SQLite (Phase 9)
    → URI never sent to backend (stripped from API requests)
    → On inventory load: items hydrated from image mapping
```

---

## Backend

**No backend changes needed.** Images are device-local only. The `InventoryItem` entity and DTO stay the same.

---

## Implementation Order

1. Install dependencies + update `app.json` plugins
2. Create `src/services/imageService.js`
3. Create `src/services/imageMapping.js`
4. Modify `InventoryItemModal.js` — add image picker UI
5. Modify `AppContext.js` — strip imageUri from API calls, hydrate from mapping on load
6. Modify `InventoryItemCard.js` — show thumbnails
7. Modify `POSItemTile.js` — show images in grid tiles
8. Test on physical device (camera permission requires real device or dev build)

---

## Edge Cases

- **Permission denied**: `expo-image-picker` returns `{ canceled: true }`. Show an alert explaining why the permission is needed.
- **Large images**: Manipulator resizes to 800px, JPEG 0.7 → keeps files under ~200KB each.
- **Image file missing**: User clears app data or file gets deleted. Check with `FileSystem.getInfoAsync` before rendering; fall back to placeholder if gone.
- **Multiple devices**: Images are device-local. Logging in on a different device shows no images. Acceptable per requirements.
- **Item deleted**: If item deletion is ever added, call `deleteImage()` + `removeImageUri()` to clean up.

---

## Verification

1. Open Inventory → tap FAB → add item with photo from gallery → image shows on card
2. Edit existing item → change photo → thumbnail updates
3. Add item with camera → photo saves and displays
4. Go to POS tab → items with images show image in tile; items without show text-only
5. Close and reopen app → images still show (persisted via image_map.json)
6. Check backend API response → no imageUri field sent to server
