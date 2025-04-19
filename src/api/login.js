import request from "@/utils/request";
//获取公钥
export function getPubKey(){
  return request({
    url:'/api/publicKey',
    headers: {
      isToken: false //这里禁用token
    },
    method:'get',
  })
};
//刷新token
export function getRefreshToken(){
  return request({
    url:'/api/refreshToken',
    method:'get',
  })
}
// 登录方法
export function login(username, password, code, uuid) {
  const data = {
    username,
    password,
    code,
    uuid
  }
  return request({
    url: '/login',
    headers: {
      isToken: false,
      repeatCommit: false
    },
    method: 'post',
    data: data
  })
}

// 注册方法
export function register(data) {
  return request({
    url: '/register',
    headers: {
      isToken: false
    },
    method: 'post',
    data: data
  })
}

// 获取用户详细信息
export function getInfo() {
  return request({
    url: '/getInfo',
    method: 'get'
  })
}

// 退出方法
export function logout() {
  return request({
    url: '/logout',
    method: 'post'
  })
}

// 获取验证码
export function getCodeImg() {
  return request({
    url: '/captchaImage',
    headers: {
      isToken: false
    },
    method: 'get',
    timeout: 20000
  })
}
/**
  * 平台带着tonken进行登录
  *
  * @param queryParam
  * @returns {*}
  */
 export function getLoginByJHaveToken(queryParam) {
   return request({
     url: '/verify',
     method: 'get',
     params: queryParam
   })
 }