<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';

	export let inputElement: HTMLInputElement | null = null;
	export let isLoginFailed = false;

	const dispatch = createEventDispatcher();

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
			if (input.length === 10) {
				setError();
			} else {
				clearError();
			}
		}

		if (inputElement) inputElement.focus();
	}

	function setError() {
		isLoginFailed = true;
		if (inputElement) {
			inputElement.classList.add('bg-pink-200');
			inputElement.classList.remove('bg-white');
		}
		setTimeout(clearError, 1000);
	}

	function clearError() {
		isLoginFailed = false;
		if (inputElement) {
			inputElement.classList.remove('bg-pink-200');
			inputElement.classList.add('bg-white');
		}
	}

	// onMount(() => {
	// 	if (inputElement) inputElement.focus();

	// 	const keepFocus = (event: MouseEvent) => {
	// 		if (event.target !== inputElement && inputElement) {
	// 			inputElement.focus();
	// 		}
	// 	};

	// 	document.addEventListener('click', keepFocus);

	// 	return () => {
	// 		document.removeEventListener('click', keepFocus);
	// 	};
	// });

	function getPlaceholder() {
		return isLoginFailed ? 'INVALID ID. TRY AGAIN!' : 'PLEASE TAP YOUR ID';
	}
</script>

<div class="w-full max-w-4xl mx-auto">
	<input
		bind:this={inputElement}
		type="number"
		placeholder={getPlaceholder()}
		on:input={handleInput}
		class="w-full h-20 px-8 text-4xl text-center bg-white border-4 rounded-full focus:outline-none transition-colors duration-300
        border-blue-900 focus:border-blue-600
        placeholder:font-black placeholder:font-mono"
	/>
</div>

<style>
	input[type='number']::-webkit-inner-spin-button,
	input[type='number']::-webkit-outer-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	input[type='number'] {
		-moz-appearance: textfield;
	}
</style>
