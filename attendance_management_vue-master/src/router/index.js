import Vue from "vue";
import VueRouter from "vue-router";
import Manage from "../views/pages/Manage.vue";
import Home from "../views/pages/Home.vue";
import Login from "../views/pages/Login.vue";
import User from "../views/pages/User.vue";
import UserInfo from "../views/pages/UserInfo.vue";
import Role from "../views/pages/Role.vue";
import Right from "../views/pages/Right.vue";
import CheckUser from "../views/pages/CheckUser.vue";
import CheckAdmin from "../views/pages/CheckAdmin.vue";
import CheckUserHistory from "../views/pages/CheckUserHistory.vue";
import CheckAdminHistory from "../views/pages/CheckAdminHistory.vue";
import Not404 from "../views/error-pages/Not404.vue";
// 新增：导入人脸签到组件（懒加载方式，优化性能）
const FaceCheck = () => import("../views/pages/FaceCheck.vue");

Vue.use(VueRouter);

const routes = [
    // 登录页：无需登录即可访问
    {path: "/login", name: "Login", component: Login, meta: {name: "登录", path: "/login"}},

    // 核心修改1：给需要登录的路由添加 requireAuth: true 标记
    {
        path: "/",
        name: "Manage",
        component: Manage,
        redirect: "/home",
        meta: { requireAuth: true }, // 标记：需要登录才能访问
        children: [
            {path: "/", name: "home", component: Home, meta: {name: "首页", path: "/home", requireAuth: true}},
            {path: "home", name: "Home", component: Home, meta: {name: "首页", path: "/home", requireAuth: true}},
            
            // 管理员专属路由：添加 roles: ['admin'] 标记
            {path: "user", name: "User", component: User, meta: {name: "用户列表", path: "/user", requireAuth: true, roles: ['admin']}},
            {path: "role", name: "role", component: Role, meta: {name: "角色列表", path: "/role", requireAuth: true, roles: ['admin']}},
            {path: "right", name: "right", component: Right, meta: {name: "权限列表", path: "/right", requireAuth: true, roles: ['admin']}},
            {path: "checkAdmin", name: "checkAdmin", component: CheckAdmin, meta: {name: "请假名单", path: "/checkAdmin", requireAuth: true, roles: ['admin']}},
            {
                path: "checkAdminHistory",
                name: "checkAdminHistory",
                component: CheckAdminHistory,
                meta: {name: "批假记录", path: "/checkAdminHistory", requireAuth: true, roles: ['admin']}
            },

            // 所有用户可访问的路由（无 roles 标记）
            {path: "userInfo", name: "userInfo", component: UserInfo, meta: {name: "个人信息", path: "/userInfo", requireAuth: true}},
            {path: "checkUser", name: "checkUser", component: CheckUser, meta: {name: "我要请假", path: "/checkUser", requireAuth: true}},
            {
                path: "checkUserHistory",
                name: "checkUserHistory",
                component: CheckUserHistory,
                meta: {name: "请假记录", path: "/checkUserHistory", requireAuth: true}
            },

            // 新增：人脸签到路由（仅普通用户可访问，添加 roles: ['user']）
            {
                path: "faceCheck",
                name: "FaceCheck",
                component: FaceCheck, // 懒加载组件
                meta: {
                    name: "人脸签到",
                    path: "/faceCheck",
                    requireAuth: true,
                    roles: ['user'] // 核心：仅普通用户可见
                }
            },

            // 404页面：需要登录才能访问
            { path: "*", name: 'not404', component: Not404, meta: {name: "页面未找到",path: "/404", requireAuth: true}}
        ],
    }];

const router = new VueRouter({
    mode: "history", //去除#号键
    routes,
});

/**
 * TODO
 * 动态路由未完成，先用固定路由，后期完善
 */
// export const setRouter = () => {
//     const storeRights = sessionStorage.getItem("userInfo") ? JSON.parse(sessionStorage.getItem("userInfo")).rights : []
//     if (storeRights) {
//         // console.log(storeRights)
//         const manageRouter = {path: "/", name: "Manage", component: Manage, redirect: "/home", children: []}
//         storeRights.forEach(item => {
//             let itemRight = {
//                 path: item.url.replace("/", ""),
//                 name: item.name,
//                 component: () => import("../views/pages/" + item.pagePath + ".vue"),
//                 meta: {name: item.name, path: item.url.replace("/", "")}
//             }
//             manageRouter.children.push(itemRight)
//         })
//         // console.log(manageRouter)
//         const names = router.getRoutes().map(v => v.name);
//         if (!names.includes("Manage")) {
//             router.addRoute(manageRouter);
//         }
//     }
// }

// 核心修改2：升级路由守卫，添加「角色权限校验」
router.beforeEach((to, from, next) => {
    // 1. 如果访问的是登录页，直接放行
    if (to.path === '/login') {
        next();
        return;
    }

    // 2. 检查目标路由是否需要登录（meta.requireAuth）
    const needLogin = to.meta.requireAuth || false;
    if (needLogin) {
        // 3. 检查 localStorage 中的 token（Mock 登录成功后会存入）
        const token = localStorage.getItem('token');
        if (!token) {
            // 无 token，强制跳转到登录页
            next('/login');
            return;
        }

        // 4. 角色权限校验（核心新增）
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        const userRole = userInfo.role || ''; // 当前用户角色（admin/user）
        const requiredRoles = to.meta.roles || []; // 目标路由需要的角色

        // 如果路由需要特定角色，且当前用户角色不匹配 → 拦截
        if (requiredRoles.length > 0 && !requiredRoles.includes(userRole)) {
            // 提示无权限，跳回首页
            Vue.prototype.$message.warning("你没有权限访问该页面！");
            next('/home');
            return;
        }

        // 5. 有 token + 有权限，放行
        next();
    } else {
        // 不需要登录的路由，直接放行（目前只有登录页）
        next();
    }
});

// 解决路由重复的问题
const originalPush = VueRouter.prototype.push
VueRouter.prototype.push = function push(location) {
    return originalPush.call(this, location).catch(err => err)
}

export default router;