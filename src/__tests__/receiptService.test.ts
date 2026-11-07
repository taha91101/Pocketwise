import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import {
  saveReceiptToAppStorage,
  deleteReceiptFile,
  pickReceiptFromGallery,
  captureReceiptWithCamera,
} from '../services/receiptService';

describe('ReceiptService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveReceiptToAppStorage', () => {
    it('copies the source image to the receipts directory and returns the new URI', async () => {
      const source = 'file:///temp/camera/photo.jpg';
      const result = await saveReceiptToAppStorage(source);

      expect(FileSystem.copyAsync).toHaveBeenCalledWith({
        from: source,
        to: expect.stringContaining('file:///mock/documents/receipts/receipt_'),
      });
      expect(result).toContain('file:///mock/documents/receipts/receipt_');
      expect(result.endsWith('.jpg')).toBe(true);
    });
  });

  describe('deleteReceiptFile', () => {
    it('deletes the file if it resides in documentDirectory or receipts', async () => {
      const validUri = 'file:///mock/documents/receipts/receipt_123.jpg';
      await deleteReceiptFile(validUri);

      expect(FileSystem.deleteAsync).toHaveBeenCalledWith(validUri, { idempotent: true });
    });

    it('does not delete if URI is empty or not in documentDirectory', async () => {
      await deleteReceiptFile(undefined);
      expect(FileSystem.deleteAsync).not.toHaveBeenCalled();

      await deleteReceiptFile('https://example.com/external.jpg');
      expect(FileSystem.deleteAsync).not.toHaveBeenCalled();
    });
  });

  describe('pickReceiptFromGallery', () => {
    it('returns saved URI when permission is granted and user selects an image', async () => {
      (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: 'granted',
      });
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValueOnce({
        canceled: false,
        assets: [{ uri: 'file:///gallery/selected.png' }],
      });

      const uri = await pickReceiptFromGallery();
      expect(uri).toContain('file:///mock/documents/receipts/receipt_');
      expect(FileSystem.copyAsync).toHaveBeenCalled();
    });

    it('returns null if permission is denied', async () => {
      (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: 'denied',
      });

      const uri = await pickReceiptFromGallery();
      expect(uri).toBeNull();
      expect(ImagePicker.launchImageLibraryAsync).not.toHaveBeenCalled();
    });

    it('returns null if user cancels picker', async () => {
      (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: 'granted',
      });
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValueOnce({
        canceled: true,
        assets: [],
      });

      const uri = await pickReceiptFromGallery();
      expect(uri).toBeNull();
    });
  });

  describe('captureReceiptWithCamera', () => {
    it('returns saved URI when permission is granted and user snaps a photo', async () => {
      (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: 'granted',
      });
      (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValueOnce({
        canceled: false,
        assets: [{ uri: 'file:///camera/snapped.jpg' }],
      });

      const uri = await captureReceiptWithCamera();
      expect(uri).toContain('file:///mock/documents/receipts/receipt_');
      expect(FileSystem.copyAsync).toHaveBeenCalled();
    });

    it('returns null if camera permission is denied', async () => {
      (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: 'denied',
      });

      const uri = await captureReceiptWithCamera();
      expect(uri).toBeNull();
      expect(ImagePicker.launchCameraAsync).not.toHaveBeenCalled();
    });
  });
});
