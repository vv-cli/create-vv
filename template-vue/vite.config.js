import { resolve } from 'path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
// 自动按需加载根插件
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
// vant组件、vueuse库自动按需加载
import { VantResolver, VueUseComponentsResolver } from 'unplugin-vue-components/resolvers';
// 按需加载icones图标
import Icons from 'unplugin-icons/vite';
import IconsResolver from 'unplugin-icons/resolver';

const timestamp = Date.now();

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    vue(),
    Icons({ autoInstall: true, compiler: 'vue3' }),
    AutoImport({
      dts: false, // 生成类型声明文件路径
      resolvers: [], // 路径解析器列表
      eslintrc: {
        enabled: false, // 启用与 Eslint 集成（ 1、改为true用于生成eslint配置。2、生成后改回false，避免重复生成消耗）
        filepath: './eslintrc-auto-import.json', // 生成 EsLint 配置文件的路径
        globalsPropValue: true, // 用于覆盖 globals 属性
      },
      imports: ['vue', 'pinia', 'vue-router', '@vueuse/core'], // 路径解析器列表
    }),
    Components({
      dts: false, // 生成类型声明文件路径
      resolvers: [
        VantResolver(), // vant组件自动按需引入
        VueUseComponentsResolver(),
        IconsResolver(),
      ], // 组件路径解析器列表
    }),
  ],
  server: {
    // 是否开启 https
    https: false,
    // 端口号
    port: 5200,
    // 监听所有地址
    host: '0.0.0.0',
    // 服务启动时是否自动打开浏览器
    open: true,
    // 允许跨域
    cors: true,
    // 自定义代理规则
    proxy: {
      '/api': {
        // 这里配置真实的后端环境地址
        target: 'http://example',
        changeOrigin: true,
        rewrite: (path) => path.replace('/api/', '/'),
      },
    },
  },
  build: {
    // 设置最终构建的浏览器兼容目标
    target: 'es2015',
    // 构建后是否生成 source map 文件
    sourcemap: false,
    //  chunk 大小警告的限制（以 kbs 为单位）
    chunkSizeWarningLimit: 2000,
    // 启用/禁用 gzip 压缩大小报告
    reportCompressedSize: false,
    // 在生产环境移除console.log
    terserOptions: {
      compress: {
        drop_console: false,
        pure_funcs: ['console.log', 'console.info'],
        drop_debugger: true,
      },
    },
    minify: 'terser',
    // 静态资源打包到dist下的不同目录
    rollupOptions: {
      output: {
        chunkFileNames: `static/js/[name]-[hash]-${timestamp}.js`,
        entryFileNames: `static/js/[name]-[hash]-${timestamp}.js`,
        assetFileNames: `static/[ext]/[name]-[hash]-${timestamp}.[ext]`,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      assets: resolve(__dirname, './src/assets'),
      store: resolve(__dirname, './src/store'),
      utils: resolve(__dirname, './src/utils'),
    },
  },
});
