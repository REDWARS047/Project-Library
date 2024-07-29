<script lang="ts">
	import { Navbar, NavBrand, NavLi, NavUl, NavHamburger } from 'flowbite-svelte';
</script>

<Navbar>
	<NavBrand href="/">
		<img src="/ccis-logo.jpg" class="me-3 h-6 sm:h-9" alt="CCIS Logo" />
	</NavBrand>
	<NavHamburger />
	<NavUl>
		<NavLi href="/">Home</NavLi>
		<NavLi href="/dashboard">Dashboard</NavLi>
		<NavLi href="/admin">Admin</NavLi>
		<!-- <NavLi href="/database">Database</NavLi> -->
	</NavUl>
</Navbar>
