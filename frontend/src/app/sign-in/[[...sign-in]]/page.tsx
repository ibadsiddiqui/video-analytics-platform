import { SignIn } from "@clerk/nextjs";
import { ROUTES } from "@/config/routes";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-mesh px-4">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-20 w-60 h-60 bg-accent-purple/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-40 h-40 bg-accent-pink/10 rounded-full blur-2xl" />
      </div>

      <div className="relative z-10">
        <SignIn routing="path" path={ROUTES.SIGN_IN} />
      </div>
    </div>
  );
}
