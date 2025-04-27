<template>
  <DynamicForm 
  :config="userFormConfig" 
  @submit="handleSubmit"
/>
</template>
<script setup>
import DynamicForm from './DynamicForm/index.vue'
import {userFormConfig} from '@/utils/formConfig.js'//导入表单配置 
// 提交处理
const handleSubmit = (formData) => {
  console.log('提交数据：', formData)
  alert(JSON.stringify(formData, null, 2))
}
</script>
<style scoped lang="scss">
</style>
