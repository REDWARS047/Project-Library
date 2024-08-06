import { supabase } from '$lib/supabaseClient';
import type { User, UserSession, CombinedUserData, Department, Course } from '$lib/usertypes';

// Fetch all users
export const fetchUsers = async (): Promise<User[]> => {
    try {
        const { data, error } = await supabase.from('users').select('*');
        if (error) {
            throw error;
        }
        return data as User[];
    } catch (error) {
        console.error('Error fetching users:', error);
        return [];
    }
};

// Fetch all user sessions
export const fetchUserSessions = async (): Promise<UserSession[]> => {
    try {
        const { data, error } = await supabase.from('user_sessions').select('*');
        if (error) {
            throw error;
        }
        return data as UserSession[];
    } catch (error) {
        console.error('Error fetching user sessions:', error);
        return [];
    }
};

// Fetch a user's department
export const fetchUserDepartment = async (departmentId: number): Promise<Department | null> => {
    try {
        const { data, error } = await supabase
            .from('departments')
            .select('*')
            .eq('id', departmentId)
            .single();
        if (error) {
            throw error;
        }
        return data as Department;
    } catch (error) {
        console.error('Error fetching department:', error);
        return null;
    }
};

// Fetch a user's course
export const fetchUserCourse = async (courseId: number): Promise<Course | null> => {
    try {
        const { data, error } = await supabase
            .from('courses')
            .select('*')
            .eq('id', courseId)
            .single();
        if (error) {
            throw error;
        }
        return data as Course;
    } catch (error) {
        console.error('Error fetching course:', error);
        return null;
    }
};

// Fetch all departments
export const fetchDepartments = async (): Promise<Department[]> => {
    try {
        const { data, error } = await supabase.from('departments').select('*');
        if (error) {
            throw error;
        }
        return data as Department[];
    } catch (error) {
        console.error('Error fetching departments:', error);
        return [];
    }
};

// Fetch combined user data
export const fetchCombinedUserData = async (rfid: string): Promise<CombinedUserData | null> => {
    try {
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('rfid', rfid)
            .single();

        if (userError || !user) {
            throw new Error(`User not found: ${userError?.message || 'No user found with the provided RFID'}`);
        }

        const { data: course, error: courseError } = await supabase
            .from('courses')
            .select('*')
            .eq('id', user.course_id)
            .single();

        if (courseError || !course) {
            throw new Error(`Course not found: ${courseError?.message || 'No course found with the provided course ID'}`);
        }

        const { data: department, error: departmentError } = await supabase
            .from('departments')
            .select('*')
            .eq('id', course.department_id)
            .single();

        if (departmentError || !department) {
            throw new Error(`Department not found: ${departmentError?.message || 'No department found with the provided department ID'}`);
        }

        const { data: session, error: sessionError } = await supabase
            .from('user_sessions')
            .select('*')
            .eq('user_id', user.id)
            .order('login_timestamp', { ascending: false })
            .limit(1);

        if (sessionError || session.length === 0) {
            console.warn(`Session not found for user with ID ${user.id}`);
            return {
                given_name: user.given_name,
                last_name: user.last_name,
                student_id: user.id,
                department: department.name,
                course_name: course.name,
                student_type: user.category,
                rfid_id: user.rfid,
                time_in: null,
                time_out: null,
                date: new Date().toLocaleDateString(),
                course_id: user.course_id
            };
        }

        return {
            given_name: user.given_name,
            last_name: user.last_name,
            student_id: user.id,
            department: department.name,
            course_name: course.name,
            student_type: user.category,
            rfid_id: user.rfid,
            time_in: session[0].login_timestamp,
            time_out: session[0].logout_timestamp,
            date: new Date().toLocaleDateString(),
            course_id: user.course_id
        };
    } catch (error) {
        console.error('Error fetching combined user data:', error);
        return null;
    }
};

// Handle user login
export const handleUserLogin = async (
    rfid: string,
    users: User[],
    userSessions: UserSession[]
): Promise<{ message: string; success: boolean }> => {
    try {
        const user = users.find((u) => u.rfid === rfid);
        if (!user) {
            return { message: 'User not found', success: false };
        }

        const lastSession = userSessions.find(
            (session) => session.user_id === user.id && !session.logout_timestamp
        );

        if (lastSession) {
            const { error } = await supabase
                .from('user_sessions')
                .update({ logout_timestamp: new Date().toISOString() })
                .eq('session_id', lastSession.session_id);

            if (error) {
                throw error;
            }

            return { message: 'User logged out successfully', success: true };
        } else {
            const { error } = await supabase.from('user_sessions').insert({
                user_id: user.id,
                login_timestamp: new Date().toISOString()
            });

            if (error) {
                throw error;
            }

            return { message: 'User logged in successfully', success: true };
        }
    } catch (error) {
        console.error('Error handling user login:', error);
        return { message: 'Error handling user login', success: false };
    }
};

// Update user data
export const updateUser = async (user: CombinedUserData) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .update({
                given_name: user.given_name,
                last_name: user.last_name,
                department: user.department,
                category: user.student_type,
                rfid: user.rfid_id,
                course_id: user.course_id
            })
            .eq('id', user.student_id);

        if (error) {
            throw error;
        }

        return data;
    } catch (error) {
        console.error('Error updating user:', error);
        throw error;
    }
};

// Delete user
export const deleteUser = async (userId: number) => {
    try {
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', userId);

        if (error) {
            throw error;
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        throw error;
    }
};

// Format duration
export function formatDuration(durationMs: number): string {
    const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
    const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    const durationSeconds = Math.floor((durationMs % (1000 * 60)) / 1000);

    return `${durationHours} hour${durationHours !== 1 ? 's' : ''} ${durationMinutes} minute${durationMinutes !== 1 ? 's' : ''} ${durationSeconds} second${durationSeconds !== 1 ? 's' : ''}`;
}

// Get tap message
export function getTapMessage(tapCount: number): string {
    switch (tapCount) {
        case 2:
            return 'Please wait a few seconds...';
        case 3:
            return 'Still processing, please be patient...';
        case 4:
            return 'Too many attempts! Please wait a moment.';
        case 6:
            return 'Too many attempts, try again later.';
        default:
            return 'This user has already logged in/out recently. Please wait a few seconds.';
    }
}
