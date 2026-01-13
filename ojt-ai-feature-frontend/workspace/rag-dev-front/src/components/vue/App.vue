<template>

  <div v-if="!isLoggedIn" class="docker-login-page">

    <div class="login-container">

      <div class="login-box">

        <div class="docker-logo-section">

          <span class="whale-icon">🐳</span>

          <span class="docker-brand">docker</span>

        </div>

        <h3>Sign In</h3>

        <p class="tagline">Enter your Docker ID to continue to Docker Hub.</p>



        <div class="input-group">

          <label>Docker ID</label>

          <input v-model="loginForm.user" type="text" placeholder="初始账号与密码为社员号，如(1821)" />

        </div>



        <div class="input-group">

          <label>Password</label>

          <input v-model="loginForm.pwd" type="password" placeholder="Password" @keyup.enter="doLogin" />

        </div>



        <button class="btn-signin" @click="doLogin" :disabled="isLogging">

          {{ isLogging ? 'Authenticating...' : 'Sign In' }}

        </button>



        <div class="login-help">

          <a href="#">Forgot Docker ID?</a> · <a href="#">Forgot password?</a>

        </div>

      </div>

      <div class="login-notice">

        New to Docker? <a href="#">Create Account</a>

      </div>

    </div>

  </div>
  <div v-else class="app-container">

    <header class="top-nav">

      <div class="nav-left">

        <span class="logo" @click="view = 'docs'">🐳 Docker Documentation</span>

        <nav>

          <a href="#" @click.prevent="view = 'docs'">Guides</a>
          <a href="#" @click.prevent="view = 'docs'">Reference</a>
          <a href="#" @click.prevent="view = 'editor'">Docker Compose</a>

        </nav>

      </div>

      <div class="nav-right">
        <span class="user-badge">{{ currentUser?.name }}@{{ currentUser?.dockerId }}</span>
        <button class="btn-logout" @click="handleLogout">Sign Out</button>
      </div>

    </header>



    <div class="main-layout">

      <aside class="sidebar">
        <div class="search-box">Search docs...</div>
        <div class="menu-item" :class="{ active: view === 'docs' }" @click="view = 'docs'">Core Concepts</div>
        <div class="menu-item" :class="{ active: view === 'profile' }" @click="view = 'profile'">Installation</div>
        <div class="menu-item">Docker Engine</div>
        <div class="menu-item" :class="{ active: view === 'editor' }" @click="view = 'editor'">Docker Compose</div>

      </aside>



    <main class="main-content">
      <DockerDocs v-if="view === 'docs'" />
      <LevelEditor v-else-if="view === 'editor'" ref="editorRef" @save="handleLevelUpdate" />
      <UserProfile 
        v-else-if="view === 'profile'" 
        :user="currentUser" 
        @updated="handleProfileUpdated" 
      />
    </main>

    </div>



<div :class="['game-widget', { minimized: isMin }]">
  <div class="widget-header" @click="isMin = !isMin">
    <span>⚡ Diagnostic-Tools-v3.0.4</span>
    <button>{{ isMin ? 'Expand' : 'Hide' }}</button>
  </div>
  
  <div class="widget-body" v-show="!isMin">
    <template v-if="currentLevelId">
          <PushBox v-if="currentLevelId !== null && currentLevel.length > 0" :levelData="(currentLevel as any)"
            :levelId="currentLevelId" :currentUser="(currentUser as any)" @refreshRank="handleRefreshRank" />
    </template>
    
    <div v-else class="widget-empty-state">
      <p>⚠️ [ERROR]: No active node selected.</p>
      <p>Please go to <b>Docker Compose</b> and click <b>Execute Deployment</b> to begin diagnostic.</p>
    </div>
  </div>
</div>

  </div>

</template>



<script setup lang="ts">

import { ref, reactive } from 'vue';
import { DockerApi, type LoginResponse } from './services/api'; 
import DockerDocs from './components/DockerDocs.vue';
import PushBox from './components/PushBox.vue';
import LevelEditor from './components/LevelEditor.vue';
import UserProfile from './components/UserProfile.vue';

// 处理资料更新后的回调
const handleProfileUpdated = (newName: string) => {
  if (currentUser.value) {
    currentUser.value.name = newName; // 更新顶栏显示的名字
    view.value = 'docs'; // 返回首页
  }
};

// --- 1. 基础 UI 状态管理 (UI 状態管理) ---
const view = ref<'docs' | 'editor' | 'profile'>('docs');
const isMin = ref(true);
const editorRef = ref<any>(null); // 用于通过 ref 调用 LevelEditor 暴露的方法

// --- 2. 登录与身份验证 (ログインと認証) ---
const isLoggedIn = ref(false);
const isLogging = ref(false);
const loginForm = reactive({ user: '', pwd: '' });
const currentUser = ref<LoginResponse | null>(null);

/**
 * 登录逻辑：调用后端 API
 */

const doLogin = async () => {
  if (!loginForm.user || !loginForm.pwd) return;

  isLogging.value = true;
  try {
    const data = await DockerApi.login(loginForm.user, loginForm.pwd);
    
    if (data) {
      // 1. 赋值给响应式变量
      currentUser.value = data;
      isLoggedIn.value = true;

      // 2. 这里的 data 还是可以访问的局部变量
      if (data.name === 'noName') {
        alert("修改一下名称，这样就可以上排行榜了！\n此外，点击导航栏的Docker Composer选择关卡");
        view.value = 'profile'; // 自动跳转到个人资料页
      }
    } else {
      alert("无法登录，联系客服.");
    }
  } catch (error) {
    console.error("Login Error:", error);
    alert("System Error: Could not reach the authentication server.");
  } finally {
    isLogging.value = false;
  }
};


const handleLogout = () => {
  isLoggedIn.value = false;
  currentUser.value = null;
  loginForm.pwd = '';
  // 登出时重置当前关卡状态
  currentLevel.value = [];
  currentLevelId.value = null;
};

// --- 3. 游戏与诊断工具逻辑 (ゲームと診断ツール) ---

// 初始值设为空，强制要求用户从编辑器中选择
const currentLevel = ref<string[][]>([]);
const currentLevelId = ref<number | null>(null);

/**
 * 处理从 LevelEditor 传来的部署指令
 * stack 对象包含: { id, name, configData }
 */
const handleLevelUpdate = (stack: any) => {
  if (!stack || !stack.configData) return;

  currentLevelId.value = stack.id;         // 设置当前活动的关卡 ID
  currentLevel.value = stack.configData;   // 加载地图数据
  
  // 交互逻辑：点击部署后自动切换到文档页并展开诊断工具
  view.value = 'docs'; 
  isMin.value = false; 
};

/**
 * 监听 PushBox 的刷新请求
 * 当玩家通关并成功上传成绩后，触发此函数
 */
const handleRefreshRank = () => {
  // 如果当前正在编辑器页面，或者引用存在，则刷新排行榜
  if (editorRef.value && typeof editorRef.value.refreshRankings === 'function') {
    console.log("Telemetry sync detected. Refreshing local leaderboard...");
    editorRef.value.refreshRankings();
  }
};



</script>



<style>
/* 1. 全局样式 */

body,
html {
  margin: 0;
  padding: 0;
  height: 100%;
  overflow: hidden;
}

.widget-empty-state {
  padding: 20px;
  color: #666;
  font-family: monospace;
  font-size: 11px;
  text-align: center;
  line-height: 1.6;
}

.widget-empty-state b {
  color: #2496ed;
}
.game-widget {
  /* ... 原有样式 ... */
  border: 1px solid #2496ed; /* 换成 Docker 蓝，表示正在诊断 */
}

.game-widget:not(.minimized) {
  width: 320px; /* 展开时稍微宽一点，方便操作 */
  box-shadow: 0 -4px 20px rgba(36, 150, 237, 0.3);
}
/* 2. 登录页面样式 (完全恢复) */

.docker-login-page {

  height: 100vh;

  background-color: #f7f8f9;

  display: flex;

  justify-content: center;

  align-items: center;

  font-family: -apple-system, system-ui, "Segoe UI", Roboto, sans-serif;

}

.login-container {
  width: 360px;
}

.login-box {

  background: white;

  padding: 40px;

  border: 1px solid #dbe2e8;

  border-radius: 4px;

  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

  text-align: left;

}

.docker-logo-section {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
}

.whale-icon {
  font-size: 32px;
}

.docker-brand {
  font-size: 26px;
  font-weight: 800;
  color: #2496ed;
  letter-spacing: -1px;
}



.login-box h3 {
  font-size: 20px;
  margin: 0 0 10px 0;
  color: #23272b;
}

.tagline {
  font-size: 13px;
  color: #637381;
  margin-bottom: 25px;
}



.input-group {
  margin-bottom: 18px;
}

.input-group label {
  display: block;
  font-size: 12px;
  font-weight: 700;
  color: #444;
  margin-bottom: 6px;
}

.input-group input {

  width: 100%;

  padding: 10px;

  border: 1px solid #cbd5e0;

  border-radius: 3px;

  box-sizing: border-box;

  font-size: 14px;

}

.btn-signin {

  width: 100%;

  padding: 12px;

  background: #2496ed;

  color: white;

  border: none;

  border-radius: 3px;

  font-weight: 600;

  cursor: pointer;

  margin-top: 5px;

}

.btn-signin:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-signin:hover:not(:disabled) {
  background: #1d83d1;
}



.login-help {
  margin-top: 20px;
  text-align: center;
  font-size: 12px;
  color: #637381;
}

.login-help a {
  color: #2496ed;
  text-decoration: none;
}

.login-notice {
  margin-top: 25px;
  text-align: center;
  font-size: 14px;
  color: #444;
}

.login-notice a {
  color: #2496ed;
  text-decoration: none;
  font-weight: 600;
}



/* 3. 主界面布局样式 (完全恢复) */

.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  font-family: sans-serif;
}

.top-nav {
  height: 50px;
  background: #2496ed;
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  z-index: 10;
}

.nav-left {
  display: flex;
  gap: 30px;
  align-items: center;
}

.logo {
  font-weight: bold;
  font-size: 1.1rem;
  cursor: pointer;
}

.nav-left a {
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  font-size: 0.9rem;
  margin-right: 10px;
}

.nav-right {
  display: flex;
  align-items: center;
}

.user-badge {
  font-size: 0.85rem;
  color: #d0e8ff;
  margin-right: 15px;
}

.btn-logout {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 4px 8px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.8rem;
}



.main-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.sidebar {
  width: 260px;
  background: #f8f9fa;
  border-right: 1px solid #eee;
  padding: 20px;
  overflow-y: auto;
}

.search-box {
  background: #fff;
  border: 1px solid #ddd;
  padding: 8px;
  border-radius: 4px;
  color: #999;
  margin-bottom: 20px;
  font-size: 0.8rem;
}

.menu-item {
  padding: 10px;
  color: #444;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.2s;
}

.menu-item:hover {
  background: #f1f1f1;
}

.menu-item.active {
  color: #2496ed;
  font-weight: bold;
  background: #eef7ff;
  border-radius: 4px;
}



.main-content {
  flex: 1;
  overflow-y: auto;
  background: white;
}



.game-widget {

  position: fixed;
  bottom: 0;
  right: 20px;
  width: 280px;

  background: white;
  border: 1px solid #ddd;
  border-bottom: none;

  border-radius: 8px 8px 0 0;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);

  transition: transform 0.3s;
  z-index: 100;

}

.game-widget.minimized {
  transform: translateY(calc(100% - 40px));
}

.widget-header {
  background: #333;
  color: #eee;
  padding: 10px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  font-family: monospace;
  font-size: 11px;
}

.widget-header button {
  background: none;
  border: 1px solid #666;
  color: #ccc;
  font-size: 10px;
  cursor: pointer;
}

.widget-body {
  padding: 10px;
  background: #fafafa;
  display: flex;
  justify-content: center;
}
</style>