<script lang="ts">
	import { goto } from '$app/navigation';
	import { Modal, Button, Input, Toast } from 'flowbite-svelte';
	import { CloseCircleSolid } from 'flowbite-svelte-icons';
	import { modalOpen } from './modalStore.js';
	import { supabase } from '$lib/supabaseClient';
	import { AuthError } from '@supabase/supabase-js';

	let email = '';
	let password = '';
	let showErrorToast = false;
	let errorMessage = '';

	async function handleSubmit() {
		try {
			const { data, error } = await supabase.auth.signInWithPassword({
				email,
				password
			});

			if (error) throw error;

			console.log('Sign in successful:', data.user);
			modalOpen.set(false);
			// Redirect to a protected route
			goto('/dashboard');
		} catch (err) {
			const error = err as AuthError;
			console.error('Sign in error:', error.message);
			errorMessage = error.message || 'An error occurred. Please try again.';
			showErrorToast = true;
			// Hide the toast after 2 seconds
			setTimeout(() => {
				showErrorToast = false;
			}, 2000);
		}
	}
</script>

<div>
	{#if showErrorToast}
		<div class="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
			<Toast dismissable={false} color="red" class="rounded-md">
				<svelte:fragment slot="icon">
					<CloseCircleSolid class="w-5 h-5" />
					<span class="sr-only">Error icon</span>
				</svelte:fragment>
				{errorMessage}
			</Toast>
		</div>
	{/if}

	<Modal bind:open={$modalOpen} title="Sign In" class="max-w-md mx-auto">
		<form on:submit|preventDefault={handleSubmit} class="space-y-6">
			<div class="space-y-4">
				<div>
					<Input
						type="email"
						name="email"
						placeholder="email@mcm.edu.ph"
						required
						bind:value={email}
						class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					/>
				</div>
				<div>
					<Input
						type="password"
						name="password"
						placeholder="password"
						required
						bind:value={password}
						class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					/>
				</div>
			</div>

			<Button
				type="submit"
				class="w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2 px-4 rounded-md transition duration-200"
			>
				Sign In
			</Button>
		</form>
	</Modal>
</div>
