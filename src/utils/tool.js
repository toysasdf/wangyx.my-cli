/**
 * 参数处理
 * @param {*} params  参数
 */
export function handleParams(params) {
  let result = "";
  for (const propName of Object.keys(params)) {
    const value = params[propName];
    var part = encodeURIComponent(propName) + "=";
    if (value !== null && value !== "" && typeof value !== "undefined") {
      if (typeof value === "object") {
        for (const key of Object.keys(value)) {
          if (
            value[key] !== null &&
            value[key] !== "" &&
            typeof value[key] !== "undefined"
          ) {
            let params = propName + "[" + key + "]";
            var subPart = encodeURIComponent(params) + "=";
            result += subPart + encodeURIComponent(value[key]) + "&";
          }
        }
      } else {
        result += part + encodeURIComponent(value) + "&";
      }
    }
  }
  return result;
}
/**
 * 判断是否为blob格式
 * @param {string} data
 * @returns {Boolean}
 */
export function blobValidate(data) {
  return data.type !== "application/json";
}
/**
 * 判断value字符串是否为空
 * @param {string} value
 * @returns {Boolean}
 */
export function isEmpty(value) {
  if (
    value == null ||
    value == "" ||
    value == undefined ||
    value == "undefined"
  ) {
    return true;
  }
  return false;
}

/**
 * 判断url是否是http或https
 * @param {string} url
 * @returns {Boolean}
 */
export function isHttp(url) {
  return url.indexOf("http://") !== -1 || url.indexOf("https://") !== -1;
}
/**
 * 用setTimeout代替setInterval
 * @param {function} fn
 * @param {number} delay
 * @returns
 */
export function mySetInterval(fn, delay) {
  let timer = null; //开关 用于终止setInterval
  let temp = () => {
    fn();
    timer = setTimeout(temp, delay);
  };
  temp();
  return {
    clear: function () {
      clearTimeout(timer);
    },
  };
}
