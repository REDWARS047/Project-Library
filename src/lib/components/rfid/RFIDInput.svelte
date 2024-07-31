<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';

	export let inputElement: HTMLInputElement | null = null;
	export let isLoginFailed = false;
	export let errorMessage = 'Invalid ID. Please try again.';

	const dispatch = createEventDispatcher();
	let errorTimeout: number;

	function handleInput(event: Event) {
		let input = inputElement?.value || '';

		if (input.length > 10) {
			input = input.substring(0, 10);
			if (inputElement) inputElement.value = input;
		}

		if (input.length === 10 && /^\d{10}$/.test(input)) {
			dispatch('login', input);
			if (inputElement) inputElement.value = '';
			clearError();
		} else {
			dispatch('login', '');
		}

		if (inputElement) inputElement.focus();
	}

	function setError(message: string) {
		isLoginFailed = true;
		errorMessage = message;

		// Clear any existing timeout
		if (errorTimeout) clearTimeout(errorTimeout);

		// Set a new timeout to clear the error after 1 second
		errorTimeout = setTimeout(clearError, 1000);
	}

	function clearError() {
		isLoginFailed = false;
		errorMessage = '';
		if (errorTimeout) clearTimeout(errorTimeout);
	}

	onMount(() => {
		if (inputElement) inputElement.focus();

		const keepFocus = (event: MouseEvent) => {
			if (event.target !== inputElement && inputElement) {
				inputElement.focus();
			}
		};

		document.addEventListener('click', keepFocus);

		return () => {
			document.removeEventListener('click', keepFocus);
			if (errorTimeout) clearTimeout(errorTimeout);
		};
	});

	function getPlaceholder() {
		if (isLoginFailed) {
			return 'INVALID ID. TRY AGAIN!';
		}
		return 'PLEASE TAP YOUR ID';
	}
</script>

<div class="w-full max-w-4xl mx-auto">
	<input
		bind:this={inputElement}
		type="number"
		placeholder={getPlaceholder()}
		on:input={handleInput}
		autofocus
		class="w-full h-20 px-8 text-4xl text-center bg-white border-4 rounded-full focus:outline-none transition-colors duration-300
            {isLoginFailed
			? 'border-red-500 focus:border-red-600 bg-pink-100 shake'
			: 'border-blue-900 focus:border-blue-600'}
            placeholder:font-black placeholder:font-mono"
	/>
	{#if isLoginFailed}
		<p transition:fly={{ y: 10, duration: 300 }} class="mt-2 text-red-600 text-sm text-center">
			{errorMessage}
		</p>
	{/if}
</div>

<style>
	/* Remove arrow buttons for number inputs */
	input[type='number']::-webkit-inner-spin-button,
	input[type='number']::-webkit-outer-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	/* For Firefox */
	input[type='number'] {
		-moz-appearance: textfield;
	}

	/* Shake animation */
	@keyframes shake {
		0%,
		100% {
			transform: translateX(0);
		}
		10%,
		30%,
		50%,
		70%,
		90% {
			transform: translateX(-5px);
		}
		20%,
		40%,
		60%,
		80% {
			transform: translateX(5px);
		}
	}

	.shake {
		animation: shake 0.6s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
	}
</style>
