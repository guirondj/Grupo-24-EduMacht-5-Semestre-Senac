import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

export const cadastroSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  confirmPassword: z.string(),
  role: z.enum(['APPRENTICE', 'MENTOR']),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

export const recuperarSenhaSchema = z.object({
  email: z.string().email('E-mail inválido'),
});

export const profileSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  bio: z.string().max(300, 'Biografia deve ter no máximo 300 caracteres').optional(),
  area: z.string().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type CadastroFormData = z.infer<typeof cadastroSchema>;
export type RecuperarSenhaFormData = z.infer<typeof recuperarSenhaSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
