<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	let inputElement: HTMLInputElement;

	const dispatch = createEventDispatcher();

	function handleInput(event: Event) {
		let input = inputElement.value;
		
		if (input.length > 10) {
            input = input.substring(0, 10);
            inputElement.value = input;
        }

		if (input.length === 10 && /^\d{10}$/.test(input)) {
			dispatch('login', input);
			inputElement.value = '';
		} else {
			dispatch('login', '');
		}

		inputElement.focus();
	}

	onMount(() => {
		inputElement.focus();

		const keepFocus = (event: MouseEvent) => {
			if (event.target !== inputElement) {
				inputElement.focus();
			}
		};

		document.addEventListener('click', keepFocus);

		return () => {
			document.removeEventListener('click', keepFocus);
		};
	});
</script>

<input
	bind:this={inputElement}
	type="number"
	placeholder="Scan RFID"
	on:input={handleInput}
	autofocus
	class="rounded-lg w-full no-spinner"
/>

<style>
	.no-spinner {
		appearance: none;
		-moz-appearance: textfield;
	}

	.no-spinner::-webkit-outer-spin-button,
	.no-spinner::-webkit-inner-spin-button {
		margin: 0;
		-webkit-appearance: none;
	}
</style>
