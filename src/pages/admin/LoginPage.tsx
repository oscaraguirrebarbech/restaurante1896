import { useState } from "react";
import { useNavigate } from "react-router";
import { Lock, ShieldCheck } from "lucide-react";
import { trpc } from "@/providers/trpc";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const login = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      localStorage.setItem("admin_token", data.token);
      navigate("/admin");
    },
  });

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <form
        onSubmit={(e) => { e.preventDefault(); login.mutate({ username, password }); }}
        className="w-full max-w-sm space-y-5 rounded-2xl border border-border bg-card p-8"
      >
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/15">
            <ShieldCheck className="h-7 w-7 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-bold">Acceso Administrador</h1>
          <p className="mt-1 text-sm text-muted-foreground">Área restringida del restaurante</p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Usuario</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" className="w-full rounded-xl border border-input bg-background px-4 py-3 outline-none focus:border-primary" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Contraseña</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" className="w-full rounded-xl border border-input bg-background px-4 py-3 outline-none focus:border-primary" />
        </div>
        {login.error && <p className="text-sm text-red-400">{login.error.message}</p>}
        <button disabled={login.isPending || !username || !password} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-bold text-primary-foreground hover:brightness-110 disabled:opacity-50">
          <Lock className="h-4 w-4" /> {login.isPending ? "Verificando..." : "Ingresar"}
        </button>
      </form>
    </div>
  );
}
