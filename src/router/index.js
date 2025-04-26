import { createWebHistory, createRouter } from "vue-router";
export const constantRoutes = [
  {
    //动态表单
    path: "/",
    component: () => import("@/components/HelloWorld.vue"),
    hidden: true,
  },
];
const router = createRouter({
  history: createWebHistory(),
  routes: constantRoutes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }
    return { top: 0 };
  },
});
export default router;
