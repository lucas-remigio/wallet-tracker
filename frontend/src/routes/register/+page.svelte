<script lang="ts">
	import { goto } from '$app/navigation';
	import axios from '$lib/axios';
	import type { AxiosError } from 'axios';

	let first_name = '';
	let last_name = '';
	let email = '';
	let password = '';
	let confirmPassword = '';
	let errorMessage = '';
	let successMessage = '';

	interface APIErrorResponse {
		message: string; // Main error message
		error?: string; // Optional error code or additional details
	}

	const handleRegister = async () => {
		errorMessage = '';
		successMessage = '';

		// Validate passwords match
		if (password !== confirmPassword) {
			errorMessage = 'Passwords do not match.';
			return;
		}

		try {
			// Send the register request to the backend
			const response = await axios.post('register', {
				first_name,
				last_name,
				email,
				password
			});

			successMessage = 'Registration successful! Redirecting to login...';
			setTimeout(() => {
				goto('/login');
			}, 2000);
		} catch (error) {
			// Handle errors and display error messages
			const axiosError = error as AxiosError;
			const apiResponse = axiosError.response?.data as APIErrorResponse;
			errorMessage = apiResponse?.error || 'Registration failed. Please try again.';
		}
	};
</script>

<main class="bg-base-200 flex min-h-screen items-center justify-center">
	<div class="bg-base-100 w-full max-w-md rounded-lg p-6 shadow-md">
		<h1 class="mb-6 text-center text-2xl font-bold">Register</h1>

		<form class="space-y-4" on:submit|preventDefault={handleRegister}>
			<div class="form-control">
				<label for="first_name" class="label">
					<span class="label-text">First Name:</span>
				</label>
				<input
					id="first_name"
					type="text"
					bind:value={first_name}
					required
					class="input input-bordered w-full"
					placeholder="Enter your first name"
				/>
			</div>

			<div class="form-control">
				<label for="last_name" class="label">
					<span class="label-text">Last Name:</span>
				</label>
				<input
					id="last_name"
					type="text"
					bind:value={last_name}
					required
					class="input input-bordered w-full"
					placeholder="Enter your last name"
				/>
			</div>

			<div class="form-control">
				<label for="email" class="label">
					<span class="label-text">Email:</span>
				</label>
				<input
					id="email"
					type="email"
					bind:value={email}
					required
					class="input input-bordered w-full"
					placeholder="Enter your email"
				/>
			</div>

			<div class="form-control">
				<label for="password" class="label">
					<span class="label-text">Password:</span>
				</label>
				<input
					id="password"
					type="password"
					bind:value={password}
					required
					class="input input-bordered w-full"
					placeholder="Enter your password"
				/>
			</div>

			<div class="form-control">
				<label for="confirmPassword" class="label">
					<span class="label-text">Confirm Password:</span>
				</label>
				<input
					id="confirmPassword"
					type="password"
					bind:value={confirmPassword}
					required
					class="input input-bordered w-full"
					placeholder="Re-enter your password"
				/>
			</div>

			{#if errorMessage}
				<p class="text-sm text-red-500">{errorMessage}</p>
			{/if}

			{#if successMessage}
				<p class="text-sm text-green-500">{successMessage}</p>
			{/if}

			<div class="form-control mt-4">
				<button type="submit" class="btn btn-primary w-full">Register</button>
			</div>
		</form>

		<p class="mt-4 text-center text-sm">
			Already have an account? <a href="/login" class="link link-primary">Login</a>
		</p>
	</div>
</main>

<style>
	/* You can customize styling here if needed */
</style>
