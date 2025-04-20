import SparkMD5 from "spark-md5";

/**
 * @message:获取文件md5和后缀
 * @param file
 * @return {md5: string,suffix: string}
 */
function getIdentityAndName(file) {
  return new Promise((resolve, reject) => {
    const suffix = file.name.split(".")[1]; //获取后缀
    const fileReader = new FileReader();
    fileReader.readAsArrayBuffer(file);
    fileReader.onload = (e) => {
      const buffer = e.target?.result;
      const spark = new SparkMD5.ArrayBuffer();
      spark.append(buffer);
      const md5 = spark.end();
      resolve({ md5, suffix });
    };
    fileReader.onerror = () => {
      fileReader.onerror = function (error) {
        reject(error);
      };
    };
  });
}
/**
 * @description: 确定文件分割大小
 * @param {fileSize:number}
 * @return {*}
 * @author: toys
 */
function getChunkSize(fileSize) {
  const defaultSize = 1 * 1024 * 1024; // 每片1M
  const defaultCount = 100;
  const maxCount = Math.ceil(fileSize / defaultSize);
  const maxSize = Math.ceil(fileSize / defaultCount);
  return maxCount > defaultCount ? maxSize : defaultSize;
}
/**
 * @description:
 * @param {file:object} file
 * @param {size:number} size
 * @param {md5:string} md5
 * @param {suffix:string} suffix
 * @param {list:array} list
 * @return {*}
 * @author: toys
 */
function getChunks(file, size, md5, suffix, list) {
  let index = 0;
  const end = Math.ceil(file.size / size);
  const result = [];
  while (index < end) {
    const chunk = file.slice(index * size, (index + 1) * size);
    const chunkName = `${index}-${md5}.${suffix}`;
    if (!isUploadedFile(list, chunkName)) {
      //这里利用后端返回的数据 过滤掉已经返回的文件分片
      const formData = new FormData();
      formData.append("file", chunk);
      formData.append("md5", md5);
      formData.append("chunkName", chunkName);
      result.push(formData);
    }
    index++;
  }
  return result;
}
/**
 * @description:
 * @param {chunks:formData} chunks
 * @return {*}
 * @author: toys
 */
function packageTasks(chunks) {
  return chunks.map((item) => {
    return upload.bind(null, item);
  });
}
/**
 * @description: 过滤上传过的文件
 * @param {*} list
 * @param {*} name
 * @return {*}
 * @author: toys
 */
function isUploadedFile(list, name) {
  return list.includes(name);
}
// 并发异步队列,控制异步任务的并发数
function paralleTask(tasks, max = 4) {
  if (tasks.length === 0) return;
  return new Promise((resolve, reject) => {
    let nextIndex = 0;
    let finishedIndex = 0;
    const len = tasks.length;
    for (let i = 0; i < max && i < len; i++) {
      _run();
    }
    function _run() {
      const task = tasks[nextIndex];
      nextIndex++;
      task()
        .then(() => {
          finishedIndex++;
          const isFinied = finishedIndex === len;
          if (isFinied) {
            resolve(0);
          }

          const hasTask = nextIndex < len;
          if (hasTask) {
            _run();
          }
        })
        .catch((err) => reject(err));
    }
  });
}
/**
 * @description:
 * @return {*}
 * @author: toys
 */
async function uploadFile(fileList) {
  //可以先给个uploading标志变量 表明正在上传文件
  const { md5, suffix } = await getIdentityAndName(fileList[0]); //获取完整文件md5唯一标识以及后缀名
  const [data, err] = await getUploadDetial({ md5, suffix }); //获取现有文件状态的信息
  if (err) return message.success("上传失败!");
  const { isUploaded, list } = data;
  if (isUploaded) {
    setUploading(false); //结束上传
    return message.success("上传成功!");
  }
  const file = fileList[0];
  const size = getChunkSize(file.size);
  const chunks = getChunks(file, size, md5, suffix, list);
  const tasks = packageTasks(chunks);
  await paralleTask(tasks, 4);
  await merge({ md5, suffix });
  setUploading(false);
}
export default uploadFile;
