import axios from 'axios'
import { getToken } from './auth'
const baseURL = import.meta.env.VITE_API_BASE_URL  //运行环境配置BASE_API_URL

//配置默认请求头 数据格式
axios.defaults.headers['Content-Type'] = 'application/json;chartset=utf-8'
//创建axios实例
const service = axios.create({
  baseUrl: import.meta.env.VITE_API_BASE_URL, //表示所有url请求的公共部分
  timeout:10000
})

//首先配置axios拦截器
axios.interceptors.request.use(config =>{
  //请求是否需要设置token 如果请求头配置了isToken=false 表示需要禁用token 这里的token变量就为true
  const isToken = (config.headers || {}).isToken === false
  //是否防止数据重复提交 如果请求头里面的repeatCommit为false 那么就需要禁止重复请求提交 preventRepeatCommit为true
  const preventRepeatCommit = (config.headers || {}).repeatCommit === false
  if(getToken()&&!isToken){//token存在并且没有禁用token
     config.headers['Authorization'] = 'Bearer' + getToken() //携带上自定义token
  }

  //下面处理分类请求
  if(config.method==='get'&&config.params){
    let url = config.url + '?' + ''
  }
})