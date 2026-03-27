"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { login } from "@/features/auth/api";
import { useSession } from "@/lib/auth/session-context";
import { loginSchema, type LoginFormValues } from "@/lib/validation/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function LoginForm() {
  const router = useRouter();
  const { signIn } = useSession();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      const data = await login(values.email, values.password);
      signIn(data.token, data.user);
      toast.success("Signed in");
      router.replace("/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed");
    }
  };

  return (
    <form className="form" onSubmit={handleSubmit(onSubmit)}>
      <div className="form-row">
        <label htmlFor="email">Email</label>
        <Input id="email" type="email" {...register("email")} />
        {errors.email ? <span className="error-text">{errors.email.message}</span> : null}
      </div>

      <div className="form-row">
        <label htmlFor="password">Password</label>
        <Input id="password" type="password" {...register("password")} />
        {errors.password ? <span className="error-text">{errors.password.message}</span> : null}
      </div>

      <Button type="submit" loading={isSubmitting}>
        Sign in
      </Button>

      <p>
        Need an account? <Link href="/register">Register</Link>
      </p>
    </form>
  );
}
