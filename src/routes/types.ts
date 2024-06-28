export interface User {
    id: number;
    category: string;
    rfid: string;
    group: string;
    last_name: string;
    given_name: string;
    middle_name: string;
    photo_url: string;
}

export interface UserSession {
    session_id: number;
    user_id: number;
    login_timestamp: string;
    logout_timestamp: string | null;
    session_duration: number | null;
}