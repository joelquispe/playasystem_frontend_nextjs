'use client';

import { useState } from 'react';
import Image from 'next/image';
import { EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/providers/AuthProvider';
import { ElRoseLogo } from '@/components/auth/ElRoseLogo';
import { ButtonCustom } from '@/components/ui/ButtonCustom';
import { InputCustom } from '@/components/ui/InputCustom';

const loginSchema = z.object({
  username: z.string().min(1, 'Ingresa tu usuario'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="flex min-h-screen items-center justify-start bg-[#f3f0ea] px-6 py-12 md:px-32 lg:px-64">
      <div className="flex w-full max-w-[920px] items-center justify-start gap-10 lg:gap-14">
        <div className="w-full max-w-[380px] shrink-0">
          <ElRoseLogo />

          {errors.root && (
            <div
              className="mb-5 rounded-[10px] bg-red-50 px-3.5 py-3 text-sm font-medium text-red-700"
              role="alert"
            >
              {errors.root.message}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Controller
              name="username"
              control={control}
              render={({ field }) => (
                <InputCustom
                  {...field}
                  id="username"
                  label="Email"
                  type="text"
                  autoComplete="username"
                  placeholder="Correo electrónico"
                  error={errors.username?.message}
                  containerClassName="mb-[22px]"
                />
              )}
            />

            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <InputCustom
                  {...field}
                  id="password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Contraseña"
                  error={errors.password?.message}
                  containerClassName="mb-[22px]"
                  suffix={
                    <button
                      type="button"
                      className="flex cursor-pointer items-center justify-center border-none bg-transparent p-1 text-gray-400"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPassword ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                    </button>
                  }
                />
              )}
            />

            <a
              href="#"
              className="mb-7 inline-block text-sm font-medium text-[#256c86] no-underline hover:underline"
              onClick={(e) => e.preventDefault()}
            >
              ¿Has olvidado tu contraseña?
            </a>

            <ButtonCustom type="submit" fullWidth disabled={isSubmitting}>
              {isSubmitting ? 'Ingresando...' : 'Ingresar'}
            </ButtonCustom>
          </form>
        </div>

        <div className="hidden w-full max-w-[420px] shrink-0 lg:block">
          <Image
            src="/images/login_image.jpeg"
            alt="Login Illustration"
            width={420}
            height={420}
            className="h-auto w-full"
            priority
          />
        </div>
      </div>
    </div>
  );
}
