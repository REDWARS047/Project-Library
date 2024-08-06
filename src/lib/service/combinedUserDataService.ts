import { supabase } from '$lib/supabaseClient';
import type { CombinedUserData } from '$lib/usertypes';

export const fetchCombinedUserData = async (rfid: string): Promise<CombinedUserData | null> => {
    try {
        const { data: users, error: userError } = await supabase.from('users').select().eq('rfid', rfid);
        if (userError || !users || users.length === 0) {
            console.error('Error fetching user:', userError);
            return null;
        }

        const user = users[0];
        const { data: courses, error: courseError } = await supabase.from('courses').select().eq('id', user.course_id);
        if (courseError || !courses || courses.length === 0) {
            console.error('Error fetching course:', courseError);
            return null;
        }

        const course = courses[0];
        const { data: departments, error: departmentError } = await supabase.from('departments').select().eq('id', course.department_id);
        if (departmentError || !departments || departments.length === 0) {
            console.error('Error fetching department:', departmentError);
            return null;
        }

        const department = departments[0];
        const { data: sessions, error: sessionError } = await supabase.from('user_sessions').select().eq('user_id', user.id).order('login_timestamp', { ascending: false }).limit(1);
        if (sessionError || !sessions || sessions.length === 0) {
            console.error('Error fetching session:', sessionError);
            return null;
        }

        const session = sessions[0];

        return {
            given_name: user.given_name,
            last_name: user.last_name,
            student_id: user.id,
            department: department.name,
            course_name: course.name, // Ensure course_name is included
            student_type: user.category,
            rfid_id: user.rfid,
            time_in: session ? session.login_timestamp : null,
            time_out: session ? session.logout_timestamp : null,
            date: new Date().toLocaleDateString(),
            course_id: user.course_id
        };
    } catch (error) {
        console.error('Error fetching combined user data:', error);
        return null;
    }
};
