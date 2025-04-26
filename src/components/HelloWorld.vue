<template>
  <DynamicForm 
  :config="formConfig"
  @submit="handleSubmit"
/>
</template>
<script setup>
import DynamicForm from './DynamicForm/index.vue'
// 表单配置
const formConfig = ref([
  {
    type: 'input',
    label: '用户名',
    prop: 'username',
    placeholder: '请输入用户名',
    rules: [
      { required: true, message: '用户名不能为空' },
      { min: 3, max: 12, message: '长度在3到12个字符' }
    ]
  },
  {
    type: 'select',
    label: '城市',
    prop: 'city',
    options: [
      { label: '北京', value: 1 },
      { label: '上海', value: 2 },
      { label: '杭州', value: 3 },
    ]
  },
  {
    type: 'date',
    label: '入职日期',
    prop: 'date',
    attrs: {
      type: 'date',
      valueFormat: 'YYYY-MM-DD'
    }
  },
  {
    type: 'switch',
    label: '启用状态',
    prop: 'status',
    defaultValue: true
  }
])

// 提交处理
const handleSubmit = (formData) => {
  console.log('提交数据：', formData)
  alert(JSON.stringify(formData, null, 2))
}
</script>
<style scoped lang="scss">
</style>
