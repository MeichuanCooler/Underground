import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import ElementUI from "element-ui";
import axios from "axios";
import "./styles.scss";
import "./config/axiosConfig"
import "./assets/global.css"

// ========== 新增：仅开发环境引入 Mock.js 配置 ==========
// 保证生产环境不会加载Mock，避免影响线上功能
if (process.env.NODE_ENV === 'development') {
  // 引入mock配置文件，拦截axios请求（路径要和你创建的文件一致）
  require('./mock/index.js')
}
// =====================================================

// 全局使用ele
Vue.use(ElementUI, {size: "small"});

Vue.config.productionTip = false;

// 添加http请求库
Vue.prototype.$axios = axios;

// 设置标题
router.beforeEach((to,from,next) =>{
    if(to.meta.name){
        document.title = to.meta.name
    }
    next();
})

new Vue({
    router,
    store,
    render: (h) => h(App),
}).$mount("#app");