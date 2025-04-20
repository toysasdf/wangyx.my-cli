import axios from 'axios'
import { getTokenInlocal,setTokenInLocal,setRefreshToken} from './auth'
import {getRefreshToken} from '@/api/login.js'
import { ElNotification , ElMessageBox, ElMessage, ElLoading } from 'element-plus'
import {handleParams,blobValidate} from '.tool'
import errorCode from '@/utils/errorCode'
import cache from '@/plugins/cache'
import saveAs from 'file-saver'
import useUserStore from '@/store/modules/user'
const baseURL = import.meta.env.VITE_API_BASE_URL  //运行环境配置BASE_API_URL
//定义一个变量: isRefreshTokening用来判断是否正在请求新token
let isRefreshTokening = false;
//定义一个队列: watingQueue存放刷新token期间,由于token过期产生的新出错请求
let watingQueue = []


let downloadLoadingInstance;
// 是否显示重新登录
export let isRelogin = { show: false };
//配置默认请求头 数据格式
axios.defaults.headers['Content-Type'] = 'application/json;chartset=utf-8'
//创建axios实例
const service = axios.create({
  baseUrl: import.meta.env.VITE_API_BASE_URL, //表示所有url请求的公共部分
  timeout:10000
})
//首先配置axios拦截器 
//请求拦截器 实现无感刷新
axios.interceptors.request.use(config =>{
  //请求是否需要设置token 如果请求头配置了isToken=false 表示需要禁用token 这里的token变量就为true
  const isToken = (config.headers || {}).isToken === false
  //是否防止数据重复提交 如果请求头里面的repeatCommit为true 那么就需要禁止重复请求提交 isRepeatCommit为true
  const isRepeatCommit = (config.headers || {}).repeatCommit === false
  if(getTokenInlocal()&&!isToken){//access_token存在并且没有禁用token
    //检验access token  
    if(config.url!=='/api/refreshToken'){//不是请求刷新token 那么就带上access_token
      config.headers['Authorization'] = 'Bearer' + getTokenInlocal() //携带上access_token 存储在localstorage中
    }else{//是请求刷新token 需要带上refresh_token 存储在http only cookie 里面 自动携带 需要处理跨域
       config.withCredentials =  true
    }
  }
  //下面处理分类请求
  if(config.method==='get'&&config.params){
    let url = config.url + '?' + handleParams(config.params)
    url = url.slice(0, -1);
    config.params = {};
    config.url = url;
  }
  //处理post和put请求
  if (!isRepeatCommit && (config.method === 'post' || config.method === 'put')) {
    const requestObj = {
      url: config.url,
      data: typeof config.data === 'object' ? JSON.stringify(config.data) : config.data,
      time: new Date().getTime()
    }
    const requestSize = Object.keys(JSON.stringify(requestObj)).length; // 请求数据大小
    const limitSize = 5 * 1024 * 1024; // 限制存放数据5M
    if (requestSize >= limitSize) {
      console.warn(`[${config.url}]: ` + '请求数据大小超出允许的5M限制，无法进行防重复提交验证。')
      return config;
    }
    const sessionObj = cache.session.getJSON('sessionObj')
    if (sessionObj === undefined || sessionObj === null || sessionObj === '') {
      cache.session.setJSON('sessionObj', requestObj)
    } else {
      const s_url = sessionObj.url;                // 请求地址
      const s_data = sessionObj.data;              // 请求数据
      const s_time = sessionObj.time;              // 请求时间
      const interval = 1000;                       // 间隔时间(ms)，小于此时间视为重复提交
      if (s_data === requestObj.data && requestObj.time - s_time < interval && s_url === requestObj.url) {
        const message = '数据正在处理，请勿重复提交';
        console.warn(`[${s_url}]: ` + message)
        return Promise.reject(new Error(message))
      } else {
        cache.session.setJSON('sessionObj', requestObj)
      }
    }
  }
  return config
}, error => {
    console.log(error)
    Promise.reject(error)
})
//响应拦截器
axios.interceptors.response.use(async res => {
  // 未设置状态码则默认成功状态
  const code = res.data.code || 200;
  // 获取错误信息
  const msg = errorCode[code] || res.data.msg || errorCode['default']
  // 二进制数据则直接返回
  if (res.request.responseType ===  'blob' || res.request.responseType ===  'arraybuffer') {
    return res.data
  }
  if(res.config.headers['isCheckData']){
      if(code===200){
        return Promise.resolve(res.data)
      }
      if(code===500){
        return Promise.reject(new Error())
      }
      //后边的逻辑与检查数据源类型请求无关
  }
  if (code === 401) { //响应处理无感刷新
    if(res.config.url!=='/api/refreshToken'){ //表明access_token已经过期但是还没有刷新token
       return await silentTokenRefresh(res.config); //这里把配置传进去
    }else{
     //如果刷新token的请求也是401 证明refresh_token过期了 只能重新登陆
     if (!isRelogin.show) {
       isRelogin.show = true;
       ElMessageBox.confirm('登录状态已过期，您可以继续留在该页面，或者重新登录', '系统提示', { confirmButtonText: '重新登录', cancelButtonText: '取消', type: 'warning' }).then(() => {
         isRelogin.show = false;
         useUserStore().logOut().then(() => {
           location.href = '/index';
         })
     }).catch(() => {
       isRelogin.show = false;
     });
   }
    return Promise.reject('无效的会话，或者会话已过期，请重新登录。')
    }
   } else if (code === 500) {
     ElMessage({ message: msg, type: 'error' })
     return Promise.reject(new Error(msg))
   } else if (code === 601) {
     ElMessage({ message: msg, type: 'warning' })
     return Promise.reject(new Error(msg))
   } else if (code !== 200) {
     ElNotification.error({ title: msg })
     return Promise.reject('error')
   } else {
     return Promise.resolve(res.data)
   }
},
error => {
  let { message } = error;
  if (message == "Network Error") {
    message = "后端接口连接异常";
  } else if (message.includes("timeout")) {
    message = "系统接口请求超时";
  } else if (message.includes("Request failed with status code")) {
    message = "系统接口" + message.substr(message.length - 3) + "异常";
  }
  ElMessage({ message: message, type: 'error', duration: 5 * 1000 })
  return Promise.reject(error)
}
)
// 通用下载方法
export function download(url, params, filename, config) {
  downloadLoadingInstance = ElLoading.service({ text: "正在下载数据，请稍候", background: "rgba(0, 0, 0, 0.7)", })
  return service.post(url, params, {
    transformRequest: [(params) => { return handleParams(params) }],
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    responseType: 'blob',
    ...config
  }).then(async (data) => {
    const isBlob = blobValidate(data);
    if (isBlob) {
      const blob = new Blob([data])
      saveAs(blob, filename)
    } else {
      const resText = await data.text();
      const rspObj = JSON.parse(resText);
      const errMsg = errorCode[rspObj.code] || rspObj.msg || errorCode['default']
      ElMessage.error(errMsg);
    }
    downloadLoadingInstance.close();
  }).catch((r) => {
    console.error(r)
    ElMessage.error('下载文件出现错误，请联系管理员！')
    downloadLoadingInstance.close();
  })
}
//刷新token
async function silentTokenRefresh(config){
  if (!isRefreshTokening) { // 还没有开始刷新 直接刷新
    return await startRefresh(config);
  }
  return waitingRefresh(config);
}
function waitingRefresh(config) {
  return new Promise(resolve => {
    watingQueue.push({ config, resolve });
  });
}
async function startRefresh(config) {
  await refreshToken(); // 请求新的token
  tryWatingRequest();
  return service(config); //第一个发现token失效的请求,直接重新发送
}
// 请求新token,并更新本地
async function refreshToken() {
  isRefreshTokening = true;
  const [data, err] = await getRefreshToken();
  if (err) return;
  const { token, refreshToken } = data;
  setTokenInLocal(token);
  setRefreshToken(refreshToken);
  isRefreshTokening = false;
}
// 重新发送由于token过期存储的请求
function tryWatingRequest() {
  while (watingQueue.length > 0) {
    const { config, resolve } = watingQueue.shift();
    resolve(service(config));
  }
}
export default service //常规请求
