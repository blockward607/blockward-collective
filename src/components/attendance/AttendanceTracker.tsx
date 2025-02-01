import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { AttendanceStatus } from "./AttendanceStatus";
import { useToast } from "@/hooks/use-toast";
import { StudentList } from "./StudentList";

interface Student {
  id: string;
  name: string;
  status?: AttendanceStatus;
}

export const AttendanceTracker = ({ classroomId }: { classroomId: string }) => {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const checkUserRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .maybeSingle();
        
        setUserRole(roleData?.role || null);
      }
    };

    checkUserRole();
  }, []);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const { data: classroomStudents, error: classroomError } = await supabase
          .from('classroom_students')
          .select(`
            student_id,
            students (
              id,
              name
            )
          `)
          .eq('classroom_id', classroomId);

        if (classroomError) throw classroomError;

        const today = new Date().toISOString().split('T')[0];
        const { data: attendanceRecords, error: attendanceError } = await supabase
          .from('attendance')
          .select('*')
          .eq('classroom_id', classroomId)
          .eq('date', today);

        if (attendanceError) throw attendanceError;

        if (classroomStudents) {
          const formattedStudents = classroomStudents.map((cs) => ({
            id: cs.students.id,
            name: cs.students.name,
            status: (attendanceRecords?.find(
              (record) => record.student_id === cs.student_id
            )?.status as AttendanceStatus) || 'present'
          }));
          
          setStudents(formattedStudents);
        }
      } catch (error) {
        console.error('Error fetching students:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load students"
        });
      }
      setLoading(false);
    };

    fetchStudents();
  }, [classroomId, toast]);

  const updateStudentStatus = async (studentId: string, status: AttendanceStatus) => {
    if (userRole !== 'teacher') {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Only teachers can update attendance"
      });
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { error } = await supabase
        .from('attendance')
        .upsert({
          student_id: studentId,
          classroom_id: classroomId,
          status,
          date: today
        });

      if (error) throw error;

      setStudents(students.map(student => 
        student.id === studentId 
          ? { ...student, status }
          : student
      ));

      toast({
        title: "Success",
        description: "Attendance status updated"
      });
    } catch (error) {
      console.error('Error updating attendance:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update attendance"
      });
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex justify-center items-center h-40">
          <p>Loading students...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-6">
      <StudentList 
        students={students}
        updateStudentStatus={updateStudentStatus}
        isTeacher={userRole === 'teacher'}
      />
    </Card>
  );
};