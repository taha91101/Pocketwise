import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Alert, Platform } from 'react-native';

const RECEIPTS_DIR = `${FileSystem.documentDirectory || ''}receipts/`;

/**
 * Ensures the app-private receipts directory exists.
 */
export async function ensureReceiptsDirectory(): Promise<void> {
  if (Platform.OS === 'web' || !FileSystem.documentDirectory) return;
  try {
    const dirInfo = await FileSystem.getInfoAsync(RECEIPTS_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(RECEIPTS_DIR, { intermediates: true });
    }
  } catch (error) {
    console.warn('Failed to ensure receipts directory:', error);
  }
}

/**
 * Copies a source image URI to permanent app-private storage.
 */
export async function saveReceiptToAppStorage(sourceUri: string): Promise<string> {
  if (Platform.OS === 'web' || !FileSystem.documentDirectory) {
    return sourceUri;
  }
  try {
    await ensureReceiptsDirectory();
    const extension = sourceUri.split('.').pop()?.split('?')[0] || 'jpg';
    const filename = `receipt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${extension}`;
    const destinationUri = `${RECEIPTS_DIR}${filename}`;

    await FileSystem.copyAsync({
      from: sourceUri,
      to: destinationUri,
    });

    return destinationUri;
  } catch (error) {
    console.warn('Failed to copy receipt to private storage, falling back to original URI:', error);
    return sourceUri;
  }
}

/**
 * Deletes a receipt file from app-private storage if it exists.
 */
export async function deleteReceiptFile(uri?: string): Promise<void> {
  if (!uri || Platform.OS === 'web' || !FileSystem.documentDirectory) return;
  try {
    if (uri.startsWith(RECEIPTS_DIR) || uri.startsWith(FileSystem.documentDirectory)) {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    }
  } catch (error) {
    console.warn('Failed to delete receipt file:', error);
  }
}

/**
 * Prompts user to pick an image from the device gallery.
 * Requests media library permission only on-demand.
 */
export async function pickReceiptFromGallery(): Promise<string | null> {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'PocketWise needs permission to access your photo gallery to attach receipts.'
      );
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions?.Images ?? 'images',
      allowsEditing: true,
      quality: 0.7,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const pickedUri = result.assets[0].uri;
    return await saveReceiptToAppStorage(pickedUri);
  } catch (error) {
    console.error('Error picking receipt from gallery:', error);
    Alert.alert('Error', 'Could not select image from gallery.');
    return null;
  }
}

/**
 * Prompts user to capture a photo with the device camera.
 * Requests camera permission only on-demand.
 */
export async function captureReceiptWithCamera(): Promise<string | null> {
  try {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'PocketWise needs permission to use your camera to photograph receipts.'
      );
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions?.Images ?? 'images',
      allowsEditing: true,
      quality: 0.7,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const photoUri = result.assets[0].uri;
    return await saveReceiptToAppStorage(photoUri);
  } catch (error) {
    console.error('Error capturing receipt from camera:', error);
    Alert.alert('Error', 'Could not capture photo from camera.');
    return null;
  }
}
