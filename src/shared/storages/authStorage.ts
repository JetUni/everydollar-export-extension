import { BaseStorage, createStorage, StorageType } from '@src/shared/storages/base';

export interface UserData {
  email: string;
  firstName: string;
  lastName: string;
  userId: string;
  userToken: string;
}

const storage = createStorage<UserData>('auth-storage', undefined, {
  storageType: StorageType.Local,
});

const userDataStorage: BaseStorage<UserData> = storage;

export default userDataStorage;
