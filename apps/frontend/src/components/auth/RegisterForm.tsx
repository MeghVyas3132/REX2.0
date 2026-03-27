"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { register as registerUser } from "@/features/auth/api";
import { useSession } from "@/lib/auth/session-context";
import { registerSchema, type RegisterFormValues } from "@/lib/validation/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function RegisterForm() {
  const router = useRouter();
  const { signIn } = useSession();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      name: "",
      password: "",
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      const data = await registerUser(values.email, values.name, values.password);
      signIn(data.token, data.user);
      toast.success("Account created");
      router.replace("/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Registration failed");
    }
  };

  return (
    <form className="form" onSubmit={handleSubmit(onSubmit)}>
      <div className="form-row">
        <label htmlFor="name">Name</label>
        <Input id="name" type="text" {...register("name")} />
        {errors.name ? <span className="error-text">{errors.name.message}</span> : null}
      </div>

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
        Create account
      </Button>

      <p>
        Already have an account? <Link href="/login">Sign in</Link>
      </p>
    </form>
  );
}
