import Cookies from 'js-cookie'
const TokenKey = 'Admin-Token'
//给个默认的token配置
// 默认配置
const DEFAULT_COOKIE_CONFIG = {
  expires: 7,             // 默认7天过期（单位：天）
  sameSite: 'Strict'      // 防止CSRF
}
//获取token
export function getToken (){
  return Cookies.get(tokenKey)
}
//设置token
export function setToken(token,config){
    const mergedConfig = {
      ...config,
      ...DEFAULT_COOKIE_CONFIG
    }
    //这里需要对expires进行转换
     // 自动转换天数到 Date 对象
  if (typeof mergedConfig.expires === 'number') {
    mergedConfig.expires = new Date(
      Date.now() + mergedConfig.expires * 86400e3 // 将天数转换为毫秒
    )
  }
  Cookies.set(TokenKey, token, mergedConfig)
}
//删除token
export function removeToken(){
  Cookies.remove(TokenKey)
}

