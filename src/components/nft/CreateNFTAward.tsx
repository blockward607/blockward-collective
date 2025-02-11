
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, ImagePlus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { NFTImageUpload } from "./NFTImageUpload";
import { StudentSelect } from "./StudentSelect";
import { NFTAwardForm } from "./NFTAwardForm";

export const CreateNFTAward = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    points: 100,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!imageUrl) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please upload or generate an image"
      });
      return;
    }

    setLoading(true);

    try {
      // Get teacher's wallet
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', (await supabase.auth.getSession()).data.session?.user.id)
        .single();

      if (walletError) throw walletError;

      const metadata = {
        name: formData.title,
        description: formData.description,
        points: formData.points,
        image: imageUrl,
        created_at: new Date().toISOString(),
      };

      // Create NFT with required fields
      const { data: nft, error: nftError } = await supabase
        .from('nfts')
        .insert({
          token_id: `award-${Date.now()}`,
          contract_address: "0x" + Math.random().toString(16).slice(2, 42),
          metadata,
          creator_wallet_id: walletData.id,
          image_url: imageUrl,
          owner_wallet_id: null, // Will be set when transferred
          network: "testnet",
        })
        .select()
        .single();

      if (nftError) throw nftError;

      toast({
        title: "Success",
        description: "NFT Award created successfully",
      });

      setFormData({ title: "", description: "", points: 100 });
      setImageUrl(null);
      setSelectedStudent("");
    } catch (error: any) {
      console.error('Error creating NFT:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create NFT Award",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 glass-card">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 rounded-full bg-purple-600/20">
            <Trophy className="w-6 h-6 text-purple-400" />
          </div>
          <h2 className="text-2xl font-semibold gradient-text">Create NFT Award</h2>
        </div>

        <NFTAwardForm 
          formData={formData}
          onChange={setFormData}
        />

        <NFTImageUpload
          imageUrl={imageUrl}
          onImageSelect={setImageUrl}
        />

        <div>
          <StudentSelect
            value={selectedStudent}
            onChange={setSelectedStudent}
          />
        </div>

        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={loading || !formData.title || !formData.description || !imageUrl}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <ImagePlus className="w-4 h-4 mr-2" />
                Create NFT Award
              </>
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
};
