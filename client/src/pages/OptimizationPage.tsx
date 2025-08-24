import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Space, 
  Upload, 
  message, 
  Form, 
  Input, 
  Row, 
  Col, 

  Table,
  Progress,
  Alert,
  Typography,

  Modal,
  InputNumber,

  Popconfirm
} from 'antd';
import { 
  PlayCircleOutlined, 
  UploadOutlined, 

  DeleteOutlined,
  PlusOutlined,
  EditOutlined,

  ReloadOutlined
} from '@ant-design/icons';
import styled from 'styled-components';
import { useOptimizationContext } from '../contexts/OptimizationContext';
import { useNavigate } from 'react-router-dom';
import { generateDisplayIds } from '../utils/steelUtils';

import { DesignSteel, ModuleSteel } from '../types';
import { DEFAULT_CONSTRAINTS } from '../constants';
// import { saveToLocalStorage, loadFromLocalStorage, clearLocalStorage } from '../utils/storageUtils';

const { Title, Text } = Typography;


const PageContainer = styled.div`
  height: 100%;
  overflow: auto;
  padding: 0;
`;

const StepCard = styled(Card)`
  margin-bottom: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  
  .ant-card-head {
    border-bottom: 1px solid #f0f0f0;
  }
`;



const OptimizationPage: React.FC = () => {
  const [form] = Form.useForm();
  const [moduleForm] = Form.useForm();
  
  // 从Context获取数据和方法
  const {
    designSteels,
    moduleSteels,
    constraints,
    isOptimizing,
    progress,
    error,
    setDesignSteels,
    removeDesignSteel,
    addModuleSteel,
    updateModuleSteel,
    removeModuleSteel,
    setConstraints,
    startOptimization,
    clearOptimizationData,
    clearCurrentOptimization,
    currentOptimization // 确保我们获取了currentOptimization
  } = useOptimizationContext();
  
  const navigate = useNavigate();
  
  // 监听优化任务状态，完成后自动跳转
  useEffect(() => {
    // 只有当存在一个已完成的优化任务，并且我们尚未为该任务导航过时，才执行跳转
    if (currentOptimization && currentOptimization.status === 'completed') {
      // 检查sessionStorage中是否已经标记为已跳转
      const navigatedKey = `navigated_${currentOptimization.id}`;
      const hasNavigated = sessionStorage.getItem(navigatedKey);
      
      if (!hasNavigated) {
        message.success('优化完成！正在跳转到结果页面...', 1.5);
        
        // 在sessionStorage中标记为已跳转
        sessionStorage.setItem(navigatedKey, 'true');
        
        const timer = setTimeout(() => {
          navigate('/results');
        }, 1000);

        // 清理函数保持不变，以防组件在计时器完成前被卸载
        return () => clearTimeout(timer);
      }
    }
  }, [currentOptimization, navigate]);

  // 组件挂载时清理过期的sessionStorage标记
  useEffect(() => {
    // 清理所有过期的navigated标记（保留最近10个）
    const keys = Object.keys(sessionStorage);
    const navigatedKeys = keys.filter(key => key.startsWith('navigated_'));
    
    // 如果超过10个标记，清理最早的
    if (navigatedKeys.length > 10) {
      navigatedKeys.sort();
      const keysToRemove = navigatedKeys.slice(0, navigatedKeys.length - 10);
      keysToRemove.forEach(key => sessionStorage.removeItem(key));
    }
  }, []);

  // 组件卸载时清除当前优化任务，防止返回时重复跳转
  useEffect(() => {
    return () => {
      // 只有当优化已完成时才清除任务，避免中断正在进行的优化
      if (currentOptimization && currentOptimization.status === 'completed') {
        clearCurrentOptimization();
      }
    };
  }, [currentOptimization, clearCurrentOptimization]);
  
  // 本地UI状态
  const [uploading, setUploading] = useState(false);
  const [showDesignModal, setShowDesignModal] = useState(false);
  const [editingDesignSteel, setEditingDesignSteel] = useState<DesignSteel | null>(null);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [editingModuleSteel, setEditingModuleSteel] = useState<ModuleSteel | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = React.useState<React.Key[]>([]);

  // 统一使用稳健的、来自 utils 的显示ID生成逻辑
  const designSteelsForDisplay = React.useMemo(() => {
    return generateDisplayIds(designSteels);
  }, [designSteels]);

  // 生成唯一ID
  const generateId = () => Math.random().toString(36).substr(2, 9);

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => setSelectedRowKeys(newSelectedRowKeys),
  };

  const handleBatchDelete = () => {
    Modal.confirm({
      title: `确认删除选中的${selectedRowKeys.length}条设计钢材吗？`,
      content: '删除后数据不可恢复，请谨慎操作。',
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        setDesignSteels(designSteels.filter((item: DesignSteel) => !selectedRowKeys.includes(item.id)));
        setSelectedRowKeys([]);
        message.success('批量删除成功');
      },
    });
  };

  // ==================== 设计钢材管理 ====================
  
  // 处理设计钢材文件上传
  const handleDesignSteelUpload = async (file: File) => {
    setUploading(true);
    try {
      console.log('=== 设计钢材文件上传开始 ===');
      console.log('文件信息:', {
        name: file.name,
        size: file.size,
        type: file.type
      });
      
      // 读取文件内容
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const base64 = btoa(Array.from(uint8Array, byte => String.fromCharCode(byte)).join(''));
      
      // API调用
      const response = await fetch('/api/upload-design-steels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: file.name,
          data: base64,
          type: file.type
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        // 使用与结果页完全一致的稳定编号逻辑
        const steelsWithStableIds = generateDisplayIds(result.designSteels || []);
        
        // 清除之前的优化结果（因为上传了新数据）
        clearOptimizationData();
        
        // 保存到Context
        setDesignSteels(steelsWithStableIds);
        
        // 智能解析成功消息
        message.success(`${result.message} - 已应用稳定编号体系`);
        
        // 显示智能解析报告
        if (result.analysisReport) {
          const report = result.analysisReport;
          
          // 构建详细报告内容
          let reportContent = [];
          
          // 🆕 表头发现信息
          if (report.headerDiscovery) {
            reportContent.push("🎯 表头发现：");
            reportContent.push(`  • ${report.headerDiscovery.message}`);
            if (report.headerDiscovery.searchScore) {
              reportContent.push(`  • 识别置信度: ${report.headerDiscovery.searchScore}分`);
            }
          }
          
          // 字段识别情况
          if (Object.keys(report.fieldMapping).length > 0) {
            reportContent.push("📊 字段识别情况：");
            Object.entries(report.fieldMapping).forEach(([field, column]) => {
              const confidence = report.confidence[field] || 0;
              reportContent.push(`  • ${field}: "${column}" (置信度: ${confidence}%)`);
            });
          }
          
          // 数据清洗报告
          if (report.cleaningReport && report.cleaningReport.length > 0) {
            reportContent.push("🔧 数据清洗：");
            report.cleaningReport.forEach((action: string) => {
              reportContent.push(`  • ${action}`);
            });
          }
          
          // 未识别的列
          if (report.unidentifiedColumns && report.unidentifiedColumns.length > 0) {
            reportContent.push("⚠️ 未识别的列（已忽略）：");
            reportContent.push(`  • ${report.unidentifiedColumns.join(', ')}`);
          }
          
          // 显示详细报告
          if (reportContent.length > 0) {
            console.log('=== 智能解析报告 ===');
            console.log(reportContent.join('\n'));
            
            // 显示用户友好的解析摘要
            const summaryParts = [];
            if (report.headerDiscovery && report.headerDiscovery.foundAtRow > 1) {
              summaryParts.push(`智能发现表头在第${report.headerDiscovery.foundAtRow}行`);
            }
            if (report.dataStats.validRows > 0) {
              summaryParts.push(`成功解析 ${report.dataStats.validRows} 条数据`);
            }
            if (report.dataStats.skippedRows > 0) {
              summaryParts.push(`跳过 ${report.dataStats.skippedRows} 条无效数据`);
            }
            if (Object.keys(report.fieldMapping).length > 0) {
              summaryParts.push(`识别 ${Object.keys(report.fieldMapping).length} 个字段`);
            }
            
            if (summaryParts.length > 0) {
              message.info(
                `智能解析完成：${summaryParts.join('，')}。查看控制台了解详细信息。`,
                10 // 延长显示时间，因为信息更丰富
              );
            }
            
            // 🆕 特别提示表头发现功能
            if (report.headerDiscovery && report.headerDiscovery.foundAtRow > 1) {
              message.success(
                `✨ 智能功能：自动跳过了前${report.headerDiscovery.foundAtRow - 1}行，在第${report.headerDiscovery.foundAtRow}行找到表头！`,
                8
              );
            }
          }
        }
        
        // 显示传统调试信息（保持兼容性）
        if (result.debugInfo) {
          console.log('=== 解析统计信息 ===');
          console.log('原始行数:', result.debugInfo.原始行数);
          console.log('有效数据:', result.debugInfo.有效数据);
          console.log('跳过行数:', result.debugInfo.跳过行数);
          console.log('字段识别数:', result.debugInfo.字段识别);
          console.log('版本信息:', result.debugInfo.版本信息);
          
          // 兼容旧版本的截面面积统计提示
          if (result.debugInfo.截面面积统计?.无截面面积 > 0) {
            message.warning(
              `注意：${result.debugInfo.截面面积统计.无截面面积} 条数据的截面面积为0，已设为默认值1000mm²！`,
              6
            );
          }
        }
      } else {
        throw new Error(result.error || '上传失败');
      }
      
      console.log('=== 设计钢材文件上传完成 ===');
    } catch (error: any) {
      console.error('=== 设计钢材上传错误 ===', error);
      message.error(`上传失败: ${error.message}`);
    } finally {
      setUploading(false);
    }
    return false;
  };

  // 保存设计钢材
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSaveDesignSteel = (values: any) => {
    const steel: DesignSteel = {
      id: editingDesignSteel?.id || generateId(),
      length: values.length,
      quantity: values.quantity,
      crossSection: values.crossSection,
      // 注意：displayId 由 useMemo 动态生成，此处无需手动赋值
      componentNumber: values.componentNumber,
      specification: values.specification,
      partNumber: values.partNumber
    };

    if (editingDesignSteel) {
      // 更新时，先找到旧数据并替换，然后让 useMemo 重新计算编号
      const updatedSteels = designSteels.map(s => s.id === editingDesignSteel.id ? steel : s);
      setDesignSteels(updatedSteels);
      message.success('设计钢材更新成功');
    } else {
      // 添加时，直接加入列表，让 useMemo 重新计算编号
      setDesignSteels([...designSteels, steel]);
      message.success('设计钢材添加成功');
    }

    setShowDesignModal(false);
    setEditingDesignSteel(null);
    form.resetFields();
  };

  // 删除设计钢材
  const handleDeleteDesignSteel = (steel: DesignSteel) => {
    removeDesignSteel(steel.id);
    message.success('设计钢材删除成功');
  };

  // 编辑设计钢材
  const handleEditDesignSteel = (steel: DesignSteel) => {
    setEditingDesignSteel(steel);
    form.setFieldsValue({
      length: steel.length,
      quantity: steel.quantity,
      crossSection: steel.crossSection,
      componentNumber: steel.componentNumber,
      specification: steel.specification,
      partNumber: steel.partNumber
    });
    setShowDesignModal(true);
  };

  // ==================== 模数钢材管理 ====================
  
  // 保存模数钢材
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSaveModuleSteel = (values: any) => {
    const steel: ModuleSteel = {
      id: editingModuleSteel?.id || generateId(),
      name: values.name,
      length: values.length
    };

    if (editingModuleSteel) {
      updateModuleSteel(editingModuleSteel.id, steel);
      message.success('模数钢材更新成功');
    } else {
      addModuleSteel(steel);
      message.success('模数钢材添加成功');
    }

    setShowModuleModal(false);
    setEditingModuleSteel(null);
    moduleForm.resetFields();
  };

  // 删除模数钢材
  const handleDeleteModuleSteel = (steel: ModuleSteel) => {
    removeModuleSteel(steel.id);
    message.success('模数钢材删除成功');
  };

  // 编辑模数钢材
  const handleEditModuleSteel = (steel: ModuleSteel) => {
    setEditingModuleSteel(steel);
    moduleForm.setFieldsValue({
      name: steel.name,
      length: steel.length
    });
    setShowModuleModal(true);
  };

  // ==================== 优化执行 ====================
  
  const handleStartOptimization = async () => {
    if (designSteels.length === 0) {
      message.error('请先添加或上传设计钢材清单');
      return;
    }

    if (moduleSteels.length === 0) {
      message.error('请先添加模数钢材');
      return;
    }

    // 验证约束条件
    const constraintErrors = validateConstraints();
    if (constraintErrors.length > 0) {
      message.error(`约束条件错误: ${constraintErrors[0]}`);
      return;
    }

    // 验证焊接约束
    const weldingValidation = validateWeldingConstraint();
    if (!weldingValidation.isValid) {
      Modal.confirm({
        title: '焊接约束冲突',
        content: (
          <div>
            <p>{weldingValidation.message}</p>
            <p>是否继续优化？</p>
          </div>
        ),
        okText: '继续优化',
        cancelText: '取消',
        onOk() {
          executeOptimization();
        },
      });
      return;
    }

    executeOptimization();
  };

  const executeOptimization = async () => {
    try {
      console.log('=== 开始优化执行 ===');
      await startOptimization();
    } catch (error: any) {
      console.error('优化失败:', error);
      message.error('优化任务提交失败，请重试');
    }
  };

  const handleReset = () => {
    clearOptimizationData();
    message.success('数据已重置');
  };

  // ==================== 约束条件管理 ====================
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleConstraintChange = (field: string, value: any) => {
    setConstraints({
      ...constraints,
      [field]: value
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const resetConstraints = () => {
    Modal.confirm({
      title: '重置约束条件',
      content: '确定要重置所有约束条件为默认值吗？',
      okText: '确定',
      cancelText: '取消',
      onOk() {
        // 🔧 修复：使用统一的默认约束配置，消除硬编码
        setConstraints({ ...DEFAULT_CONSTRAINTS });
        message.success('约束条件已重置');
      },
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getConstraintDescription = (field: string) => {
    const descriptions = {
      wasteThreshold: '当余料长度小于此值时，将被视为废料无法再次利用',
      targetLossRate: '算法优化时的目标损耗率，作为参考值（不是强制要求）',
      timeLimit: '算法计算的最大允许时间，超时后返回当前最优解',
      maxWeldingSegments: '切割过程中允许的最大焊接次数，0次表示不允许焊接（V3新增功能）'
    };
    return descriptions[field as keyof typeof descriptions] || '';
  };

  const validateConstraints = () => {
    const errors: string[] = [];
    
    if (constraints.wasteThreshold < 100 || constraints.wasteThreshold > 2000) {
      errors.push('废料阈值必须在100-2000mm之间');
    }
    
    if (constraints.targetLossRate < 0 || constraints.targetLossRate > 20) {
      errors.push('目标损耗率必须在0-20%之间');
    }
    
    if (constraints.timeLimit < 1 || constraints.timeLimit > 300) {
      errors.push('计算时间限制必须在1-300秒之间');
    }
    
    if (constraints.maxWeldingSegments < 0 || constraints.maxWeldingSegments > 9) {
      errors.push('最大焊接次数必须在0-9次之间');
    }
    
    return errors;
  };

  const validateWeldingConstraint = () => {
    if (designSteels.length === 0 || moduleSteels.length === 0) {
      return { isValid: true, message: '' };
    }

    const maxModuleLength = Math.max(...moduleSteels.map(m => m.length));
    const conflictSteels = designSteels.filter(d => d.length > maxModuleLength);
    
    if (conflictSteels.length > 0 && constraints.maxWeldingSegments === 0) {
      const maxDesignLength = Math.max(...conflictSteels.map(s => s.length));
      const requiredTimes = Math.ceil(maxDesignLength / maxModuleLength) - 1;
      
      return {
        isValid: false,
        message: `有 ${conflictSteels.length} 根设计钢材长度超过最长模数钢材(${maxModuleLength}mm)，建议将最大焊接次数调整为 ${requiredTimes} 次以上`
      };
    }

    return { isValid: true, message: '' };
  };

  // ==================== 表格列定义 ====================
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const columns = [
    {
      title: '分组编号',
      dataIndex: 'displayId',
      key: 'displayId',
      render: (value: string) => value || '-',
      width: 100,
    },
    {
      title: '构件编号',
      dataIndex: 'componentNumber',
      key: 'componentNumber',
      render: (value: string) => value || '-',
    },
    {
      title: '规格',
      dataIndex: 'specification',
      key: 'specification',
      render: (value: string) => value || '-',
    },
    {
      title: '长度 (mm)',
      dataIndex: 'length',
      key: 'length',
      render: (value: number) => value?.toLocaleString() || '-',
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (value: number) => value?.toLocaleString() || '-',
    },
    {
      title: '截面积 (mm²)',
      dataIndex: 'crossSection',
      key: 'crossSection',
      render: (value: number) => value?.toLocaleString() || '-',
    },
    {
      title: '部件编号',
      dataIndex: 'partNumber',
      key: 'partNumber',
      render: (value: string) => value || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: DesignSteel) => (
        <Space size="small">
          <Button 
            type="text" 
            icon={<EditOutlined />}
            onClick={() => handleEditDesignSteel(record)}
            size="small"
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除这条设计钢材吗？"
            onConfirm={() => handleDeleteDesignSteel(record)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              size="small"
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const moduleColumns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '长度 (mm)',
      dataIndex: 'length',
      key: 'length',
      sorter: (a: ModuleSteel, b: ModuleSteel) => a.length - b.length,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: ModuleSteel) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEditModuleSteel(record)}
            size="small"
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除这个模数钢材吗？"
            onConfirm={() => handleDeleteModuleSteel(record)}
            okText="确定"
            cancelText="取消"
          >
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />}
              size="small"
          >
            删除
          </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer>
      <div style={{ padding: '24px' }}>
        <Title level={2} style={{ marginBottom: 24 }}>钢结构优化设计</Title>
        
        {/* 设计钢材管理 */}
        <StepCard title="设计钢材管理">
          <Row gutter={16}>
            <Col span={12}>
              <Upload
                accept=".xlsx,.xls"
                showUploadList={false}
                beforeUpload={(file) => {
                  handleDesignSteelUpload(file);
                  return false;
                }}
              >
                <Button icon={<UploadOutlined />} loading={uploading}>
                  上传设计钢材
                </Button>
              </Upload>
            </Col>
            <Col span={12}>
              <Space>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowDesignModal(true)}>
                  添加设计钢材
                </Button>
                {selectedRowKeys.length > 0 && (
                  <Popconfirm
                    title={`确认删除选中的${selectedRowKeys.length}条设计钢材吗？`}
                    onConfirm={handleBatchDelete}
                    okText="确认"
                    cancelText="取消"
                  >
                    <Button danger icon={<DeleteOutlined />}>
                      批量删除
                    </Button>
                  </Popconfirm>
                )}
              </Space>
            </Col>
          </Row>
          
          <Table
            rowSelection={rowSelection}
            columns={[
              {
                title: '编号',
                dataIndex: 'displayId',
                key: 'displayId',
                width: 80,
              },
              {
                title: '名称',
                dataIndex: 'name',
                key: 'name',
                width: 120,
              },
              {
                title: '规格',
                dataIndex: 'specification',
                key: 'specification',
                width: 100,
              },
              {
                title: '长度(m)',
                dataIndex: 'length',
                key: 'length',
                width: 80,
                render: (length: number) => length.toFixed(2),
              },
              {
                title: '数量',
                dataIndex: 'quantity',
                key: 'quantity',
                width: 60,
              },
              {
                title: '操作',
                key: 'action',
                width: 100,
                render: (_, record: DesignSteel) => (
                  <Space>
                    <Button
                      type="link"
                      icon={<EditOutlined />}
                      onClick={() => {
                        setEditingDesignSteel(record);
                        setShowDesignModal(true);
                      }}
                    />
                    <Button
                      type="link"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleDeleteDesignSteel(record)}
                    />
                  </Space>
                ),
              },
            ]}
            dataSource={designSteelsForDisplay}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            style={{ marginTop: 16 }}
          />
        </StepCard>
        
        {/* 模块钢材管理 */}
        <StepCard title="模块钢材管理">
          <Row gutter={16}>
            <Col span={12}>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowModuleModal(true)}>
                添加模块钢材
              </Button>
            </Col>
          </Row>
          
          <Table
            columns={[
              {
                title: '编号',
                dataIndex: 'displayId',
                key: 'displayId',
                width: 80,
              },
              {
                title: '名称',
                dataIndex: 'name',
                key: 'name',
                width: 120,
              },
              {
                title: '规格',
                dataIndex: 'specification',
                key: 'specification',
                width: 100,
              },
              {
                title: '长度(m)',
                dataIndex: 'length',
                key: 'length',
                width: 80,
                render: (length: number) => length.toFixed(2),
              },
              {
                title: '数量',
                dataIndex: 'quantity',
                key: 'quantity',
                width: 60,
              },
              {
                title: '操作',
                key: 'action',
                width: 100,
                render: (_, record: ModuleSteel) => (
                  <Space>
                    <Button
                      type="link"
                      icon={<EditOutlined />}
                      onClick={() => {
                        setEditingModuleSteel(record);
                        setShowModuleModal(true);
                      }}
                    />
                    <Button
                      type="link"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleDeleteModuleSteel(record)}
                    />
                  </Space>
                ),
              },
            ]}
            dataSource={moduleSteels.map((steel, index) => ({
              ...steel,
              displayId: `M${(index + 1).toString().padStart(3, '0')}`,
            }))}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            style={{ marginTop: 16 }}
          />
        </StepCard>
        
        {/* 约束条件 */}
        <StepCard title="约束条件">
          <Form layout="vertical">
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="最大余量(mm)" name="maxRemainder">
                  <InputNumber min={0} max={1000} step={1} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="最小余量(mm)" name="minRemainder">
                  <InputNumber min={0} max={1000} step={1} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="优化算法" name="algorithm">
                  <Input placeholder="默认算法" />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </StepCard>
        
        {/* 优化操作 */}
        <StepCard title="优化操作">
          <Space>
            <Button
              type="primary"
              size="large"
              icon={<PlayCircleOutlined />}
              onClick={handleStartOptimization}
              loading={isOptimizing}
              disabled={designSteels.length === 0}
            >
              开始优化
            </Button>
            <Button
              size="large"
              icon={<ReloadOutlined />}
              onClick={() => {
                Modal.confirm({
                  title: '确认重置',
                  content: '重置将清除所有当前数据，确定要继续吗？',
                  onOk: handleReset,
                });
              }}
            >
              重置数据
            </Button>
          </Space>
          
          {isOptimizing && (
            <div style={{ marginTop: 16 }}>
              <Progress percent={progress} status="active" />
              <Text type="secondary">正在优化中，请稍候...</Text>
            </div>
          )}
          
          {error && (
            <Alert
              message="优化失败"
              description={error}
              type="error"
              style={{ marginTop: 16 }}
            />
          )}
        </StepCard>
      </div>
    </PageContainer>
  );
}

export default OptimizationPage;