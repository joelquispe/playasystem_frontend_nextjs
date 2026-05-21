'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Alert, Button, Card, Form, Input, Typography } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { useAuth } from '@/providers/AuthProvider';

const { Title, Text } = Typography;

const loginSchema = z.object({
  username: z.string().min(1, 'Ingresa tu usuario'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/tickets');
    }
  }, [isLoading, isAuthenticated, router]);

  const onSubmit = async (values: LoginForm) => {
    try {
      await login(values.username, values.password);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Credenciales incorrectas';
      setError('root', { message: msg });
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0f0f0f',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #db2777, #9333ea)',
              margin: '0 auto 16px',
            }}
          />
          <Title level={3} style={{ color: '#e0e0e0', margin: 0 }}>
            Playa <span style={{ color: '#db2777' }}>ROSE</span>
          </Title>
          <Text style={{ color: '#888', fontSize: 13 }}>Sistema de gestión de parqueo</Text>
        </div>

        <Card
          style={{
            background: '#1a1a1a',
            border: '1px solid #2d2d2d',
            borderRadius: 12,
          }}
          styles={{ body: { padding: 32 } }}
        >
          <Title level={4} style={{ color: '#e0e0e0', marginBottom: 24, marginTop: 0 }}>
            Iniciar sesión
          </Title>

          {errors.root && (
            <Alert
              message={errors.root.message}
              type="error"
              showIcon
              style={{ marginBottom: 20, background: '#2a1010', border: '1px solid #5a1a1a' }}
            />
          )}

          <Form layout="vertical" onFinish={handleSubmit(onSubmit)} requiredMark={false}>
            <Form.Item
              label={<span style={{ color: '#aaa', fontSize: 13 }}>Usuario</span>}
              validateStatus={errors.username ? 'error' : ''}
              help={errors.username?.message}
            >
              <Controller
                name="username"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    prefix={<UserOutlined style={{ color: '#555' }} />}
                    placeholder="Ingresa tu usuario"
                    size="large"
                    autoComplete="username"
                    style={{ background: '#111', borderColor: '#2d2d2d', color: '#e0e0e0' }}
                  />
                )}
              />
            </Form.Item>

            <Form.Item
              label={<span style={{ color: '#aaa', fontSize: 13 }}>Contraseña</span>}
              validateStatus={errors.password ? 'error' : ''}
              help={errors.password?.message}
              style={{ marginBottom: 24 }}
            >
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <Input.Password
                    {...field}
                    prefix={<LockOutlined style={{ color: '#555' }} />}
                    placeholder="Ingresa tu contraseña"
                    size="large"
                    autoComplete="current-password"
                    style={{ background: '#111', borderColor: '#2d2d2d', color: '#e0e0e0' }}
                  />
                )}
              />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={isSubmitting}
              style={{
                background: '#db2777',
                borderColor: '#db2777',
                height: 44,
                fontWeight: 600,
              }}
            >
              Ingresar
            </Button>
          </Form>
        </Card>
      </div>
    </div>
  );
}
