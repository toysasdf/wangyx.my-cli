<template>
  <el-form ref="formRef" :model="formData" :rules="rules" label-width="120px">
    <template v-for="item in config" :key="item.prop">
      <el-form-item :label="item.label" :prop="item.prop" :rules="item.rules">
        <!-- 动态组件渲染 -->
        <component
          :is="componentMap[item.type]"
          v-model="formData[item.prop]"
          v-bind="item.attrs"
          :placeholder="item.placeholder"
          :options="item.options"
        >
          <!-- 处理select选项 -->
          <el-option
            v-if="item.type === 'select'"
            v-for="opt in item.options"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </component>
      </el-form-item>
    </template>

    <el-form-item>
      <el-button type="primary" @click="submitForm">提交</el-button>
    </el-form-item>
  </el-form>
</template>

<script setup>
import { ref, reactive, defineProps, defineEmits } from "vue";
import {
  ElInput,
  ElSelect,
  ElOption,
  ElDatePicker,
  ElSwitch,
} from "element-plus";
const props = defineProps({
  config: {
    // 表单配置
    type: Array,
    required: true,
    default: () => [],
  },
});
const emit = defineEmits(["submit"]);
// 组件映射表
const componentMap = {
  input: ElInput,
  select: ElSelect,
  date: ElDatePicker,
  switch: ElSwitch,
};
// 动态生成表单数据
const formData = reactive({});
const rules = reactive({});

// 初始化数据和规则
props.config.forEach((item) => {
  formData[item.prop] = item.defaultValue ?? "";
  if (item.rules) {
    rules[item.prop] = item.rules.map((rule) => ({
      trigger: "blur",
      ...rule,
    }));
  }
});
// 表单引用
const formRef = ref(null);
// 提交处理
const submitForm = async () => {
  try {
    await formRef.value.validate();
    emit("submit", formData);
  } catch (error) {
    console.log("表单验证失败", error);
  }
};
</script>
