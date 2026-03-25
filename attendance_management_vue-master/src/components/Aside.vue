<template>
  <el-menu 
    class="demo" 
    style="height: 100%;overflow-x: hidden; min-height: 100%; "
    text-color="#c6e6e8"
    width="200px"
    background-color="#1ba784"
    active-text-color="#1a6840"
    :collapse-transition="false"
    :collapse="isCollapse"
    :style="{color:iconColor}"
    router
  >
    <!-- 系统LOGO -->
    <div style="height: 60px; line-height: 60px; text-align: center">
      <img src="../assets/logo.png" alt="LOGO"
           style="width: 20px; position: relative; top: 3px; margin-right: 5px">
      <b style="color: #c6e6e8" v-show="!isCollapse">考勤管理系统</b>
    </div>

    <!-- 渲染权限菜单（核心修改：遍历 permissionRights 而非原始 rights） -->
    <div v-for="item in permissionRights" :key="item.path">
      <el-menu-item :index="item.url || item.path">
        <i :style="{color:iconColor}" :class="item.icon"></i>
        <span slot="title">{{ item.name }}</span>
      </el-menu-item>
    </div>
  </el-menu>
</template>

<script>
export default {
  name: "Aside",
  props: {
    isCollapse: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      iconColor: '#c6e6e8',
      // 1. 定义完整的菜单权限配置（替代后端接口返回的 rights）
      allRights: [
        { name: "首页", path: "/home", url: "/home", icon: "el-icon-s-home" },
        { name: "个人信息", path: "/userInfo", url: "/userInfo", icon: "el-icon-user" },
        { name: "我要请假", path: "/checkUser", url: "/checkUser", icon: "el-icon-tickets" },
        { name: "请假记录", path: "/checkUserHistory", url: "/checkUserHistory", icon: "el-icon-time" },
        { name: "人脸签到", path: "/faceCheck", url: "/faceCheck", icon: "el-icon-camera", roles: ["user"] },
        // 仅管理员可见的菜单
        { name: "用户列表", path: "/user", url: "/user", icon: "el-icon-user-solid", roles: ["admin"] },
        { name: "角色列表", path: "/role", url: "/role", icon: "el-icon-s-tools", roles: ["admin"] },
        { name: "权限列表", path: "/right", url: "/right", icon: "el-icon-s-lock", roles: ["admin"] },
        { name: "请假名单", path: "/checkAdmin", url: "/checkAdmin", icon: "el-icon-s-data", roles: ["admin"] },
        { name: "批假记录", path: "/checkAdminHistory", url: "/checkAdminHistory", icon: "el-icon-s-order", roles: ["admin"] },
      ],
      permissionRights: [] // 过滤后的权限菜单
    }
  },
  created() {
    // 2. 初始化：根据当前登录角色过滤菜单
    this.filterRightsByRole();
    // 3. 兼容原有逻辑：Mock /user/info 接口（避免控制台报错）
    this.mockUserInfoApi();
  },
  watch: {
    // 4. 监听路由变化，切换账号后重新过滤菜单
    $route() {
      this.filterRightsByRole();
    }
  },
  methods: {
    // 核心：根据当前用户角色过滤菜单
    filterRightsByRole() {
      // 读取 localStorage 中的用户信息（Mock 登录存入的）
      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
      const userRole = userInfo.role || "user"; // 默认普通用户

      // 过滤逻辑：
      // - 无 roles 标记 → 所有角色可见
      // - 有 roles 标记 → 仅匹配当前角色可见
      this.permissionRights = this.allRights.filter(right => {
        if (!right.roles) return true;
        return right.roles.includes(userRole);
      });
    },

    // 兼容原有逻辑：Mock /user/info 接口返回（避免调用真实接口报错）
    mockUserInfoApi() {
      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
      if (userInfo.role) {
        // 模拟接口返回的 userInfo 数据结构
        const mockUserInfo = {
          id: userInfo.id,
          name: userInfo.name,
          role: userInfo.role,
          rights: this.permissionRights // 把过滤后的菜单权限赋值给 rights
        };
        // 存入 sessionStorage，兼容原有代码
        sessionStorage.setItem("userInfo", JSON.stringify(mockUserInfo));
      }
    }
  }
};
</script>

<style>
.el-scrollbar {
  height: 100%;
}

.el-scrollbar__wrap {
  overflow-x: hidden;
}

.el-menu {
  border-right-width: 0 !important;
}

.el-submenu__title i {
  color: #c6e6e8 !important;
}
</style>