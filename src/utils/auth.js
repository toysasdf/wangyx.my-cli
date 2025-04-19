import Cookies from "js-cookie";
import cache from '@/plugins/cache'
import { chain } from "lodash";
const TokenKey = "Access-Token";
//token存储在cookie里面
//之前token都是存储在cookie里面的 但是为了实现无感刷新 计划将access token存储在localstorage 里面 refresh_token存储在http-only cookie里面
//给个默认的token配置
// 默认配置
const DEFAULT_COOKIE_CONFIG = {
  expires:  15 * 60 * 1000 ,  //后面做无感刷新登录 access token仅仅给15分钟
  sameSite: "Strict", // 防止CSRF
};
//获取token
export function getToken() {
  return Cookies.get(tokenKey);
}
//设置token
export function setToken(token, config) {
  const mergedConfig = {
    ...config,
    ...DEFAULT_COOKIE_CONFIG,
  };
  //这里需要对expires进行转换
  // 自动转换天数到 Date 对象
  if (typeof mergedConfig.expires === "number") {
    mergedConfig.expires = new Date(Date.now() + mergedConfig.expires);
  }
  Cookies.set(TokenKey, token, mergedConfig);
}
//删除token
export function removeToken() {
  Cookies.remove(TokenKey);
}

//本项目应用的方案
//实现无感刷新 token通常存储在localstorage里面
//获取token
export function getTokenInlocal() {
  return cache.local.get(TokenKey);
}
//设置token
export function setTokenInlocal(token) {
 cache.local.set(TokenKey,token);
}
//删除token
export function removeTokenInlocal() {
  cache.local.remove(TokenKey);
}
//存储refresh_token在http only cookie中
export function setRefreshToken(token) {
  Cookies.set('Refresh_Token', token,{ httpOnly: true });
}