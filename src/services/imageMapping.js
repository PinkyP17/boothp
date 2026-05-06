import * as FileSystem from "expo-file-system";

const MAP_PATH = FileSystem.documentDirectory + "image_map.json";

export async function getImageMap() {
  try {
    const info = await FileSystem.getInfoAsync(MAP_PATH);
    if (!info.exists) return {};
    const content = await FileSystem.readAsStringAsync(MAP_PATH);
    return JSON.parse(content);
  } catch {
    return {};
  }
}

export async function setImageUri(itemId, uri) {
  const map = await getImageMap();
  map[itemId] = uri;
  await FileSystem.writeAsStringAsync(MAP_PATH, JSON.stringify(map));
}

export async function removeImageUri(itemId) {
  const map = await getImageMap();
  delete map[itemId];
  await FileSystem.writeAsStringAsync(MAP_PATH, JSON.stringify(map));
}
