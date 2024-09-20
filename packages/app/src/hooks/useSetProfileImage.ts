import { trpc } from '@/lib/trpc';
import { useMutation } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

const useSetProfileImage = () => {
  const { mutateAsync: updateProfileImage } =
    trpc.updateProfileImage.useMutation();

  return useMutation({
    mutationFn: async () => {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
        base64: true,
      });

      if (!result.canceled) {
        const image = result.assets[0];

        const resizedImage = await ImageManipulator.manipulateAsync(
          image.uri,
          [{ resize: { width: 800 } }], // Resize to width of 800px, keeping aspect ratio
          {
            compress: 0.8,
            format: ImageManipulator.SaveFormat.JPEG,
            base64: true,
          } // Compress and save as JPEG
        );

        await updateProfileImage({
          mimeType: 'image/jpeg',
          imageBase64: resizedImage.base64,
        });
      }
    },
  });
};

export default useSetProfileImage;
