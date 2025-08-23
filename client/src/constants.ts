import { OptimizationConstraints } from './types';

export const DEFAULT_CONSTRAINTS: OptimizationConstraints = {
  wasteThreshold: 600,        // 废料阈值 (mm)
  targetLossRate: 5,          // 目标损耗率 (%)
  timeLimit: 300,           // 计算时间限制 (秒)
  maxWeldingSegments: 1,      // 最大焊接次数 (次) - 对应后端2段，允许1次焊接
};