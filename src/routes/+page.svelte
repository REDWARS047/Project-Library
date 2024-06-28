<script lang="ts">
	import { supabase } from '$lib/supabaseClient';
	import { onDestroy, onMount } from 'svelte';
	import type { User, UserSession } from './types';
  
	let lastScan = '';
	let userData: User[] = [];
	let userSessions: UserSession[] = [];
	let isDisabled = false;
	let loginMessage = '';
  
	// Fetch users from the Supabase 'users' table
	async function fetchUsers(): Promise<User[]> {
	  const { data, error } = await supabase.from('users').select();
	  if (error) {
		console.error('Error fetching users:', error.message);
		return [];
	  }
	  return data || [];
	}
  
	// Fetch user sessions from the Supabase 'user_sessions' table
	async function fetchUserSessions(): Promise<UserSession[]> {
	  const { data, error } = await supabase.from('user_sessions').select();
	  if (error) {
		console.error('Error fetching user sessions:', error.message);
		return [];
	  }
	  return data || [];
	}
  
	// Convert UTC timestamp to local time
	function convertToLocalTime(utcTimestamp: string): Date {
	  return new Date(utcTimestamp);
	}
  
	// Handle user login or logout
	async function handleUserLogin(rfid: string) {
	  lastScan = rfid; // Store the last scanned RFID
  
	  // Find user by RFID
	  const user = userData.find((u) => u.rfid === rfid);
	  if (!user) {
		loginMessage = 'User not found!';
		console.error('User not found:', rfid);
		return;
	  }
  
	  const currentTime = new Date();
  
	  // Check if the user is currently logged in
	  const existingSession = userSessions.find(
		(session) => session.user_id === user.id && session.logout_timestamp === null
	  );
  
	  if (existingSession) {
		// User is logging out
		const sessionId = existingSession.session_id;
		const logoutTime = currentTime;
		const loginTime = convertToLocalTime(existingSession.login_timestamp);
		
		// Debug: Log timestamps
		console.log(`Logout Time: ${logoutTime.toLocaleString()}`);
		console.log(`Login Time: ${loginTime.toLocaleString()}`);
  
		// Calculate session duration in milliseconds
		const durationMs = logoutTime.getTime() - loginTime.getTime();
  
		// Debug: Log duration in milliseconds
		console.log(`Duration (ms): ${durationMs}`);
  
		// Convert duration to hours, minutes, and seconds
		const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
		const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
		const durationSeconds = Math.floor((durationMs % (1000 * 60)) / 1000);
  
		// Format duration string
		const formattedDuration = `${durationHours} hour${durationHours !== 1 ? 's' : ''} ${durationMinutes} minute${durationMinutes !== 1 ? 's' : ''} ${durationSeconds} second${durationSeconds !== 1 ? 's' : ''}`;
  
		// Debug: Log formatted duration
		console.log(`Formatted Duration: ${formattedDuration}`);
  
		// Update the session in Supabase
		const { error } = await supabase
		  .from('user_sessions')
		  .update({
			logout_timestamp: logoutTime.toISOString(),
			session_duration: formattedDuration, // Store the duration as a formatted string
		  })
		  .eq('session_id', sessionId);
  
		if (error) {
		  console.error('Error updating session:', error.message);
		  loginMessage = 'Error logging out. Please try again.';
		} else {
		  console.log(`User ${user.given_name} ${user.last_name} logged out at ${logoutTime}`);
		  loginMessage = `Goodbye, ${user.given_name} ${user.last_name}. You were logged in for ${formattedDuration}.`;
		}
	  } else {
		// User is logging in
		const loginTime = new Date().toLocaleString();
  
		// Insert new session record in Supabase
		const { data, error } = await supabase.from('user_sessions').insert([
		  {
			user_id: user.id,
			login_timestamp: loginTime,
			logout_timestamp: null,
			session_duration: null,
		  }
		]);
  
		if (error) {
		  console.error('Error inserting session:', error.message);
		  loginMessage = 'Error logging in. Please try again.';
		} else {
		  console.log(`User ${user.given_name} ${user.last_name} logged in at ${loginTime}`);
		  loginMessage = `Welcome, ${user.given_name} ${user.last_name}. You are now logged in.`;
		}
	  }
  
	  // Refresh sessions to reflect changes
	  userSessions = await fetchUserSessions();
  
	  // Display the loginMessage for 1 second then clear it
	  setTimeout(() => {
		lastScan = ''; // Clear last scanned RFID
		loginMessage = ''; // Clear login message
	  }, 1000);
	}
  
	// Refresh data from Supabase
	async function refreshData() {
	  userData = await fetchUsers();
	  userSessions = await fetchUserSessions();
	  console.log('Data refreshed');
	}
  
	let intervalId: string | number | NodeJS.Timeout | undefined;
  
	onMount(async () => {
	  await refreshData(); // Initial data load
	  intervalId = setInterval(async () => {
		await refreshData(); // Periodic data refresh
	  }, 18000); // Refresh every 18 seconds
	});
  
	onDestroy(() => {
	  clearInterval(intervalId); // Clear the interval when the component is destroyed
	});
  
	// Handle RFID input
	function handleInput(event: Event) {
	  const inputElement = event.target as HTMLInputElement;
	  const input = inputElement.value;
  
	  // Check if input is exactly 10 digits and consists only of numbers
	  if (input.length === 10 && /^\d{10}$/.test(input)) {
		handleUserLogin(input); // Handle user login or logout
		inputElement.value = ''; // Clear the input field
		isDisabled = true; // Disable input on submit
		setTimeout(() => {
		  isDisabled = false; // Re-enable input after 1 second
		}, 1000);
	  } else {
		// Handle invalid input (not exactly 10 digits or contains non-numeric characters)
		console.error('Invalid RFID: Must be exactly 10 digits and numeric');
		loginMessage = 'Invalid RFID: Must be exactly 10 digits and numeric';
		setTimeout(() => {
		  lastScan = '';
		  loginMessage = ''; // Clear login message
		}, 1000);
	  }
	}
</script>
  
<!-- svelte-ignore a11y-autofocus -->
<input
	type="text"
	placeholder="Scan RFID"
	on:input={handleInput}
	autofocus
	disabled={isDisabled}
	class="appearance-none w-full p-2 border-2 border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
/>
  
<section class="mt-4">
	{#if loginMessage}
	  <p class="text-gray-600" style="white-space: pre-wrap;">{loginMessage}</p>
	{/if}
	<ul>
	  {#each userData as user}
		{#if userSessions.find(session => session.user_id === user.id && session.logout_timestamp === null)}
		  <li>
			<img src="{user.photo_url}" alt="{user.given_name} {user.last_name}'s photo" style="width: 50px; height: 50px; border-radius: 50%;"/>
			{user.id} - {user.rfid} - {user.given_name} {user.middle_name} {user.last_name} - Logged In
		  </li>
		{/if}
	  {/each}
	</ul>
</section>
  
<style>
	input[type='text']::-webkit-inner-spin-button,
	input[type='text']::-webkit-outer-spin-button {
	  -webkit-appearance: none;
	  margin: 0;
	}
	img {
	  display: inline-block;
	  vertical-align: middle;
	  margin-right: 10px;
	}
</style>
