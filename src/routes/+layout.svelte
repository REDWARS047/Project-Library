<script lang="ts">
    import '../app.postcss'; // Ensure Tailwind is imported
 
</script>

<div class="flex flex-col min-h-screen">
    <main class="flex-grow container mx-auto p-4">
        <slot />
    </main>

</div>