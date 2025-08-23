import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { OptimizationResult, DesignSteel, ModuleSteel, OptimizationConstraints } from '../types';
import { DEFAULT_CONSTRAINTS } from '../constants';

interface OptimizationContextType {
  optimizationResults: OptimizationResult | null;
  setOptimizationResults: (results: OptimizationResult | null) => void;
  designSteels: DesignSteel[];
  setDesignSteels: (steels: DesignSteel[]) => void;
  removeDesignSteel: (id: string) => void;
  moduleSteels: ModuleSteel[];
  setModuleSteels: (steels: ModuleSteel[]) => void;
  addModuleSteel: (steel: ModuleSteel) => void;
  updateModuleSteel: (id: string, steel: ModuleSteel) => void;
  removeModuleSteel: (id: string) => void;
  constraints: OptimizationConstraints;
  setConstraints: (constraints: OptimizationConstraints) => void;
  isDataLoaded: boolean;
  clearOptimizationData: () => void;
  clearCurrentOptimization: () => void;
  currentOptimization: any; // 根据实际情况定义更具体的类型
  startOptimization: () => Promise<void>;
  isOptimizing: boolean;
  progress: number;
  error: string | null;
}

const OptimizationContext = createContext<OptimizationContextType | undefined>(undefined);

export const OptimizationContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [optimizationResults, setOptimizationResults] = useState<OptimizationResult | null>(null);
  const [designSteels, setDesignSteels] = useState<DesignSteel[]>([]);
  const [moduleSteels, setModuleSteels] = useState<ModuleSteel[]>([]);
  const [constraints, setConstraints] = useState<OptimizationConstraints>(DEFAULT_CONSTRAINTS);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [currentOptimization, setCurrentOptimization] = useState<any>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // 清除优化数据
  const clearOptimizationData = () => {
    setOptimizationResults(null);
    setCurrentOptimization(null);
  };

  // 清除当前优化任务（用于手动返回配置界面时）
  const clearCurrentOptimization = () => {
    setCurrentOptimization(null);
  };

  // 删除设计钢材
  const removeDesignSteel = (id: string) => {
    setDesignSteels(designSteels.filter(steel => steel.id !== id));
  };

  // 添加模块钢材
  const addModuleSteel = (steel: ModuleSteel) => {
    setModuleSteels([...moduleSteels, steel]);
  };

  // 更新模块钢材
  const updateModuleSteel = (id: string, steel: ModuleSteel) => {
    setModuleSteels(moduleSteels.map(s => s.id === id ? steel : s));
  };

  // 删除模块钢材
  const removeModuleSteel = (id: string) => {
    setModuleSteels(moduleSteels.filter(steel => steel.id !== id));
  };

  // 启动优化
  const startOptimization = async () => {
    try {
      setIsOptimizing(true);
      setError(null);
      setProgress(0);

      // 将前端焊接次数转换为后端焊接段数
      const backendConstraints = {
        ...constraints,
        maxWeldingSegments: constraints.maxWeldingSegments + 1
      };

      const optimizationData = {
        designSteels,
        moduleSteels,
        constraints: backendConstraints
      };

      console.log('🚀 开始优化，发送数据:', optimizationData);

      const response = await fetch('/api/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(optimizationData),
      });

      const result = await response.json();

      if (result.success && result.taskId) {
        console.log('✅ 优化任务已创建:', result.taskId);
        
        // 创建优化任务对象
        const optimizationTask = {
          id: result.taskId,
          status: 'pending',
          startTime: new Date().toISOString(),
        };
        
        setCurrentOptimization(optimizationTask);
        
        // 开始轮询任务状态
        pollTaskStatus(result.taskId);
      } else {
        throw new Error(result.error || '优化任务创建失败');
      }
    } catch (error) {
      console.error('❌ 优化失败:', error);
      setError(error instanceof Error ? error.message : '优化失败');
      setIsOptimizing(false);
    }
  };

  // 轮询任务状态
  const pollTaskStatus = async (taskId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/task/${taskId}`);
        const result = await response.json();

        if (result.status === 'completed') {
          console.log('✅ 优化完成:', result);
          setOptimizationResults(result.results);
          setCurrentOptimization((prev: any) => prev ? { ...prev, status: 'completed' } : null);
          setIsOptimizing(false);
          setProgress(100);
          clearInterval(interval);
        } else if (result.status === 'failed') {
          console.error('❌ 优化失败:', result.message);
          setError(result.message || '优化失败');
          setIsOptimizing(false);
          clearInterval(interval);
        } else {
          // 更新进度
          const progress = result.progress || 0;
          setProgress(progress);
          setCurrentOptimization((prev: any) => prev ? { ...prev, status: result.status, progress } : null);
        }
      } catch (error) {
        console.error('❌ 轮询失败:', error);
        setError('获取优化状态失败');
        setIsOptimizing(false);
        clearInterval(interval);
      }
    }, 2000);
  };

  // 从localStorage加载关键数据
  useEffect(() => {
    try {
      const savedDesignSteels = localStorage.getItem('design_steels');
      const savedModuleSteels = localStorage.getItem('module_steels');
      const savedConstraints = localStorage.getItem('optimization_constraints');

      if (savedDesignSteels) setDesignSteels(JSON.parse(savedDesignSteels));
      if (savedModuleSteels) setModuleSteels(JSON.parse(savedModuleSteels));
      if (savedConstraints) setConstraints(JSON.parse(savedConstraints));
    } catch (error) {
      console.error('加载本地数据失败:', error);
    } finally {
      setIsDataLoaded(true);
    }
  }, []);

  return (
    <OptimizationContext.Provider value={{
      optimizationResults,
      setOptimizationResults,
      designSteels,
      setDesignSteels,
      removeDesignSteel,
      moduleSteels,
      setModuleSteels,
      addModuleSteel,
      updateModuleSteel,
      removeModuleSteel,
      constraints,
      setConstraints,
      isDataLoaded,
      clearOptimizationData,
      clearCurrentOptimization,
      currentOptimization,
      startOptimization,
      isOptimizing,
      progress,
      error
    }}>
      {children}
    </OptimizationContext.Provider>
  );
};

export const useOptimizationContext = () => {
  const context = useContext(OptimizationContext);
  if (context === undefined) {
    throw new Error('useOptimizationContext must be used within an OptimizationContextProvider');
  }
  return context;
};