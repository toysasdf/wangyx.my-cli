import request from "@/utils/request";
/**
 * @description: 获取大文件上传状况
 * @param {query:object}
 * @return {}
 * @author: toys
 */
export function getUploadDetails({ md5, suffix }) {
  return request({
    url: "/api/getUploadDetial",
    method: "get",
  });
}
/**
 * @description: 文件上传接口
 * @return {}
 * @author: toys
 */
export function upload() {
  return request({
    url: "/api/upload",
    method: "get",
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}
/**
 * @description: 合并文件接口
 * @param {data:object}
 * @return {*}
 * @author: toys
 */
export function mergeFile(data) {
  return request({
    url: "/api/mergeFile",
    method: "get",
  });
}
