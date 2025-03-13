
import { supabase } from '@/integrations/supabase/client';

export const AuthService = {
  
  // Check if a user role exists
  checkUserRole: async (userId: string) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .single();
      
    if (error && !error.message.includes('No rows found')) {
      console.error('Error checking user role:', error);
      throw error;
    }
    
    return { data, error };
  },
  
  // Create a user role
  createUserRole: async (userId: string, role: 'teacher' | 'student') => {
    const { data, error } = await supabase
      .from('user_roles')
      .insert({ user_id: userId, role })
      .select()
      .single();
      
    if (error) {
      console.error('Error creating user role:', error);
      throw error;
    }
    
    return { data, error };
  },
  
  // Check if a wallet exists
  checkUserWallet: async (userId: string) => {
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();
      
    if (error && !error.message.includes('No rows found')) {
      console.error('Error checking user wallet:', error);
      throw error;
    }
    
    return { data, error };
  },
  
  // Create a user wallet
  createUserWallet: async (userId: string, type: 'user' | 'admin', address: string) => {
    const { data, error } = await supabase
      .from('wallets')
      .insert({ 
        user_id: userId, 
        type,
        address
      })
      .select()
      .single();
      
    if (error) {
      console.error('Error creating user wallet:', error);
      throw error;
    }
    
    return { data, error };
  },
  
  // Check if a teacher profile exists
  checkTeacherProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('teacher_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
      
    if (error && !error.message.includes('No rows found')) {
      console.error('Error checking teacher profile:', error);
      throw error;
    }
    
    return { data, error };
  },
  
  // Create a teacher profile
  createTeacherProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('teacher_profiles')
      .insert({ user_id: userId })
      .select()
      .single();
      
    if (error) {
      console.error('Error creating teacher profile:', error);
      throw error;
    }
    
    return { data, error };
  },
  
  // Check if a student profile exists
  checkStudentProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('user_id', userId)
      .single();
      
    if (error && !error.message.includes('No rows found')) {
      console.error('Error checking student profile:', error);
      throw error;
    }
    
    return { data, error };
  },
  
  // Create a student profile
  createStudentProfile: async (userId: string, email: string) => {
    const username = email.split('@')[0];
    
    const { data, error } = await supabase
      .from('students')
      .insert({
        user_id: userId,
        name: username,
        points: 0
      })
      .select()
      .single();
      
    if (error) {
      console.error('Error creating student profile:', error);
      throw error;
    }
    
    return { data, error };
  }
};
