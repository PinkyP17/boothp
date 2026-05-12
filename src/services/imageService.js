import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";

const IMAGE_DIR = FileSystem.documentDirectory + "item_images/";

async function ensureDirectory() {
  const info = await FileSystem.getInfoAsync(IMAGE_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(IMAGE_DIR, { intermediates: true });
  }
}

export async function pickImage(source = "gallery") {
  const launchFn =
    source === "camera"
      ? ImagePicker.launchCameraAsync
      : ImagePicker.launchImageLibraryAsync;

  const result = await launchFn({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (result.canceled) return null;
  return result.assets[0].uri;
}

export async function saveImageLocally(tempUri, itemId) {
  await ensureDirectory();

  const manipulated = await ImageManipulator.manipulateAsync(
    tempUri,
    [{ resize: { width: 800 } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
  );

  const filename = `item_${itemId}_${Date.now()}.jpg`;
  const destUri = IMAGE_DIR + filename;

  await FileSystem.copyAsync({ from: manipulated.uri, to: destUri });
  return destUri;
}

export async function deleteImage(uri) {
  if (!uri) return;
  const info = await FileSystem.getInfoAsync(uri);
  if (info.exists) {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  }
}

export async function imageExists(uri) {
  if (!uri) return false;
  const info = await FileSystem.getInfoAsync(uri);
  return info.exists;
}
