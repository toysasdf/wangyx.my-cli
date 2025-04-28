import { graphic } from "echarts";
export function useFormLinkage(formData, config) {
  const dependencies = new Map(); //通过哈希表来存储联动关系
  // 注册联动关系
  const registerLinkage = (source, target, handler) => {
    let isCycle = detectCycle(dependencies)
    if (isCycle) {
      throw new Error(`检测到循环依赖：${isCycle}，请检查你的表单配置`);
    }
    if (!dependencies.has(source)) {
      dependencies.set(source, new Set());
    }
    dependencies.get(source).add({ target, handler });
  };
  // 建立监听
  config.forEach((field) => {
    if (field.dependencies) {
      field.dependencies.dependsOn.forEach((source) => {
        registerLinkage(source, field.prop, field.handler); //这里handler是依赖的属性变化后如何获取最新的本属性值的回调函数
      });
    }
  });
  // 触发联动
  Object.keys(formData).forEach((key) => {
    watch(
      () => formData[key],
      (newVal) => {
        if (dependencies.has(key)) {
           dependencies.get(key).forEach(({ target, handler }) => {
            handler(newVal,key,formData); //根据新的值来通过formData改变依赖他的属性值
          });
        }
      }
    );
  });
}
//为了防止循环依赖 可以构建有向无环图
function detectCycle(dependencies) {
  const visited = new Set();
  const recStack = new Set();
  const dfs = (node) => {
    if (!dependencies.has(node)) {
      return false;
    }
    if (recStack.has(node)) {
      return node; // 当前路径上又遇到自己，出现了环
    }
    if (visited.has(node)) {
      return false; // 已经检查过且没问题
    }
    visited.add(node);
    recStack.add(node);

    for (const { target } of dependencies.get(node)) {
      if (dfs(target)) {
        return node;
      }
    }
    recStack.delete(node); // 退栈
    return false;
  };

  for (const node of dependencies.keys()) {
    if (dfs(node)) {
      return node;
    }
  }
  return false;
}
