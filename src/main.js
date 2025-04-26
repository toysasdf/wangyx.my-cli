/*
 * @Author: toysasdf 3265755541@qq.com
 * @Date: 2025-04-16 21:06:16
 * @LastEditors: Please set LastEditors
 * @LastEditTime: 2025-04-24 22:45:42
 * @FilePath: \manage-app\src\main.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { createApp } from "vue";
import "./style.css";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import "element-plus/theme-chalk/dark/css-vars.css";
import router from "./router";
import App from "./App.vue";
const app = createApp(App);
app.use(router);
app.mount("#app");
