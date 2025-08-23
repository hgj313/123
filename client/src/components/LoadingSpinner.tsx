import React from 'react';
import styled, { keyframes } from 'styled-components';

// 定义旋转动画
const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

// 样式化组件
const Spinner = styled.div`
  border: 3px solid #f3f3f3;
  border-top: 3px solid #1677ff;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  animation: ${spin} 1s linear infinite;
  margin: 0 auto;
`;

const LoadingText = styled.p`
  text-align: center;
  color: #1677ff;
  font-size: 14px;
  margin-top: 8px;
`;

interface LoadingSpinnerProps {
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ text = '加载中...' }) => {
  return (
    <div>
      <Spinner />
      <LoadingText>{text}</LoadingText>
    </div>
  );
};

export default LoadingSpinner;