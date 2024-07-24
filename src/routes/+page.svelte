<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import type { User, UserSession } from '$lib/usertypes';
	import { handleUserLogin, fetchUsers, fetchUserSessions } from '$lib/service/supabaseService';
	import LoginInput from '$lib/components/rfid/RFIDInput.svelte';
	import LoginMessage from '$lib/components/rfid/RFIDMessage.svelte';
	import { goto } from '$app/navigation';
	import { Modal } from 'flowbite-svelte';

	export let users: User[] = [];
	export let userSessions: UserSession[] = [];
	let latestUserSession: UserSession | null = null;
	let latestUser: User | null = null;
	let loginMessage = '';
	let loginOutSuccessful = false;
	let messageTimeoutId: string | number | NodeJS.Timeout | undefined;
	let intervalId: ReturnType<typeof setInterval>;
	let defaultModal = false;
	let modalTimeoutId: string | number | NodeJS.Timeout | undefined;
	let loginLogoutTimestamp: string = '';

	async function refreshData() {
		try {
			users = await fetchUsers();
			userSessions = await fetchUserSessions();
			latestUserSession = getLatestUserSession(userSessions);
			latestUser = users.find((user) => user.id === latestUserSession?.user_id) || null;
			console.log('Data refreshed');
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
		await refreshData();
		intervalId = setInterval(refreshData, 35000);
	});

	onDestroy(() => {
		clearInterval(intervalId);
	});

	async function onLogin(event: CustomEvent<string>) {
		const rfid = event.detail;
		if (rfid.length !== 10) {
			return;
		}
		const { message, success } = await handleUserLogin(rfid, users, userSessions);
		loginMessage = message;
		loginOutSuccessful = success;
		userSessions = await fetchUserSessions();
		latestUserSession = getLatestUserSession(userSessions);
		latestUser = users.find((user) => user.id === latestUserSession?.user_id) || null;
		loginLogoutTimestamp = new Date().toLocaleString(); // Capture the current timestamp

		if (messageTimeoutId) {
			clearTimeout(messageTimeoutId);
		}
		messageTimeoutId = setTimeout(() => {
			loginMessage = '';
			loginOutSuccessful = false;
		}, 2000);

		// Show the modal on successful login
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

	function navigateToDashboard() {
		goto('/dashboard'); // Adjust '/dashboard' as needed based on your routing setup
	}
</script>

<div
	class="fixed top-0 left-1/2 transform -translate-x-1/2 mt-10 px-4 w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl"
>
	<LoginInput on:login={onLogin} />
	{#if loginMessage}
		<LoginMessage {loginMessage} {loginOutSuccessful} />
	{/if}
</div>

<button
	class="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
	on:click={navigateToDashboard}>Go to Dashboard</button
>

<div class="mt-10 sm:mt-20 md:mt-40 w-full">
	{#if latestUser}
		<Modal class="h-[50rem] mt-[5rem] w-[50rem] shadow-xl" bind:open={defaultModal}>
			<div class="flex flex-col items-center justify-center">
				<img
					src={latestUser.photo_url}
					alt="{latestUser.given_name} {latestUser.last_name}'s photo"
					class="w-72 h-72 object-cover rounded-lg"
				/>
				<p class="text-4xl leading-relaxed text-center mt-1 font-black">
					{latestUser.given_name}
					{latestUser.middle_name}
					{latestUser.last_name}
				</p>
				<p class="text-4xl leading-relaxed text-center mt-1 font-black">{latestUser.id}</p>
				<p class="text-4xl leading-relaxed text-center mt-1 font-black">CCIS</p>
				<p class="text-4xl leading-relaxed text-center mt-1 font-black">CS</p>
				<p class="text-4xl leading-relaxed text-center mt-1 font-black">{loginLogoutTimestamp}</p>
			</div>
		</Modal>
	{/if}
</div>
