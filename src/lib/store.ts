import { writable } from 'svelte/store';
import type { User, Department, Course } from '$lib/usertypes';

export interface LatestUser {
    user: User;
    department: Department;
    course: Course;
    timestamp: string;
    isLoggedIn: boolean;
}

export const latestUser = writable<LatestUser[]>([]); // Ensure this is an array
