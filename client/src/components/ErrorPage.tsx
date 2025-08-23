import React from 'react';
import { Button, Result } from 'antd';
import { FrownOutlined } from '@ant-design/icons';

interface ErrorPageProps {
  message?: string;
  onBack?: () => void;
}

const ErrorPage: React.FC<ErrorPageProps> = ({ 
  message = '抱歉，发生了一些错误', 
  onBack 
}) => {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      padding: '24px'
    }}>
      <Result
        icon={<FrownOutlined />}
        title="出错了"
        subTitle={message}
        extra={
          onBack && (
            <Button type="primary" onClick={onBack}>
              返回首页
            </Button>
          )
        }
      />
    </div>
  );
};

export default ErrorPage;