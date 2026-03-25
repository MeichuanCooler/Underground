<template>
  <div class="face-check-container">
    <!-- 页面标题（和现有页面风格一致） -->
    <el-card class="page-header" shadow="hover">
      <h2 style="margin: 0; color: #1ba784;">
        <i class="el-icon-camera"></i> 人脸识别打卡签到
      </h2>
      <p style="color: #666; margin-top: 8px;">请确保摄像头已开启，正对脸部完成签到</p>
    </el-card>

    <!-- 核心内容区 -->
    <el-row :gutter="20" style="margin-top: 20px;">
      <!-- 摄像头区域 -->
      <el-col :span="16">
        <el-card shadow="always">
          <div slot="header" class="clearfix">
            <span>摄像头采集区</span>
            <el-button 
              type="primary" 
              size="mini" 
              style="float: right;"
              @click="startCamera"
              :disabled="cameraActive"
            >
              开启摄像头
            </el-button>
          </div>

          <!-- 摄像头容器（核心修改：v-show 替代 v-if 保留 DOM） -->
          <div class="camera-box">
            <!-- 未开启摄像头提示（v-show 隐藏，不销毁 DOM） -->
            <div class="camera-tips" v-show="!cameraActive">
              <i class="el-icon-video-camera" style="font-size: 48px; color: #ccc;"></i>
              <p style="color: #999; margin-top: 10px;">点击「开启摄像头」按钮启动采集</p>
            </div>

            <!-- 摄像头画面（v-show 确保 DOM 始终存在） -->
            <video 
              ref="videoRef" 
              class="camera-video" 
              autoplay 
              playsinline
              v-show="cameraActive"
            ></video>
          </div>
        </el-card>
      </el-col>

      <!-- 操作区 -->
      <el-col :span="8">
        <el-card shadow="always">
          <div slot="header">
            <span>签到操作</span>
          </div>

          <!-- 用户信息 -->
          <el-descriptions :column="1" border style="margin-bottom: 20px;">
            <el-descriptions-item label="当前用户">
              {{ userInfo.nickname || userInfo.name || '未知用户' }}
            </el-descriptions-item>
            <el-descriptions-item label="用户角色">
              <el-tag type="success">{{ userInfo.role === 'user' ? '普通用户' : '管理员' }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="今日签到状态">
              <el-tag :type="signSuccess ? 'success' : 'warning'">
                {{ signSuccess ? '已签到' : '未签到' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="签到时间" v-if="signSuccess">
              {{ signTime }}
            </el-descriptions-item>
          </el-descriptions>

          <!-- 签到按钮 -->
          <el-button 
            type="primary" 
            size="large" 
            style="width: 100%;"
            @click="doSign"
            :disabled="!cameraActive || signSuccess"
            icon="el-icon-check"
          >
            {{ signSuccess ? '已完成签到' : '点击完成签到' }}
          </el-button>

          <!-- 重置按钮 -->
          <el-button 
            type="default" 
            size="mini" 
            style="width: 100%; margin-top: 10px;"
            @click="resetSign"
            icon="el-icon-refresh"
          >
            重置签到状态
          </el-button>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
export default {
  name: "FaceCheck",
  data() {
    return {
      cameraActive: false, // 摄像头是否激活
      videoStream: null, // 视频流对象
      userInfo: {}, // 当前用户信息
      signSuccess: false, // 是否签到成功
      signTime: "" // 签到时间
    };
  },
  created() {
    // 获取当前用户信息（增加容错）
    try {
      this.userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
    } catch (e) {
      this.userInfo = {};
      this.$message.error("用户信息解析失败，请重新登录！");
      this.$router.push("/login");
    }
    
    // 验证权限（双重保障：路由守卫 + 组件内校验）
    if (this.userInfo.role !== 'user') {
      this.$message.warning("仅普通用户可使用人脸签到功能！");
      this.$router.push("/home");
    }
  },
  beforeDestroy() {
    // 页面销毁时关闭摄像头（增强版）
    this.stopCamera();
  },
  methods: {
    // 1. 开启摄像头（完整修复版）
    async startCamera() {
      // 核心：等待 DOM 渲染完成后再执行
      this.$nextTick(async () => {
        try {
          // 第一步：检查视频 DOM 元素是否存在（必做容错）
          if (!this.$refs || !this.$refs.videoRef) {
            this.$message.error("视频容器加载失败，请刷新页面重试！");
            return;
          }

          // 第二步：检查浏览器兼容性（兼容旧版 API）
          const getUserMedia = navigator.mediaDevices?.getUserMedia || 
                               navigator.getUserMedia || 
                               navigator.webkitGetUserMedia || 
                               navigator.mozGetUserMedia;
          if (!getUserMedia) {
            this.$message.error("您的浏览器不支持摄像头采集，请使用 Chrome/Firefox/Edge 最新版！");
            return;
          }

          // 第三步：请求摄像头权限（细分错误类型）
          let stream;
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: {
                facingMode: "user", // 优先前置摄像头（人脸采集更合适）
                width: { ideal: 1280, min: 640 }, // 最小/理想分辨率
                height: { ideal: 720, min: 480 }
              },
              audio: false // 不需要音频，减少权限请求
            });
          } catch (err) {
            // 精准错误提示
            switch (err.name) {
              case "NotAllowedError":
                this.$message.error("摄像头权限被拒绝！请在浏览器地址栏左侧「锁图标」中允许访问。");
                break;
              case "NotFoundError":
                this.$message.error("未检测到摄像头设备！请检查硬件连接或是否被占用。");
                break;
              case "NotReadableError":
                this.$message.error("摄像头被占用！请关闭微信/QQ等占用程序后重试。");
                break;
              case "SecurityError":
                this.$message.error("安全限制！仅 localhost/HTTPS 环境可访问摄像头。");
                break;
              default:
                this.$message.error(`摄像头开启失败：${err.message || '未知错误'}`);
            }
            return; // 出错后终止执行
          }

          // 第四步：绑定视频流到 DOM（此时 DOM 一定存在）
          const videoElement = this.$refs.videoRef;
          videoElement.srcObject = stream;
          this.videoStream = stream;
          this.cameraActive = true;

          // 成功提示
          this.$message.success("摄像头开启成功！请正对摄像头完成签到。");

        } catch (unknownErr) {
          // 兜底错误处理
          console.error("摄像头操作异常：", unknownErr);
          this.$message.error("摄像头操作异常，请联系管理员！");
        }
      });
    },

    // 2. 关闭摄像头（增强版：释放所有资源）
    stopCamera() {
      // 停止视频流（释放摄像头硬件）
      if (this.videoStream) {
        this.videoStream.getTracks().forEach(track => {
          track.stop(); // 停止所有轨道
        });
        this.videoStream = null;
      }
      this.cameraActive = false;
      
      // 清空 video 元素的流（避免残留画面）
      if (this.$refs && this.$refs.videoRef) {
        this.$refs.videoRef.srcObject = null;
      }
    },

    // 3. 完成签到（模拟）
    doSign() {
      // 模拟人脸识别过程（延迟1秒，增强真实感）
      const loading = this.$loading({
        lock: true,
        text: '正在进行人脸识别验证...',
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.7)'
      });

      setTimeout(() => {
        loading.close();
        // 模拟签到成功
        this.signSuccess = true;
        this.signTime = new Date().toLocaleString();
        
        // 提示签到成功
        this.$message.success({
          message: `签到成功！签到时间：${this.signTime}`,
          duration: 5000
        });

        // 可选：关闭摄像头（如需保留画面可注释）
        // this.stopCamera();
      }, 1000);
    },

    // 4. 重置签到状态
    resetSign() {
      this.signSuccess = false;
      this.signTime = "";
      this.$message.info("已重置签到状态，可重新签到");
      
      // 如果摄像头已关闭，提示开启
      if (!this.cameraActive) {
        this.$message.warning("请重新开启摄像头完成签到");
      }
    }
  }
};
</script>

<style scoped>
.face-check-container {
  padding: 0 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  background-color: #f8f9fa;
}

.camera-box {
  width: 100%;
  height: 480px;
  border: 1px dashed #ddd;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background-color: #f8f9fa;
}

.camera-tips {
  text-align: center;
}

.camera-video {
  width: 100%;
  height: 100%;
  object-fit: cover; /* 保持画面比例，避免拉伸 */
  transform: scaleX(-1); /* 镜像翻转，符合人脸采集习惯 */
}

.el-descriptions {
  font-size: 14px;
}

/* 优化按钮样式，和现有系统统一 */
.el-button--large {
  height: 48px;
  font-size: 16px;
}
</style>