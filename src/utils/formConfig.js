//表单配置文件
import {debounce} from '@/utils/tool.js'
export const userFormConfig = [
  {
    type: 'select',
    label: '用户类型',
    prop: 'userType',
    defaultValue: 1,
    options: [
      { label: '个人用户', value: 1 },
      { label: '企业用户', value: 2 }
    ]
  },
  {
    type: 'input',
    label: '企业名称',
    prop: 'company',
    dependencies: {
      dependsOn: ['userType'],
      visibleWhen: 'data.userType === 2'
    },
    rules: [
      { required: true, message: '企业名称不能为空' }
    ],
    handler:debounce((newVal,key,formData)=>{ //这里应该把哪个依赖的值触发响应传进来  handler函数里面可以做复杂的业务处理
         console.log('触发响应了',key)
    },300)//如果有多个依赖的字段可以用这个函数统一处理 但是尽量避免多个字段的依赖 逻辑复杂 难以维护
  },
  {
    type: 'select',
    label: '所在省份',
    prop: 'province',
    options: [
      { label: '江苏省', value: '32' },
      { label: '浙江省', value: '33' }
    ],
  },
  {
    type: 'select',
    label: '所在城市',
    prop: 'city',
    dependencies: {
      dependsOn: ['province'],
      url: '/api/cities',
      dynamicRules: [
        {
          required: true,
          message: '请选择城市',
          validator: 'form.province !== ""'
        }
      ]
    },
    handler:debounce((newVal,key,formData)=>{ //这里应该把哪个依赖的值触发响应传进来  handler函数里面可以做复杂的业务处理
      console.log('触发响应了',key)
 },300)
  }
]