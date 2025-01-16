import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";

type Seat = Database['public']['Tables']['seats']['Row'];

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
      } else {
        fetchSeats();
      }
    };
    checkUser();
  }, [navigate]);

  const fetchSeats = async () => {
    try {
      const { data, error } = await supabase
        .from('seats')
        .select('*')
        .order('row')
        .order('column');

      if (error) throw error;

      if (!data.length) {
        // Initialize seats if none exist
        await initializeSeats();
      } else {
        setSeats(data);
      }
    } catch (error) {
      console.error('Error fetching seats:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load seating plan"
      });
    } finally {
      setLoading(false);
    }
  };

  const initializeSeats = async () => {
    const initialSeats = [];
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 6; col++) {
        initialSeats.push({
          row,
          column: col,
        });
      }
    }

    try {
      const { data, error } = await supabase
        .from('seats')
        .insert(initialSeats)
        .select();

      if (error) throw error;
      if (data) setSeats(data);
    } catch (error) {
      console.error('Error initializing seats:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to initialize seating plan"
      });
    }
  };

  const handleSeatClick = async (seat: Seat) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('seats')
        .update({
          student: seat.student ? null : user.email
        })
        .eq('id', seat.id)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setSeats(seats.map(s => s.id === data.id ? data : s));
        toast({
          title: seat.student ? "Seat unassigned" : "Seat assigned",
          description: seat.student ? "You've removed your seat" : "You've claimed this seat"
        });
      }
    } catch (error) {
      console.error('Error updating seat:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update seat"
      });
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gradient-to-b from-[#1A1F2C] to-black text-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold gradient-text">Dashboard</h1>
          <Button
            onClick={() => supabase.auth.signOut()}
            variant="destructive"
          >
            Sign Out
          </Button>
        </div>

        <Card className="p-6 glass-card">
          <h2 className="text-2xl font-semibold mb-6 gradient-text">Seating Plan</h2>
          {loading ? (
            <p className="text-center">Loading seating plan...</p>
          ) : (
            <div className="grid gap-4">
              {[0, 1, 2, 3, 4].map((row) => (
                <div key={row} className="flex gap-4 justify-center">
                  {seats
                    .filter((seat) => seat.row === row)
                    .map((seat) => (
                      <button
                        key={seat.id}
                        onClick={() => handleSeatClick(seat)}
                        className={`w-24 h-24 glass-card flex items-center justify-center text-center p-2 cursor-pointer transition-colors ${
                          seat.student 
                            ? 'bg-purple-500/20 hover:bg-purple-500/30' 
                            : 'hover:bg-white/20'
                        }`}
                      >
                        {seat.student ? (
                          <span className="text-sm break-words">
                            {seat.student.split('@')[0]}
                          </span>
                        ) : (
                          "Empty Seat"
                        )}
                      </button>
                    ))}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;