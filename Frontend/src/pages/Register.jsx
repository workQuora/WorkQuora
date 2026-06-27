import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

const Register = () => {
  const { register: registerUser, isRegistering } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-gray-800 rounded-2xl border border-gray-700">
      <h2 className="text-2xl font-bold text-white mb-6">Create Account</h2>
      <form onSubmit={handleSubmit(registerUser)}>
        <Input label="Full Name" {...register('name')} error={errors.name?.message} />
        <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
        <Input label="Password" type="password" {...register('password')} error={errors.password?.message} />
        <Button isLoading={isRegistering}>Register Now</Button>
      </form>
    </div>
  );
};