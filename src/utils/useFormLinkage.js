export function useFormLinkage(formData, config) {
  const dependencies = new Map(); //通过哈希表来存储联动关系
  // 注册联动关系
  const registerLinkage = (source, target, handler) => {
    if (hasCycle(source, target, dependencies)) {
      throw new Error(`检测到循环依赖：${source} -> ${target}，请检查你的表单配置`);
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
  console.log(dependencies);
}
//为了防止循环依赖 可以构建有向无环图
function detectCycle(dependencies) {
  const graph = {}; // 邻接表
  const indegree = {}; // 入度表
  // 初始化
  for (const key in dependencies) {
    graph[key] = dependencies[key] || [];
    indegree[key] = 0;
  }
  // 计算入度
  for (const key in graph) {
    for (const neighbor of graph[key]) {
      indegree[neighbor] = (indegree[neighbor] || 0) + 1;
    }
  }
  // 找入度为0的节点
  const queue = Object.keys(indegree).filter(key => indegree[key] === 0);

  let visitedCount = 0;

  while (queue.length) {
    const node = queue.shift();
    visitedCount++;

    for (const neighbor of graph[node]) {
      indegree[neighbor]--;
      if (indegree[neighbor] === 0) {
        queue.push(neighbor);
      }
    }
  }
  // 如果访问的节点数 !== 总节点数，说明有环
  return visitedCount !== Object.keys(dependencies).length;
}