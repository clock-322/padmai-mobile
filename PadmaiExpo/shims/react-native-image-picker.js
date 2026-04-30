// Shim that redirects react-native-image-picker to expo-image-picker
import * as ImagePicker from 'expo-image-picker';

export async function launchCamera(options) {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    return { didCancel: true, errorCode: 'permission', errorMessage: 'Camera permission denied' };
  }
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    quality: options?.quality ?? 0.8,
    allowsEditing: options?.allowsEditing ?? false,
  });
  if (result.canceled) {
    return { didCancel: true };
  }
  return {
    assets: result.assets.map((a) => ({
      uri: a.uri,
      type: a.mimeType || 'image/jpeg',
      fileName: a.fileName || 'photo.jpg',
      width: a.width,
      height: a.height,
    })),
  };
}

export async function launchImageLibrary(options) {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    return { didCancel: true, errorCode: 'permission', errorMessage: 'Media library permission denied' };
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: options?.quality ?? 0.8,
    allowsEditing: options?.allowsEditing ?? false,
  });
  if (result.canceled) {
    return { didCancel: true };
  }
  return {
    assets: result.assets.map((a) => ({
      uri: a.uri,
      type: a.mimeType || 'image/jpeg',
      fileName: a.fileName || 'photo.jpg',
      width: a.width,
      height: a.height,
    })),
  };
}
