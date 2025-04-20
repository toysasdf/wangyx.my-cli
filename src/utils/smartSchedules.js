import { mySetInterval } from "./tool";
import request from "./request";
//优先级权重配置
const Priority = {
  EMERGENCY: "EMERGENCY", //紧急事务
  FREQUENT: "FREQUENT", //高频操作
  BATCH: "BATCH", //批量操作
}; //对象不可更改

//请求最大并发数
const concurrencyLimits = {
  EMERGENCY: 10,
  FREQUENT: 5,
  BATCH: 2,
};
const activeCounts = {
  EMERGENCY: 0,
  FREQUENT: 0,
  BATCH: 0,
};
//数据源类型
const DataSourceType = {
  API: "API",
  DB: "DATABASE",
  FILE: "FILE",
  WS: "WEBSOCKET",
  CACHE: "CACHE",
  THIRD_PARTY: "THIRD_PARTY",
};

//数据源可用状态
const DataSourceHealth = {
  primary: boolean, // 是否为主数据源（true 表示主数据源）
  lastChecked: number, // 上一次健康检查的时间（通常是时间戳，单位为毫秒）
  failureCount: number, // 连续失败的次数
};
//描述请求类型
// 请求元数据类型
const RequestMeta = {
  priority: Priority,
  dataSource: DataSourceType,
  retryCount: number,
  fallbackUsed: number,
};
class RequestScheduler {
  static instance = null;
  constructor(option) {
    //请求队列 优先级队列
    this.queues = new Map(); //根据priority字段来控制优先级
    this.concurrencyLimits = concurrencyLimits;
    this.activeCounts = activeCounts;
    Object.keys(Priority).forEach((item) => {
      this.queues.set(item, []); //给每个优先级一个队列
    });
    //数据源接口状态
    this.dataSourceHealth = new Map();
    this.initializeDataSources();
    this.startHealthChecks();
  }
  static getInstance() {
    if (!RequestScheduler.instance) {
      RequestScheduler.instance = new RequestScheduler();
    }
    return RequestScheduler.instance;
  }
  initializeDataSources() {
    Object.values(DataSourceType).forEach((type) => {
      this.dataSourceHealth.set(type, {
        primary: true,
        lastChecked: Date.now(), //这里把数据接口的健康检查时间设置为现在
        failureCount: 0,
      });
    });
  }
  //采用定时器检查数据源的健康状态 考虑到setInterval的bug 这里用setTimeout代替
  startHealthChecks() {
    mySetInterval(() => {
      this.dataSourceHealth.forEach((health, type) => {
        this.checkDataSource(type).catch(() => {
          health.failureCount++;
          if (health.failureCount > 3) {
            health.primary = false;
          }
        });
      });
    }, 5000); //轮询检查数据源的健康状态 5秒检查一次
  }
  //配置检查数据源的接口
  getHealthCheckConfig(type) {
    const checks = {
      [DataSourceType.API]: {
        url: "/api/health",
        headers: { isCheckData: true },
        method: "GET",
      },
      [DataSourceType.DB]: {
        url: "/db/health",
        headers: { isCheckData: true },
        method: "HEAD",
      },
      [DataSourceType.FILE]: {
        url: "/health.txt",
        headers: { isCheckData: true },
        method: "GET",
      },
      [DataSourceType.WS]: {
        url: "/ws/health",
        headers: { isCheckData: true },
        method: "GET",
      },
      [DataSourceType.CACHE]: {
        url: "/cache/health",
        headers: { isCheckData: true },
        method: "GET",
      },
      [DataSourceType.THIRD_PARTY]: {
        url: "/external/health",
        headers: { isCheckData: true },
        method: "GET",
      },
    };
    return checks[type];
  }
  //发送请求检查数据源
  async checkDataSource(type) {
    const healthCheckConfig = this.getHealthCheckConfig(type); //拿到检查数据源的请求配置 这里就给检查数据源的请求打个标签
    //便于在拦截器中区别对待
    request(healthCheckConfig).then(
      (res) => {
        this.dataSourceHealth.get(type).primary = true;
      },
      (error) => {
        this.dataSourceHealth.get(type).primary = false;
      }
    );
  }
  scheduleRequest(config, meta) {
    const promise = new Promise((resolve, reject) => {
      const wrappedRequest = async () => {
        try {
          const response = await this.executeRequest(config, meta);
          resolve(response);
        } catch (error) {
          if (meta.retryCount > 0) {
            meta.retryCount--;
            this.scheduleRequest(config, meta); //重试次数减一
          } else {
            reject(error);
          }
        }
      };
    });
    //请求封装好了之后自然需要按照优先级进行调度 push到对应的队列里面去
    const priority = meta.priority || Priority.BATCH; //确认请求的优先级
    const queue = this.queues.get(priority) || []; //拿到请求对应优先级的队列
    queue.push(wrappedRequest);
    this.queues.set(priority, queue);
    this.processQueues();
    return promise;
  }

  async executeRequest(config, meta) {
    const startTime = Date.now();
    try {
      const finalConfig = await this.applyDataSource(config, meta); //寻找数据源
      const response = await request(finalConfig);
      this.updateDataSourceHealth(meta.dataSource, true);
      return response;
    } catch (error) {
      this.updateDataSourceHealth(meta.dataSource, false);
      throw error;
    } finally {
      this.adjustConcurrency(Date.now() - startTime); //调整并发数量
    }
  }

  async applyDataSource(config, meta) {
    const health = this.dataSourceHealth.get(meta.dataSource);
    if (health.primary || meta.fallbackUsed) {
      //数据源健康或者启用了备用数据源
      return config;
    }
    //数据源不健康启用备用数据源
    const fallbackConfig = this.getFallbackConfig(meta.dataSource, config);
    meta.fallbackUsed = true;
    return fallbackConfig;
  }
  //统一切换备用数据源
  getFallbackConfig(type, originalConfig) {
    const strategies = {
      [DataSourceType.API]: {
        ...originalConfig,
        url: `/fallback${originalConfig.url}`,
      },
      [DataSourceType.DB]: {
        ...originalConfig,
        url: `/cache${originalConfig.url}`,
      },
      [DataSourceType.FILE]: {
        ...originalConfig,
        url: `/static${originalConfig.url}`,
      },
      [DataSourceType.WS]: {
        ...originalConfig,
        url: originalConfig.url?.toString().replace("ws://", "http://"),
      },
      [DataSourceType.CACHE]: {
        ...originalConfig,
        headers: { ...originalConfig.headers, "Cache-Only": "true" },
      },
      [DataSourceType.THIRD_PARTY]: {
        ...originalConfig,
        url: `/proxy${originalConfig.url}`,
      },
    };
    return strategies[type];
  }
  //请求完成之后变更数据源状态 如果请求失败次数过多 动态改变数据源的状态
  updateDataSourceHealth(type, success) {
    const health = this.dataSourceHealth.get(type);
    if (success) {
      health.failureCount = Math.max(0, health.failureCount - 1);
    } else {
      health.failureCount++;
      if (health.failureCount > 2) {
        health.primary = false;
      }
    }
  }
  //根据延迟来动态调整并发数量
  adjustConcurrency(latency) {
    if (latency > 1000) {
      this.concurrencyLimits[Priority.BATCH] = Math.max(
        1,
        this.concurrencyLimits[Priority.BATCH] - 1
      );
    } else if (latency < 200) {
      this.concurrencyLimits[Priority.EMERGENCY] = Math.min(
        20,
        this.concurrencyLimits[Priority.EMERGENCY] + 1
      );
    }
  }
  //处理队列里请求
  processQueues() {
    [Priority.EMERGENCY, Priority.FREQUENT, Priority.BATCH].forEach(
      (priority) => {
        const active = this.activeCounts.get(priority) || 0;
        const limit = this.concurrencyLimits[priority];
        const queue = this.queues.get(priority) || [];
        while (active < limit && queue.length > 0) {
          this.activeCounts.set(priority, active + 1);
          const task = queue.shift();
          task().finally(() => {
            this.activeCounts.set(
              priority,
              (this.activeCounts.get(priority) || 0) - 1
            );
            this.processQueues();
          });
        }
      }
    );
  }
}
const scheduler = new RequestScheduler(); //基本请求操作传给调度器使用
//需要智能调度的请求
export function scheduledRequest(config, meta = {}) {
  return scheduler.scheduleRequest(config, {
    retryCount: meta.retryCount ?? 2,
    priority: meta.priority ?? Priority.BATCH,
    dataSource: meta.dataSource ?? DataSourceType.API,
    fallbackUsed: false,
    ...meta,
  });
}
