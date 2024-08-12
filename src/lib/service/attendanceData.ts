import { supabase } from '$lib/supabaseClient';
import { handleUserLogin, fetchUserCourse, fetchUserDepartment } from '$lib/service/supabaseService';
import type { User, UserSession } from '$lib/usertypes';

export type AttendanceData = {
    [college: string]: {
        [department: string]: number;
    };
};

const attendanceData: AttendanceData = {
    CAS: { COMM: 0, MMA: 0 },
    CHS: { PT: 0, PH: 0, PSY: 0, BIO: 0 },
    ATYCB: { ENT: 0, ACT: 0, MA: 0, TM: 0, REM: 0 },
    CCIS: { EMC: 0, CS: 0, IS: 0 },
    CEA: { AR: 0, ChE: 0, CE: 0, CpE: 0, EE: 0, Ece: 0, IE: 0, ME: 0 },
    SHS: { STEM: 0, TVL: 0, ABM: 0, HUMMS: 0 }
};

export function updateAttendanceData(departmentName: string, courseName: string): void {
    if (attendanceData[departmentName] && attendanceData[departmentName][courseName] !== undefined) {
        attendanceData[departmentName][courseName]++;
    }
}

export async function updateAttendance(rfid: string, users: User[], userSessions: UserSession[]): Promise<void> {
    console.log('Attempting to update attendance for RFID:', rfid);
    const userLogin = await handleUserLogin(rfid, users, userSessions);
    console.log('Login result:', userLogin);

    if (userLogin.success) {
        const user = users.find((u) => u.rfid === rfid);
        if (user) {
            const course = await fetchUserCourse(user.course_id);
            const department = course ? await fetchUserDepartment(course.department_id) : null;

            if (department && course) {
                updateAttendanceData(department.name, course.name);
                console.log('Updated attendanceData:', getAttendanceData());
                console.log('Total Attendance:', getTotalAttendance());
            } else {
                console.error('Department or Course not found for user:', user);
            }
        } else {
            console.error('User not found for RFID:', rfid);
        }
    } else {
        console.error('User login failed:', userLogin.message);
    }
}


export function getTotalAttendance(): number {
    return Object.values(attendanceData).reduce((total, dept) => {
        return total + Object.values(dept).reduce((subTotal, value) => subTotal + value, 0);
    }, 0);
}

export function getAttendanceData(): AttendanceData {
    return attendanceData;
}

export async function fetchAttendanceData() {
    const { data: userSessions, error: userSessionsError } = await supabase
        .from('user_sessions')
        .select('user_id, login_timestamp, logout_timestamp');
    if (userSessionsError) {
        console.error('Error fetching user sessions:', userSessionsError);
        return;
    }

    // Filter user sessions to only include logins
    const loginSessions = userSessions.filter(session => session.login_timestamp && !session.logout_timestamp);
    const userIds = loginSessions.map(session => session.user_id);

    const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, course_id')
        .in('id', userIds);
    if (usersError) {
        console.error('Error fetching users:', usersError);
        return;
    }

    const courseIds = users.map(user => user.course_id);

    const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('id, name, department_id')
        .in('id', courseIds);
    if (coursesError) {
        console.error('Error fetching courses:', coursesError);
        return;
    }

    const departmentIds = courses.map(course => course.department_id);

    const { data: departments, error: departmentsError } = await supabase
        .from('departments')
        .select('id, name')
        .in('id', departmentIds);
    if (departmentsError) {
        console.error('Error fetching departments:', departmentsError);
        return;
    }

    // Reset attendance data
    for (const college in attendanceData) {
        for (const department in attendanceData[college]) {
            attendanceData[college][department] = 0;
        }
    }

    for (const session of loginSessions) {
        const user = users.find(u => u.id === session.user_id);
        if (user) {
            const course = courses.find(c => c.id === user.course_id);
            if (course) {
                const department = departments.find(d => d.id === course.department_id);
                if (department) {
                    updateAttendanceData(department.name, course.name);
                }
            }
        }
    }
}

export async function saveMonthlyAttendanceData(month: string, year: number) {
    for (const college in attendanceData) {
        for (const department in attendanceData[college]) {
            const attendanceCount = attendanceData[college][department];
            const { error } = await supabase.from('attendance_history').insert({
                month,
                year,
                department: college,
                course: department,
                attendance_count: attendanceCount
            });
            if (error) {
                console.error('Error saving monthly attendance data:', error);
            }
        }
    }
}

export function resetAttendanceData() {
    for (const college in attendanceData) {
        for (const department in attendanceData[college]) {
            attendanceData[college][department] = 0;
        }
    }
}
