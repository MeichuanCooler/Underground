import Mock from 'mockjs'
import { Random } from 'mockjs'

Mock.setup({ timeout: '300-600' })

// ==================== 1. 登录接口（多角色版，优化权限格式） ====================
Mock.mock(/\/login/, 'post', (options) => {
  // 1. 解析登录参数
  const loginForm = JSON.parse(options.body)
  
  // 2. 空值校验
  if (!loginForm.name || !loginForm.password) {
    return { code: 400, msg: "用户名或密码不能为空" }
  }

  // 3. 多账号配置（优化：rights 格式和 Aside.vue 菜单一致）
  const userAccounts = {
    // 管理员账号
    "wang": {
      password: "123456",
      role: "admin",
      nickname: "王管理员",
      // 权限格式：和 Aside.vue 中 allRights 一致，包含 path/url/icon
      rights: [
        { name: "首页", path: "/home", url: "/home", icon: "el-icon-s-home" },
        { name: "个人信息", path: "/userInfo", url: "/userInfo", icon: "el-icon-user" },
        { name: "我要请假", path: "/checkUser", url: "/checkUser", icon: "el-icon-tickets" },
        { name: "请假记录", path: "/checkUserHistory", url: "/checkUserHistory", icon: "el-icon-time" },
        { name: "用户列表", path: "/user", url: "/user", icon: "el-icon-user-solid" },
        { name: "角色列表", path: "/role", url: "/role", icon: "el-icon-s-tools" },
        { name: "权限列表", path: "/right", url: "/right", icon: "el-icon-s-lock" },
        { name: "请假名单", path: "/checkAdmin", url: "/checkAdmin", icon: "el-icon-s-data" },
        { name: "批假记录", path: "/checkAdminHistory", url: "/checkAdminHistory", icon: "el-icon-s-order" }
      ]
    },
    // 普通用户账号
    "zhangsan": {
      password: "123456",
      role: "user",
      nickname: "张三",
      rights: [
        { name: "首页", path: "/home", url: "/home", icon: "el-icon-s-home" },
        { name: "个人信息", path: "/userInfo", url: "/userInfo", icon: "el-icon-user" },
        { name: "我要请假", path: "/checkUser", url: "/checkUser", icon: "el-icon-tickets" },
        { name: "请假记录", path: "/checkUserHistory", url: "/checkUserHistory", icon: "el-icon-time" },
        { name: "人脸签到", path: "/faceCheck", url: "/faceCheck", icon: "el-icon-camera" }
      ]
    },
    // 扩展：普通用户 lisi
    "lisi": {
      password: "123456",
      role: "user",
      nickname: "李四",
      rights: [
        { name: "首页", path: "/home", url: "/home", icon: "el-icon-s-home" },
        { name: "个人信息", path: "/userInfo", url: "/userInfo", icon: "el-icon-user" },
        { name: "我要请假", path: "/checkUser", url: "/checkUser", icon: "el-icon-tickets" },
        { name: "请假记录", path: "/checkUserHistory", url: "/checkUserHistory", icon: "el-icon-time" }
      ]
    }
  }

  // 4. 匹配账号
  const currentUser = userAccounts[loginForm.name];
  if (!currentUser) {
    return { code: 400, msg: "用户名不存在" }
  } else if (currentUser.password !== loginForm.password) {
    return { code: 400, msg: "密码错误" }
  }

  // 5. 生成登录态
  const mockToken = Random.guid();
  const userInfo = {
    id: Random.id(),
    name: loginForm.name,
    role: currentUser.role,
    nickname: currentUser.nickname,
    rights: currentUser.rights // 直接返回完整菜单权限
  }

  // 6. 存储登录态（同时存入 localStorage 和 sessionStorage，兼容 Aside.vue）
  localStorage.setItem('token', mockToken);
  localStorage.setItem('userInfo', JSON.stringify(userInfo));
  sessionStorage.setItem('userInfo', JSON.stringify(userInfo)); // 新增：适配 Aside.vue 原有逻辑

  // 7. 返回结果
  return {
    code: 200,
    msg: `登录成功，欢迎${currentUser.nickname}！`,
    data: userInfo,
    headers: { authorization: mockToken }
  }
})

// ==================== 2. Mock /user/info 接口（核心：适配 Aside.vue） ====================
Mock.mock(/\/user\/info/, 'get', () => {
  // 读取登录态中的用户信息
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  if (!userInfo.role) {
    // 未登录时返回未授权
    return { code: 401, msg: "未登录，请先登录" }
  }
  // 模拟后端返回用户信息 + 权限列表
  return {
    code: 200,
    msg: "查询用户信息成功",
    data: userInfo // 直接返回完整用户信息（包含 rights）
  };
})

// ==================== 3. 注册接口（保留） ====================
Mock.mock(/\/user\/add/, 'post', (options) => {
  const registerForm = JSON.parse(options.body)
  if (!registerForm.name || !registerForm.password) {
    return { code: 400, msg: "用户名或密码不能为空" }
  } else if (registerForm.password.length < 6) {
    return { code: 400, msg: "密码长度不能少于6位" }
  } else if (registerForm.name === "wang") {
    return { code: 400, msg: "用户名已存在，请更换" }
  } else {
    return { code: 200, msg: "注册成功" }
  }
})

// ==================== 4. /check/homeList 接口（保留） ====================
Mock.mock(/\/check\/homeList/, 'get', () => {
  const getRecent7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const year = date.getFullYear();
      const month = ("0" + (date.getMonth() + 1)).slice(-2);
      const day = ("0" + date.getDate()).slice(-2);
      days.push(`${year}-${month}-${day}`);
    }
    return days;
  };
  const getRandomLeaveNums = (length) => {
    const nums = [];
    for (let i = 0; i < length; i++) {
      nums.push(Random.integer(1, 20));
    }
    return nums;
  };
  const xData = getRecent7Days();
  const yData = getRandomLeaveNums(xData.length);
  return { code: 200, msg: "查询成功", data: { x: xData, y: yData } };
});

// ==================== 5. /user/total 接口（保留） ====================
Mock.mock(/\/user\/total/, 'get', () => {
  return { code: 200, msg: "查询成功", data: Random.integer(100, 500) };
});

// ==================== 6. 兜底接口（保留，强化） ====================
Mock.mock(/^\/.*/, 'get', () => { return { code: 200, msg: "Mock 兜底数据", data: {} } })
Mock.mock(/^\/.*/, 'post', () => { return { code: 200, msg: "Mock 兜底数据", data: {} } })
Mock.mock(/^\/.*/, 'put', () => { return { code: 200, msg: "Mock 兜底数据", data: {} } })
Mock.mock(/^\/.*/, 'delete', () => { return { code: 200, msg: "Mock 兜底数据", data: {} } })

export default Mock