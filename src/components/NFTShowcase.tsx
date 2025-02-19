
import { motion } from "framer-motion";
import { Sparkles, Trophy, Star, Medal, Crown, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Student {
  id: string;
  name: string;
  points: number;
}

interface NFTAward {
  title: string;
  description: string;
  icon: any;
  gradient: string;
  points: number;
}

const nfts: NFTAward[] = [
  {
    title: "Academic Excellence Trophy",
    description: "Awarded for outstanding academic achievement",
    icon: Trophy,
    gradient: "from-yellow-400 to-orange-500",
    points: 1000,
  },
  {
    title: "Innovation Star",
    description: "Recognition for creative thinking and innovation",
    icon: Star,
    gradient: "from-purple-400 to-pink-500",
    points: 750,
  },
  {
    title: "Leadership Crown",
    description: "Awarded for exceptional leadership qualities",
    icon: Crown,
    gradient: "from-blue-400 to-cyan-500",
    points: 850,
  },
  {
    title: "STEM Excellence",
    description: "Outstanding achievement in Science and Technology",
    icon: Brain,
    gradient: "from-green-400 to-emerald-500",
    points: 900,
  },
  {
    title: "Sports Champion",
    description: "Excellence in athletic performance",
    icon: Medal,
    gradient: "from-red-400 to-rose-500",
    points: 800,
  },
  {
    title: "Special Achievement",
    description: "Recognition for exceptional accomplishment",
    icon: Sparkles,
    gradient: "from-indigo-400 to-violet-500",
    points: 700,
  },
];

export const NFTShowcase = () => {
  const { toast } = useToast();
  const [transferring, setTransferring] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [students, setStudents] = useState<Student[]>([]);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('name');

      if (error) throw error;
      setStudents(data || []);
    } catch (error: any) {
      console.error('Error fetching students:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load students"
      });
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []); // Moved after function definition

  const transferNFT = async (nft: NFTAward, studentId: string) => {
    if (!studentId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a student first"
      });
      return;
    }

    try {
      setTransferring(nft.title);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        throw new Error('No authenticated user found');
      }

      const userId = session.user.id;

      // Get or create teacher's wallet
      let teacherWallet = await getOrCreateTeacherWallet(userId);
      if (!teacherWallet) {
        throw new Error('Failed to get or create teacher wallet');
      }

      // Get student's wallet
      const { data: studentWallet, error: studentWalletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', studentId)
        .maybeSingle();

      if (studentWalletError) throw studentWalletError;
      if (!studentWallet) {
        throw new Error('Student wallet not found. Please make sure the student has completed registration.');
      }

      // Create NFT
      const { data: nftData, error: nftError } = await supabase
        .from('nfts')
        .insert({
          token_id: `award-${Date.now()}`,
          contract_address: "0x" + Math.random().toString(16).slice(2, 42),
          metadata: {
            name: nft.title,
            description: nft.description,
            points: nft.points,
            created_at: new Date().toISOString(),
          },
          creator_wallet_id: teacherWallet.id,
          owner_wallet_id: studentWallet.id,
          network: "testnet",
        })
        .select()
        .single();

      if (nftError) throw nftError;

      // Create transaction record
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          nft_id: nftData.id,
          from_wallet_id: teacherWallet.id,
          to_wallet_id: studentWallet.id,
          transaction_hash: "0x" + Math.random().toString(16).slice(2, 62),
          status: 'completed',
        });

      if (transactionError) throw transactionError;

      // Call the increment_student_points function
      const { error: incrementError } = await supabase
        .rpc('increment_student_points', {
          student_id: studentId,
          points_to_add: nft.points
        });

      if (incrementError) throw incrementError;

      toast({
        title: "Success",
        description: `${nft.title} has been transferred successfully!`,
      });
      
      await fetchStudents();
    } catch (error: any) {
      console.error('Error transferring NFT:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to transfer NFT",
      });
    } finally {
      setTransferring(null);
    }
  };

  const getOrCreateTeacherWallet = async (userId: string) => {
    // Try to get existing wallet
    const { data: existingWallet, error: getError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (getError) throw getError;
    if (existingWallet) return existingWallet;

    // Create new wallet if none exists
    const { data: newWallet, error: createError } = await supabase
      .from('wallets')
      .insert({
        user_id: userId,
        address: "0x" + Math.random().toString(16).slice(2, 42),
        type: "admin"
      })
      .select()
      .single();

    if (createError) throw createError;
    return newWallet;
  };

  return (
    <section className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(155,135,245,0.1),transparent_50%)]" />
      
      <div className="container mx-auto px-4 relative">
        <motion.h2 
          className="text-4xl font-bold text-center mb-12 gradient-text"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          NFT Awards Collection
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {nfts.map((nft, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              whileHover={{ y: -10 }}
              className="glass-card p-8 text-center group cursor-pointer"
            >
              <motion.div 
                className={`w-24 h-24 rounded-full bg-gradient-to-r ${nft.gradient} mx-auto mb-6 p-5 group-hover:scale-110 transition-transform duration-300`}
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.8 }}
              >
                <nft.icon className="w-full h-full text-white" />
              </motion.div>
              
              <h3 className="text-xl font-semibold mb-2 group-hover:text-purple-400 transition-colors duration-300">
                {nft.title}
              </h3>
              <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                {nft.description}
              </p>
              <p className="text-sm text-purple-400 mt-2">
                {nft.points} points
              </p>

              <div className="mt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger className="w-full mb-4">
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name} ({student.points} points)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  className="w-full"
                  disabled={transferring === nft.title || !selectedStudent}
                  onClick={() => transferNFT(nft, selectedStudent)}
                >
                  {transferring === nft.title ? "Transferring..." : "Transfer NFT"}
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
