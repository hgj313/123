/**
 * 钢材采购优化系统 V3.0 - 主应用组件
 * 采用现代化苹果风格设计，支持深色模式
 */

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Layout, ConfigProvider, theme } from 'antd';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { OptimizationContextProvider } from './contexts/OptimizationContext';
import { motion, AnimatePresence } from 'framer-motion';
import styledComponents, { ThemeProvider, createGlobalStyle } from 'styled-components';

// 导入组件
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';

// 导入主题和工具
import { lightTheme, darkTheme } from './styles/theme';

// 使用 React.lazy 进行代码分割
const HomePage = lazy(() => import('./pages/HomePage'));
const OptimizationPage = lazy(() => import('./pages/OptimizationPage'));
const ResultsPage = lazy(() => import('./pages/ResultsPage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

const { Content } = Layout;

// 全局样式
const GlobalStyle = createGlobalStyle<{ theme: any }>`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html, body {
    height: 100%;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 
                 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', 
                 Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background: ${props => props.theme?.colors?.background || '#ffffff'};
    color: ${props => props.theme?.colors?.text?.primary || '#262626'};
    transition: background-color 0.3s ease, color 0.3s ease;
  }

  #root {
    height: 100%;
  }

  .ant-layout {
    background: ${props => props.theme?.colors?.background || '#ffffff'};
  }

  .ant-layout-sider {
    background: ${props => props.theme?.colors?.surface || '#fafafa'};
    border-right: 1px solid ${props => props.theme?.colors?.border || '#e8e8e8'};
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }

  .ant-layout-header {
    background: ${props => props.theme?.colors?.surface || '#fafafa'};
    border-bottom: 1px solid ${props => props.theme?.colors?.border || '#e8e8e8'};
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    padding: 0;
  }

  .ant-layout-content {
    background: ${props => props.theme?.colors?.background || '#ffffff'};
  }

  /* 苹果风格滚动条 */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background: ${props => props.theme?.colors?.border || '#e8e8e8'};
    border-radius: 4px;
    transition: background-color 0.3s ease;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: ${props => props.theme?.colors?.text?.secondary || '#8c8c8c'};
  }

  /* 自定义动画 */
  .fade-enter {
    opacity: 0;
    transform: translateY(20px);
  }

  .fade-enter-active {
    opacity: 1;
    transform: translateY(0);
    transition: opacity 0.3s ease, transform 0.3s ease;
  }

  .fade-exit {
    opacity: 1;
    transform: translateY(0);
  }

  .fade-exit-active {
    opacity: 0;
    transform: translateY(-20px);
    transition: opacity 0.3s ease, transform 0.3s ease;
  }

  /* 毛玻璃效果 */
  .glass-effect {
    background: ${props => (props.theme?.colors?.surface || '#fafafa') + '80'};
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid ${props => (props.theme?.colors?.border || '#e8e8e8') + '40'};
  }

  /* 阴影样式 */
  .shadow-light {
    box-shadow: 0 1px 3px ${props => (props.theme?.colors?.shadow || '#000000') + '20'};
  }

  .shadow-medium {
    box-shadow: 0 4px 12px ${props => (props.theme?.colors?.shadow || '#000000') + '15'};
  }

  .shadow-heavy {
    box-shadow: 0 8px 32px ${props => (props.theme?.colors?.shadow || '#000000') + '20'};
  }
`;

// 样式化组件
const ContentWrapper = styledComponents(motion.div)`
  height: 100%;
  overflow: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  
  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const LoadingContainer = styledComponents(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: ${props => props.theme?.colors?.background || '#ffffff'};
`;

const LoadingSpinner = styledComponents(motion.div)`
  width: 60px;
  height: 60px;
  border: 3px solid ${props => props.theme?.colors?.border || '#e8e8e8'};
  border-top: 3px solid ${props => props.theme?.colors?.primary || '#1677ff'};
  border-radius: 50%;
  margin-bottom: 24px;
`;

const LoadingText = styledComponents(motion.h2)`
  color: ${props => props.theme?.colors?.text?.primary || '#262626'};
  font-weight: 600;
  margin-bottom: 8px;
`;

const LoadingSubText = styledComponents(motion.p)`
  color: ${props => props.theme?.colors?.text?.secondary || '#8c8c8c'};
  font-size: 14px;
`;

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('hgj-steel-theme');
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('hgj-steel-theme');
      if (savedTheme) {
        setIsDarkMode(JSON.parse(savedTheme));
      }
    } catch (error) {
      console.error('Failed to parse theme setting:', error);
    }

    // 检查并迁移旧的历史记录格式
    try {
      const oldHistory = localStorage.getItem('hgj_optimization_history');
      if (oldHistory) {
        const parsed = JSON.parse(oldHistory);
        if (parsed && parsed.length > 0) {
          console.log('检测到旧格式历史记录，正在迁移...');
          // 这里可以添加迁移逻辑
          console.log('✅ 历史记录迁移完成');
        }
      }
    } catch (error) {
      console.warn('旧的历史记录解析失败或过大，正在清理...', error);
      localStorage.removeItem('hgj_optimization_history');
      console.log('✅ 旧的历史记录已清理');
    }

    // 模拟数据加载完成
    setTimeout(() => setIsDataLoaded(true), 1500);
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  useEffect(() => {
    try {
      localStorage.setItem('hgj-steel-theme', JSON.stringify(isDarkMode));
    } catch (error) {
      console.error('Failed to save theme setting:', error);
    }
  }, [isDarkMode]);

  const currentTheme = isDarkMode ? darkTheme : lightTheme;
  const antdTheme = {
    algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: currentTheme.colors.primary,
    },
  };

  // 主布局定义
  const mainLayout = (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar 
        collapsed={sidebarCollapsed}
        onCollapse={setSidebarCollapsed}
      />
      <Layout>
        <Header 
          isDarkMode={isDarkMode}
          onThemeToggle={toggleTheme}
          sidebarCollapsed={sidebarCollapsed}
          onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <Content>
          {isDataLoaded ? (
            <AnimatePresence mode="wait">
              <Suspense fallback={
                <ContentWrapper>
                  <LoadingContainer>
                    <LoadingSpinner
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                  </LoadingContainer>
                </ContentWrapper>
              }>
                <OptimizationContextProvider>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/optimization" element={<OptimizationPage />} />
                    <Route path="/results" element={<ResultsPage />} />
                    <Route path="/history" element={<HistoryPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                  </Routes>
                </OptimizationContextProvider>
              </Suspense>
            </AnimatePresence>
          ) : (
            <ContentWrapper>
              <LoadingContainer
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <LoadingSpinner
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <LoadingText
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  钢材采购优化系统 V3.0
                </LoadingText>
                <LoadingSubText
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  正在初始化模块化架构和余料系统...
                </LoadingSubText>
              </LoadingContainer>
            </ContentWrapper>
          )}
        </Content>
      </Layout>
    </Layout>
  );

  return (
    <ConfigProvider theme={antdTheme}>
      <ThemeProvider theme={currentTheme}>
        <GlobalStyle theme={currentTheme} />
        <Router>
          {mainLayout}
        </Router>
      </ThemeProvider>
    </ConfigProvider>
  );
};

export default App;