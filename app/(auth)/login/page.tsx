'use client';

import { Alert, Button, Card, Input, Typography } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/providers/AuthProvider';

const { Title, Text } = Typography;

const loginSchema = z.object({
  username: z.string().min(1, 'Ingresa tu usuario'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });

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
        backgroundColor: '#f3eee8',
        backgroundImage:
          'linear-gradient(rgba(243, 238, 232, 0.74), rgba(243, 238, 232, 0.82)), url("/images/background_image.png")',
        backgroundPosition: 'center bottom',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
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
              background: 'linear-gradient(145deg, #2f6d73, #6f8f94)',
              margin: '0 auto 16px',
              boxShadow: '0 12px 30px rgba(47, 109, 115, 0.28)',
            }}
          />
          <Title level={3} style={{ color: '#2f3639', margin: 0 }}>
            Playa <span style={{ color: '#2f6d73' }}>ROSE</span>
          </Title>
          <Text style={{ color: '#65767d', fontSize: 13 }}>Sistema de gestión de parqueo</Text>
        </div>

        <Card
          style={{
            background: 'rgba(255, 253, 251, 0.86)',
            border: '1px solid #d9cfc4',
            borderRadius: 16,
            boxShadow: '0 20px 46px rgba(35, 45, 50, 0.14)',
            backdropFilter: 'blur(6px)',
          }}
          styles={{ body: { padding: 32 } }}
        >
          <Title level={4} style={{ color: '#2f3639', marginBottom: 24, marginTop: 0 }}>
            Iniciar sesión
          </Title>

          {errors.root && (
            <Alert
              message={errors.root.message}
              type="error"
              showIcon
              style={{ marginBottom: 20 }}
            />
          )}

          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            <div style={{ marginBottom: 20 }}>
              <label
                htmlFor="username"
                style={{ color: '#65767d', fontSize: 13, display: 'block', marginBottom: 6 }}
              >
                Usuario
              </label>
              <Controller
                name="username"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="username"
                    prefix={<UserOutlined style={{ color: '#8e9ba0' }} />}
                    placeholder="Ingresa tu usuario"
                    size="large"
                    autoComplete="username"
                    status={errors.username ? 'error' : ''}
                    style={{
                      background: '#fffdfb',
                      borderColor: '#d9cfc4',
                      color: '#2f3639',
                      borderRadius: 10,
                    }}
                  />
                )}
              />
              {errors.username?.message && (
                <div style={{ color: '#c4605c', fontSize: 12, marginTop: 6 }}>
                  {errors.username.message}
                </div>
              )}
            </div>

            <div style={{ marginBottom: 24 }}>
              <label
                htmlFor="password"
                style={{ color: '#65767d', fontSize: 13, display: 'block', marginBottom: 6 }}
              >
                Contraseña
              </label>
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <Input.Password
                    {...field}
                    id="password"
                    prefix={<LockOutlined style={{ color: '#8e9ba0' }} />}
                    placeholder="Ingresa tu contraseña"
                    size="large"
                    autoComplete="current-password"
                    status={errors.password ? 'error' : ''}
                    style={{
                      background: '#fffdfb',
                      borderColor: '#d9cfc4',
                      color: '#2f3639',
                      borderRadius: 10,
                    }}
                  />
                )}
              />
              {errors.password?.message && (
                <div style={{ color: '#c4605c', fontSize: 12, marginTop: 6 }}>
                  {errors.password.message}
                </div>
              )}
            </div>

            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={isSubmitting}
              style={{
                background: '#2f6d73',
                borderColor: '#2f6d73',
                height: 44,
                fontWeight: 600,
                borderRadius: 10,
                boxShadow: '0 10px 22px rgba(47, 109, 115, 0.25)',
              }}
            >
              Ingresar
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
