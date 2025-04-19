import cache from '@/plugins/cache'
export function getKeyByLocal (){
  return cache.local.get('pubKey') //获取存储在localstorage中的公钥
}
export function setKeyInLocal(pubKey){
  cache.local.set('pubKey',pubKey)
}