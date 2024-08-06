import { supabase } from '$lib/supabaseClient';
import type { User, UserSession, CombinedUserData, Department, Course } from '$lib/usertypes';

const recentLogins = new Map<string, number>();
const COOLDOWN_PERIOD = 2000; // 2 seconds in milliseconds

function convertToLocalTime(utcTimestamp: string): Date {
    return new Date(utcTimestamp);
}

export async function fetchUsers(): Promise<User[]> {
    try {
        const { data, error } = await supabase.from('users').select('*');
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching users:', error);
        return [];
    }
}

export async function fetchUserSessions(): Promise<UserSession[]> {
    try {
        const { data, error } = await supabase.from('user_sessions').select('*');
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching user sessions:', error);
        return [];
    }
}

export async function fetchUserDepartment(departmentId: number): Promise<Department | null> {
    try {
        const { data, error } = await supabase
            .from('departments')
            .select('*')
            .eq('id', departmentId)
            .single();
        if (error) throw error;
        console.log('Fetched Department Data:', data);
        return data;
    } catch (error) {
        console.error('Error fetching department:', error);
        return null;
    }
}

export async function fetchUserCourse(courseId: number): Promise<Course | null> {
    try {
        const { data, error } = await supabase
            .from('courses')
            .select('*')
            .eq('id', courseId)
            .single();
        if (error) throw error;
        console.log('Fetched Course Data:', data);
        return data;
    } catch (error) {
        console.error('Error fetching course:', error);
        return null;
    }
}

export async function fetchCombinedUserData(rfid: string): Promise<CombinedUserData | null> {
    try {
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('rfid', rfid)
            .single();

        if (userError || !user) {
            throw new Error(`User not found: ${userError?.message || 'No user found with the provided RFID'}`);
        }

        const course = await fetchUserCourse(user.course_id);
        if (!course) {
            throw new Error('Course not found');
        }

        const department = await fetchUserDepartment(course.department_id);
        if (!department) {
            throw new Error('Department not found');
        }

        const { data: session, error: sessionError } = await supabase
            .from('user_sessions')
            .select('*')
            .eq('user_id', user.id)
            .order('login_timestamp', { ascending: false })
            .limit(1);

        return {
            given_name: user.given_name,
            last_name: user.last_name,
            student_id: user.id,
            department: department.name,
            course_name: course.name,
            student_type: user.category,
            rfid_id: user.rfid,
            time_in: session?.[0]?.login_timestamp || null,
            time_out: session?.[0]?.logout_timestamp || null,
            date: new Date().toLocaleDateString(),
            course_id: user.course_id
        };
    } catch (error) {
        console.error('Error fetching combined user data:', error);
        return null;
    }
}

export async function handleUserLogin(rfid: string, users: User[], userSessions: UserSession[]) {
    const currentTime = Date.now();
    const lastLoginTime = recentLogins.get(rfid) || 0;

    if (currentTime - lastLoginTime < COOLDOWN_PERIOD) {
        console.log(`Blocked attempt for RFID ${rfid}. Time since last attempt: ${currentTime - lastLoginTime}ms`);
        return {
            message: 'Please wait a few seconds before trying again.',
            success: false
        };
    }

    recentLogins.set(rfid, currentTime);

    const user = users.find((u) => u.rfid === rfid);
    if (!user) {
        return { message: 'User not found', success: false };
    }

    const currentDateTime = new Date();
    const existingSession = userSessions.find(
        (session) => session.user_id === user.id && !session.logout_timestamp
    );

    try {
        if (existingSession) {
            await logoutUser(existingSession, user, currentDateTime);
            return { message: `Goodbye, ${user.given_name} ${user.last_name}.`, success: true };
        } else {
            await loginUser(user, currentDateTime);
            return { message: `Welcome, ${user.given_name} ${user.last_name}.`, success: true };
        }
    } catch (error) {
        console.error('Error handling user login:', error);
        return { message: 'An error occurred. Please try again.', success: false };
    }
}

async function loginUser(user: User, currentTime: Date) {
    const loginTime = currentTime.toISOString();
    const { error } = await supabase.from('user_sessions').insert([
        {
            user_id: user.id,
            login_timestamp: loginTime,
            logout_timestamp: null,
            session_duration: null
        }
    ]);

    if (error) throw error;
}

async function logoutUser(session: UserSession, user: User, currentTime: Date) {
    const logoutTime = currentTime.toISOString();
    const loginTime = new Date(session.login_timestamp);
    const formattedDuration = formatDuration(currentTime.getTime() - loginTime.getTime());

    const { error } = await supabase
        .from('user_sessions')
        .update({
            logout_timestamp: logoutTime,
            session_duration: formattedDuration
        })
        .eq('session_id', session.session_id);

    if (error) throw error;
}

export function formatDuration(durationMs: number): string {
    const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
    const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    const durationSeconds = Math.floor((durationMs % (1000 * 60)) / 1000);

    return `${durationHours} hour${durationHours !== 1 ? 's' : ''} ${durationMinutes} minute${durationMinutes !== 1 ? 's' : ''} ${durationSeconds} second${durationSeconds !== 1 ? 's' : ''}`;
}

// Commented out as it's not used in the merged version
// export function getTapMessage(tapCount: number): string {
//     // ... (implementation as before)
// }

// Additional functions from the original version that might be useful
export const fetchDepartments = async (): Promise<Department[]> => {
    try {
        const { data, error } = await supabase.from('departments').select('*');
        if (error) throw error;
        return data as Department[];
    } catch (error) {
        console.error('Error fetching departments:', error);
        return [];
    }
};

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

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error updating user:', error);
        throw error;
    }
};

export const deleteUser = async (userId: number) => {
    try {
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', userId);

        if (error) throw error;
    } catch (error) {
        console.error('Error deleting user:', error);
        throw error;
    }
};
