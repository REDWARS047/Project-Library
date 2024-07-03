<script lang="ts">
	export let loginMessage: string;
	export let loginOutSuccessful: boolean;
</script>

<p class="mt-2 p-4 {loginOutSuccessful ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} rounded-lg w-full">
	{loginMessage}
</p>
