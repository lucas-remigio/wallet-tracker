<!-- src/components/Accounts.svelte -->
<script lang="ts">
	import type { Account } from '$lib/types';
	import { createEventDispatcher, onMount } from 'svelte';
	import { Pencil, Trash } from 'lucide-svelte';
	import EditAccount from './EditAccount.svelte';
	import ConfirmAction from './ConfirmAction.svelte';

	// Export a prop to receive the accounts array.
	export let accounts: Account[] = [];
	export let selectedAccount: Account | null = null;

	let openEditAccountModal: boolean = false;
	let openDeleteAccountModal: boolean = false;

	const dispatch = createEventDispatcher<any>();

	function formatCurrency(amount: number): string {
		// make the currency have a , every 3 digits
		return amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
	}

	function handleCardClick(account: Account) {
		selectedAccount = account;
		dispatch('select', { account });
	}

	function handleEditAccount(account: Account) {
		openEditAccountModal = true;
	}

	function handleCloseEditAccountModal() {
		openEditAccountModal = false;
	}

	function handleConfirmAccountDeletion() {
		openDeleteAccountModal = true;
	}

	function handleCloseDeleteAccountModal() {
		openDeleteAccountModal = false;
	}

	function handleDeleteAccount() {
		openDeleteAccountModal = false;
		dispatch('deleteAccount', { account: selectedAccount! });
	}

	function handleUpdatedAccount() {
		handleCloseEditAccountModal();
		dispatch('updatedAccount');
	}
</script>

{#if accounts.length > 0}
	<div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
		{#each accounts as account}
			<div class="relative">
				<button
					type="button"
					class="card bg-base-100 w-full cursor-pointer p-0 outline-none transition-all duration-200 hover:scale-[1.02] hover:shadow-2xl
					{selectedAccount?.token === account.token
						? 'ring-primary ring-2 '
						: 'border-base-200 hover:border-primary/20 border shadow-lg'}"
					on:click={() => handleCardClick(account)}
				>
					<div class="card-body">
						<h2 class="card-title">{account.account_name}</h2>
						<p class="text-3xl font-bold">{formatCurrency(account.balance)}€</p>
					</div>
				</button>
				<!-- Action buttons container -->
				{#if account.token === selectedAccount?.token}
					<div
						class="absolute right-2 top-2 flex gap-1 md:opacity-0 md:transition-opacity md:hover:opacity-100"
					>
						<button
							class="btn btn-ghost btn-sm btn-circle bg-base-100/80 backdrop-blur-sm"
							on:click|stopPropagation={() => handleEditAccount(account)}
							title="Edit account"
						>
							<Pencil size={16} />
						</button>
						<button
							class="btn btn-ghost btn-sm btn-circle bg-base-100/80 text-error hover:bg-error/20 backdrop-blur-sm"
							on:click|stopPropagation={() => handleConfirmAccountDeletion()}
							title="Delete account"
						>
							<Trash size={16} />
						</button>
					</div>
				{/if}
			</div>
		{/each}
	</div>
{:else}
	<p class="text-gray-500">No accounts found.</p>
{/if}

{#if openEditAccountModal}
	<EditAccount
		account={selectedAccount!}
		on:closeModal={handleCloseEditAccountModal}
		on:updatedAccount={handleUpdatedAccount}
	/>
{/if}

{#if openDeleteAccountModal}
	<ConfirmAction
		title={`Delete Account ${selectedAccount?.account_name}`}
		message={`Are you sure you want to delete the account ${selectedAccount?.account_name}? This action cannot be undone.`}
		type="danger"
		onConfirm={() => handleDeleteAccount()}
		onCancel={() => handleCloseDeleteAccountModal()}
	/>
{/if}
