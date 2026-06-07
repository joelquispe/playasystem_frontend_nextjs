'use client';

import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Form,
  Input,
  Skeleton,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, SaveOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useSystemConfig, useUpsertConfig } from '@/hooks/useSystemConfig';
import { SystemConfig } from '@/types/api';
import { PageHeader } from '@/components/ui/PageHeader';
import { cardStyle, colors, nestedPanelStyle } from '@/lib/theme';

const { Text } = Typography;

// Known config keys with descriptions
const CONFIG_DESCRIPTIONS: Record<string, string> = {
  parking_name: 'Nombre del establecimiento',
  parking_address: 'Dirección del establecimiento',
  parking_ruc: 'RUC del establecimiento',
  parking_phone: 'Teléfono de contacto',
  default_rate: 'Tarifa por defecto (S/.)',
  max_capacity: 'Capacidad máxima de vehículos',
};

const upsertSchema = z.object({
  configKey: z.string().min(1, 'Requerido'),
  configValue: z.string().min(1, 'Requerido'),
  description: z.string().optional(),
});

type UpsertForm = z.infer<typeof upsertSchema>;

export default function SettingsPage() {
  const { data: configs = [], isLoading, refetch } = useSystemConfig();
  const upsert = useUpsertConfig();

  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const {
    control: addControl,
    handleSubmit: handleAdd,
    reset: resetAdd,
    formState: { errors: addErrors, isSubmitting: addSubmitting },
  } = useForm<UpsertForm>({
    resolver: zodResolver(upsertSchema),
    defaultValues: { configKey: '', configValue: '', description: '' },
  });

  const {
    control: editControl,
    handleSubmit: handleEdit,
    reset: resetEdit,
    formState: { errors: editErrors, isSubmitting: editSubmitting },
  } = useForm<UpsertForm>({
    resolver: zodResolver(upsertSchema),
    defaultValues: { configKey: '', configValue: '', description: '' },
  });

  const startEdit = (config: SystemConfig) => {
    setEditingKey(config.configKey);
    resetEdit({
      configKey: config.configKey,
      configValue: config.configValue,
      description: config.description ?? '',
    });
  };

  const onAdd = async (data: UpsertForm) => {
    await upsert.mutateAsync(data);
    resetAdd();
    setAddOpen(false);
  };

  const onEditSave = async (data: UpsertForm) => {
    await upsert.mutateAsync(data);
    setEditingKey(null);
  };

  const columns: ColumnsType<SystemConfig> = [
    {
      title: 'Clave',
      dataIndex: 'configKey',
      key: 'configKey',
      render: (v: string) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ color: colors.text, fontFamily: 'monospace', fontSize: 13 }}>
            {v}
          </Text>
          {CONFIG_DESCRIPTIONS[v] && (
            <Text style={{ color: colors.textMuted, fontSize: 11 }}>{CONFIG_DESCRIPTIONS[v]}</Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Valor',
      dataIndex: 'configValue',
      key: 'configValue',
      render: (v: string, record: SystemConfig) =>
        editingKey === record.configKey ? (
          <Controller
            name="configValue"
            control={editControl}
            render={({ field }) => (
              <Input
                {...field}
                size="small"
                status={editErrors.configValue ? 'error' : ''}
                style={{ width: 220 }}
              />
            )}
          />
        ) : (
          <Tag
            style={{
              background: colors.nestedBgMuted,
              border: `1px solid ${colors.cardBorder}`,
              color: colors.accent,
              fontFamily: 'monospace',
              fontSize: 13,
            }}
          >
            {v}
          </Tag>
        ),
    },
    {
      title: 'Actualizado',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (v: string) => (
        <Text style={{ color: colors.textMuted, fontSize: 12 }}>{dayjs(v).format('DD/MM/YYYY HH:mm')}</Text>
      ),
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_: unknown, record: SystemConfig) =>
        editingKey === record.configKey ? (
          <Space>
            <Button
              size="small"
              type="primary"
              icon={<SaveOutlined />}
              loading={editSubmitting}
              onClick={handleEdit(onEditSave)}
              style={{ background: '#db2777', borderColor: '#db2777' }}
            >
              Guardar
            </Button>
            <Button size="small" onClick={() => setEditingKey(null)}>
              Cancelar
            </Button>
          </Space>
        ) : (
          <Button size="small" onClick={() => startEdit(record)}>
            Editar
          </Button>
        ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Configuración"
        subtitle="Parámetros del sistema"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setAddOpen(true)}
            style={{ background: '#db2777', borderColor: '#db2777' }}
          >
            Nueva clave
          </Button>
        }
      />

      {/* Add form */}
      {addOpen && (
        <div style={{ ...cardStyle, padding: 20, marginBottom: 20 }}>
          <Text strong style={{ color: colors.text, display: 'block', marginBottom: 12 }}>
            Agregar clave de configuración
          </Text>
          <Form layout="inline" onFinish={handleAdd(onAdd)}>
            <Form.Item
              validateStatus={addErrors.configKey ? 'error' : ''}
              help={addErrors.configKey?.message}
            >
              <Controller
                name="configKey"
                control={addControl}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="Clave (ej. parking_name)"
                    style={{ width: 220 }}
                  />
                )}
              />
            </Form.Item>
            <Form.Item
              validateStatus={addErrors.configValue ? 'error' : ''}
              help={addErrors.configValue?.message}
            >
              <Controller
                name="configValue"
                control={addControl}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="Valor"
                    style={{ width: 200 }}
                  />
                )}
              />
            </Form.Item>
            <Form.Item>
              <Controller
                name="description"
                control={addControl}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="Descripción (opcional)"
                    style={{ width: 200 }}
                  />
                )}
              />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button
                  htmlType="submit"
                  type="primary"
                  loading={addSubmitting}
                  style={{ background: '#db2777', borderColor: '#db2777' }}
                >
                  Guardar
                </Button>
                <Button onClick={() => { setAddOpen(false); resetAdd(); }}>
                  Cancelar
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <Skeleton active />
      ) : (
        <Table
          dataSource={configs}
          columns={columns}
          rowKey="id"
          pagination={false}
          style={cardStyle}
        />
      )}
    </>
  );
}
