import { Auth as SupabaseAuth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Auth = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [role, setRole] = useState<'teacher' | 'student'>('teacher');

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/dashboard');
      }
    });

    // Handle auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        // Set user role
        if (session) {
          const { data: existingRole } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .single();

          if (!existingRole) {
            const { error: roleError } = await supabase
              .from('user_roles')
              .insert([{ user_id: session.user.id, role }]);

            if (roleError) {
              toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to set user role",
              });
              return;
            }
          }

          // Create wallet if it doesn't exist
          const { data: existingWallet } = await supabase
            .from('wallets')
            .select('*')
            .eq('user_id', session.user.id)
            .maybeSingle();

          if (!existingWallet) {
            const { error: walletError } = await supabase
              .from('wallets')
              .insert([{
                user_id: session.user.id,
                address: `0x${Math.random().toString(36).substring(2, 15)}`,
                type: role === 'teacher' ? 'admin' : 'user'
              }]);

            if (walletError) {
              toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to create wallet",
              });
              return;
            }
          }

          // Create teacher profile if needed
          if (role === 'teacher') {
            const { data: existingProfile } = await supabase
              .from('teacher_profiles')
              .select('*')
              .eq('user_id', session.user.id)
              .maybeSingle();

            if (!existingProfile) {
              const { error: profileError } = await supabase
                .from('teacher_profiles')
                .insert([{ user_id: session.user.id }]);

              if (profileError) {
                toast({
                  variant: "destructive",
                  title: "Error",
                  description: "Failed to create teacher profile",
                });
                return;
              }
            }
          }
        }

        toast({
          title: "Welcome!",
          description: "You have successfully signed in.",
        });
        navigate('/dashboard');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, toast, role]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-[#1A1F2C] to-black">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="glass-card p-8">
          <Tabs defaultValue="teacher" onValueChange={(value) => setRole(value as 'teacher' | 'student')}>
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="teacher">Teacher</TabsTrigger>
              <TabsTrigger value="student">Student</TabsTrigger>
            </TabsList>
          </Tabs>

          <SupabaseAuth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: "rgb(139, 92, 246)",
                    brandAccent: "rgb(124, 58, 237)",
                  },
                },
              },
            }}
            theme="dark"
            providers={[]}
            redirectTo={`${window.location.origin}/dashboard`}
          />
        </Card>
      </motion.div>
    </div>
  );
};

export default Auth;