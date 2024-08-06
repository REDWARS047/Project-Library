export interface User {
    id: number;
    category: string;
    rfid: string;
    group: string;
    last_name: string;
    given_name: string;
    middle_name: string;
    photo_url: string;
    course_id: number;
}

export interface UserSession {
    session_id: number;
    user_id: number;
    login_timestamp: string;
    logout_timestamp: string | null;
    session_duration: number | null;
}

export interface Department {
    id: number;
    name: string;
}

export interface Course {
    id: number;
    name: string;
    department_id: number;
}

export interface CombinedUserData {
    given_name: string;
    last_name: string;
    student_id: number;
    department: string;
    student_type: string;
    rfid_id: string;
    time_in: string | null;
    time_out: string | null;
    date: string;
    course_id: number;
    course_name: string; // Add this line

}
