import JSEncrypt from "jsencrypt";
import { setKeyInLocal, getKeyByLocal } from './keyAndToken';
import {getPubKey} from '@/api/login.js'
export const getRsaKey = async () => {
  const key = getKeyByLocal();
  if (['undefined', null, undefined].includes(key)) {
    const [data, err] = await getPubKey();
    if (err) return;
    setKeyInLocal(data.pub_key);
    return data.pub_key;
  }
  return key;
};
//加密方法
export const encryptParam = async (param) => {
  const key = await getRsaKey();
  const encryptor = new JSEncrypt();
  encryptor.setPublicKey(key);
  return encryptor.encrypt(JSON.stringify(param));
};