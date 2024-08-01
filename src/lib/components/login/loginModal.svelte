<script>
	import { Modal, Button, Input } from 'flowbite-svelte';
	import { modalOpen } from './modalStore.js';
	import { fade } from 'svelte/transition';

	let email = '';
	let password = '';

	function handleSubmit() {
		// Handle sign-in logic here
		console.log('Sign in:', { email, password });
		modalOpen.set(false);
	}
</script>

<Modal bind:open={$modalOpen} title="Sign In" class="max-w-md mx-auto">
	<form on:submit|preventDefault={handleSubmit} class="space-y-6">
		<div class="space-y-4">
			<div>
				<Input
					type="text"
					name="username"
					placeholder="Username"
					required
					bind:value={email}
					class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				/>
			</div>
			<div>
				<Input
					type="password"
					name="password"
					placeholder="Password"
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
