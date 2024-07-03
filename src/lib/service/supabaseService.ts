import { supabase } from '$lib/supabaseClient';
import type { User, UserSession } from '$lib/usertypes';

let recentLogins = new Map<string, { timestamp: number; tapCount: number }>();

function convertToLocalTime(utcTimestamp: string): Date {
	return new Date(utcTimestamp);
}

export async function fetchUsers(): Promise<User[]> {
	try {
		const { data, error } = await supabase.from('users').select();
		if (error) {
			console.error('Error fetching users:', error);
			return [];
		}
		return data || [];
	} catch (error) {
		console.error('Error fetching users:', error);
		return [];
	}
}

export async function fetchUserSessions(): Promise<UserSession[]> {
	try {
		const { data, error } = await supabase.from('user_sessions').select();
		if (error) {
			console.error('Error fetching user sessions:', error);
			return [];
		}
		return data || [];
	} catch (error) {
		console.error('Error fetching user sessions:', error);
		return [];
	}
}

export async function handleUserLogin(rfid: string, users: User[], userSessions: UserSession[]) {
	const currentTime = Date.now();
	const recentEntry = recentLogins.get(rfid);

	if (recentEntry && currentTime - recentEntry.timestamp < 5000) {
		recentEntry.tapCount++;
		return {
			message: getTapMessage(recentEntry.tapCount),
			success: false
		};
	}

	recentLogins.set(rfid, { timestamp: currentTime, tapCount: 1 });

	const user = users.find((u) => u.rfid === rfid);
	if (!user) {
		return {
			message: 'User not found!',
			success: false
		};
	}

	const currentDateTime = new Date();
	const existingSession = userSessions.find(
		(session) => session.user_id === user.id && session.logout_timestamp === null
	);

	try {
		if (existingSession) {
			await logoutUser(existingSession, user, currentDateTime);
		} else {
			await loginUser(user, currentDateTime);
		}
		return {
			message: existingSession
				? `Goodbye, ${user.given_name} ${user.last_name}.`
				: `Welcome, ${user.given_name} ${user.last_name}.`,
			success: true
		};
	} catch (error) {
		console.error('Error handling user login:', error);
		return {
			message: 'An error occurred. Please try again.',
			success: false
		};
	} finally {
		setTimeout(() => recentLogins.delete(rfid), 7000);
	}
}

async function loginUser(user: User, currentTime: Date) {
	try {
		const loginTime = currentTime.toLocaleString();
		const { error } = await supabase.from('user_sessions').insert([
			{
				user_id: user.id,
				login_timestamp: loginTime,
				logout_timestamp: null,
				session_duration: null
			}
		]);

		if (error) {
			console.error('Error logging in user:', error);
			throw new Error(error.message);
		}
	} catch (error) {
		console.error('Error logging in user:', error);
		throw error;
	}
}

async function logoutUser(session: UserSession, user: User, currentTime: Date) {
	try {
		const sessionId = session.session_id;
		const logoutTimeString = currentTime.toLocaleString();
		const loginTime = convertToLocalTime(session.login_timestamp);
		const formattedDuration = formatDuration(currentTime.getTime() - loginTime.getTime());
        
		const { error } = await supabase
			.from('user_sessions')
			.update({
				logout_timestamp: logoutTimeString,
				session_duration: formattedDuration
			})
			.eq('session_id', sessionId);

		if (error) {
			console.error('Error logging out user:', error);
			throw new Error(error.message);
		}
	} catch (error) {
		console.error('Error logging out user:', error);
		throw error;
	}
}

function formatDuration(durationMs: number): string {
	const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
	const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
	const durationSeconds = Math.floor((durationMs % (1000 * 60)) / 1000);


	return `${durationHours} hour${durationHours !== 1 ? 's' : ''} ${durationMinutes} minute${durationMinutes !== 1 ? 's' : ''} ${durationSeconds} second${durationSeconds !== 1 ? 's' : ''}`;
}

function getTapMessage(tapCount: number): string {
	switch (tapCount) {
		case 2:
			return 'Please wait a few seconds...';
		case 3:
			return 'Still processing, please be patient...';
		case 4:
			return 'Too many attempts! YAWA PAG HULAT';
		case 6:
			return 'Pisti ay!';
		default:
			return 'This user has already logged in/out recently. Please wait a few seconds.';
	}
}
