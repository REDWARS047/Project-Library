<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import type { User, UserSession, Department, Course } from '$lib/usertypes';
	import {
		handleUserLogin,
		fetchUsers,
		fetchUserSessions,
		fetchUserDepartment,
		fetchUserCourse
	} from '$lib/service/supabaseService';
	import LoginInput from '$lib/components/rfid/RFIDInput.svelte';
	import LoginMessage from '$lib/components/rfid/RFIDMessage.svelte';
	import { goto } from '$app/navigation';
	import { Modal } from 'flowbite-svelte';

	export let users: User[] = [];
	export let userSessions: UserSession[] = [];
	let latestUserSession: UserSession | null = null;
	let loginMessage = '';
	let loginOutSuccessful = false;
	let messageTimeoutId: string | number | NodeJS.Timeout | undefined;
	let intervalId: ReturnType<typeof setInterval>;
	let defaultModal = false;
	let modalTimeoutId: string | number | NodeJS.Timeout | undefined;

	async function refreshData() {
		try {
			console.log('Refreshing data...');
			users = await fetchUsers();
			userSessions = await fetchUserSessions();
			latestUserSession = getLatestUserSession(userSessions);
			console.log('Data refreshed:', { users, userSessions, latestUserSession });
		} catch (error) {
			console.error('Error refreshing data:', error);
		}
	}

	function getLatestUserSession(sessions: UserSession[]): UserSession | null {
		if (sessions.length === 0) return null;
		return sessions.reduce((latest, session) => {
			return new Date(session.login_timestamp) > new Date(latest.login_timestamp)
				? session
				: latest;
		}, sessions[0]);
	}

	onMount(async () => {
		console.log('Component mounted');
		await refreshData();
		intervalId = setInterval(refreshData, 35000);
	});

	onDestroy(() => {
		console.log('Component destroyed');
		clearInterval(intervalId);
	});

	let latestUser: {
		user: User;
		department: Department;
		course: Course;
		timestamp: string;
		isLoggedIn: boolean;
	} | null = null;

	async function onLogin(event: CustomEvent<string>) {
		const rfid = event.detail;
		console.log('RFID received:', rfid);
		if (rfid.length !== 10) {
			console.warn('Invalid RFID length');
			return;
		}
		const { message, success } = await handleUserLogin(rfid, users, userSessions);
		loginMessage = message;
		loginOutSuccessful = success;
		console.log('Login result:', { message, success });
		userSessions = await fetchUserSessions();
		latestUserSession = getLatestUserSession(userSessions);
		const loginLogoutTimestamp = new Date().toLocaleString();

		if (success) {
			const currentUser = users.find((user) => user.rfid === rfid);
			if (currentUser) {
				const currentUserCourse = (await fetchUserCourse(currentUser.course_id))[0];
				const currentUserDepartment = (
					await fetchUserDepartment(currentUserCourse.department_id)
				)[0];

				const isLoggedIn = !latestUserSession?.logout_timestamp;

				latestUser = {
					user: currentUser,
					department: currentUserDepartment,
					course: currentUserCourse,
					timestamp: loginLogoutTimestamp,
					isLoggedIn: isLoggedIn
				};

				console.log('Current user details:', {
					currentUser,
					currentUserCourse,
					currentUserDepartment,
					isLoggedIn
				});
			}
		}

		if (messageTimeoutId) {
			clearTimeout(messageTimeoutId);
		}
		messageTimeoutId = setTimeout(() => {
			loginMessage = '';
			loginOutSuccessful = false;
		}, 2000);

		// Show the modal on successful login/logout
		if (success) {
			defaultModal = true;
			if (modalTimeoutId) {
				clearTimeout(modalTimeoutId);
			}
			modalTimeoutId = setTimeout(() => {
				defaultModal = false;
			}, 2000);
		}
	}

	function navigateTo() {
		console.log('Navigating to dashboard');
		goto('/dashboard');
	}
</script>

<div class="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-900">
	<div class="w-full max-w-md p-8 bg-white shadow-md rounded-md">
		<h1 class="text-4xl text-blue-900 font-black mb-6 text-center">WELCOME BACK</h1>
		<LoginInput on:login={onLogin} />
		{#if loginMessage}
			<LoginMessage {loginMessage} {loginOutSuccessful} />
		{/if}
		<button
			class="mt-6 w-full py-2 bg-blue-900 text-white rounded-md hover:bg-red-600 transition-colors"
			on:click={navigateTo}
		>
			Go to Dashboard
		</button>
	</div>

	{#if latestUser}
		<Modal class="bg-white rounded-lg shadow-lg" bind:open={defaultModal}>
			<div class="flex flex-col items-center justify-center p-4">
				<img
					src={latestUser.user.photo_url}
					alt="{latestUser.user.given_name}'s photo"
					class="w-32 h-32 object-cover rounded-full mb-4"
				/>
				<p class="text-2xl text-blue-900 leading-relaxed text-center mt-1 font-black">
					{latestUser.user.given_name}
					{latestUser.user.last_name}
				</p>
				<p class="text-xl text-blue-900 leading-relaxed text-center mt-1">
					{latestUser.department.name}
				</p>
				<p class="text-xl text-blue-900 leading-relaxed text-center mt-1">
					{latestUser.course.name}
				</p>
				<p class="text-lg text-blue-900 leading-relaxed text-center mt-1">
					ID: {latestUser.user.id}
				</p>
				<p class="text-lg text-blue-900 leading-relaxed text-center mt-1">
					{latestUser.timestamp}
				</p>
				<p class="text-xl text-blue-900 leading-relaxed text-center mt-1 font-semibold">
					{latestUser.isLoggedIn ? 'Logged In' : 'Logged Out'}
				</p>
			</div>
		</Modal>
	{/if}
</div>
