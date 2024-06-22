import { User, userConverter } from '@cred-chat/shared';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Firestore, collection, doc, getDoc } from 'firebase/firestore';

const getUserFromCache = async (fid: number): Promise<User | null> => {
  const data = await AsyncStorage.getItem(`user:${fid}`);

  if (!data) {
    return null;
  } else {
    return JSON.parse(data);
  }
};

const saveUserToCache = async (fid: number, user: User) => {
  await AsyncStorage.setItem(`user:${fid}`, JSON.stringify(user));
};

export const getUser = async (db: Firestore, fid: number): Promise<User> => {
  const userInCache = await getUserFromCache(fid);
  if (userInCache) {
    console.log(`Found user ${userInCache.fid} in cache`);
    return userInCache;
  } else {
    const usersCollection = collection(db, 'users').withConverter(
      userConverter
    );

    const docRef = doc(usersCollection, fid.toString());

    const userDoc = await getDoc(docRef);
    const user = userDoc.data();
    console.log(`Found usr ${user.fid} in server`);

    if (!user) {
      throw new Error('User not found');
    }

    await saveUserToCache(fid, user);

    return user;
  }
};
