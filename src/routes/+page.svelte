<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import type { User, UserSession } from '$lib/usertypes';
	import { handleUserLogin, fetchUsers, fetchUserSessions } from '$lib/service/supabaseService';
	import LoginInput from '$lib/components/rfid/RFIDInput.svelte';
	import LoginMessage from '$lib/components/rfid/RFIDMessage.svelte';
	import { goto } from '$app/navigation';

	export let users: User[] = [];
	export let userSessions: UserSession[] = [];
	let loginMessage = '';
	let loginOutSuccessful = false;
	let messageTimeoutId: string | number | NodeJS.Timeout | undefined;

	let intervalId: ReturnType<typeof setInterval>;

	async function refreshData() {
		try {
			users = await fetchUsers();
			userSessions = await fetchUserSessions();
			console.log('Data refreshed');
		} catch (error) {
			console.error('Error refreshing data:', error);
		}
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

		if (messageTimeoutId) {
			clearTimeout(messageTimeoutId);
		}

		messageTimeoutId = setTimeout(() => {
			loginMessage = '';
			loginOutSuccessful = false;
		}, 2000);
	}

	function navigateToDashboard() {
		goto('/dashboard'); // Adjust '/dashboard' as needed based on your routing setup
	}
</script>

<div
	class="fixed top-0 left-1/2 transform -translate-x-1/2 mt-10 px-4 w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl"
>
<!-- <button class="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700" on:click={navigateToDashboard}>Go to Dashboard</button> -->
	<div class="flex flex-col items-center">
		<LoginInput on:login={onLogin} />
		{#if loginMessage}
			<LoginMessage {loginMessage} {loginOutSuccessful} />
		{/if}
	</div>
</div>

<div class="mt-10 sm:mt-20 md:mt-40 w-full">
	<div class="overflow-y-auto md:h-[30rem] h-screen">
		<div class="flex flex-wrap justify-center gap-4">
			{#each users as user}
				{#if userSessions.find((session) => session.user_id === user.id && session.logout_timestamp === null)}
					<div
						class="flex flex-col items-center gap-2 p-2 bg-white shadow rounded-lg w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 xl:w-1/8"
					>
						<div class="w-16 h-16 md:w-16 md:h-16 lg:w-20 lg:h-20 xl:w-24 xl:h-24">
							<img
								src={user.photo_url}
								alt="{user.given_name} {user.last_name}'s photo"
								class="w-full h-full rounded-full"
							/>
						</div>
						<div class="text-center">
							<div>{user.given_name} {user.middle_name} {user.last_name}</div>
							<div class="text-green-500">Logged In</div>
						</div>
					</div>
				{/if}
			{/each}
		</div>
	</div>
</div>
