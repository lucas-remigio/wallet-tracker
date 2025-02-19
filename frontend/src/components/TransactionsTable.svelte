<!-- src/components/TransactionsTable.svelte -->
<script lang="ts">
	import type { Account, TransactionDto } from '$lib/types';
	import { CircleDollarSign, Plus } from 'lucide-svelte';
	import CreateTransaction from './CreateTransaction.svelte';
	import { createEventDispatcher } from 'svelte';

	// Export props for transactions array and the account name.
	export let transactions: TransactionDto[] = [];
	export let account: Account;

	let showCreateTransactionModal = false;

	function formatCurrency(amount: number): string {
		// make the currency have a , every 3 digits
		return amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
	}

	function formatDate(date: string): string {
		// the format should be just month and year, in extense portuguese, without the "de" between
		const formattedDate = new Date(date).toLocaleDateString('pt-PT', {
			month: 'long',
			year: 'numeric'
		});

		let month = formattedDate.split(' ')[0];
		month = month.charAt(0).toUpperCase() + month.slice(1);
		const year = formattedDate.split(' ')[2];

		return `${month} ${year}`;
	}

	function openCreateTransactionModal() {
		showCreateTransactionModal = true;
	}

	function closeCreateTransactionModal() {
		showCreateTransactionModal = false;
	}

	const dispatch = createEventDispatcher();
	function handleNewTransaction() {
		closeCreateTransactionModal();
		dispatch('newTransaction');
	}
</script>

{#if transactions && transactions.length > 0}
	<div class="mb-2 flex justify-between">
		<h2 class="mb-4 text-2xl font-semibold">
			Transactions for {account.account_name}
		</h2>
		<!-- Button to add a new transaction-->
		<button class="btn btn-primary shadow-lg" on:click={openCreateTransactionModal}>
			<Plus size={20} />
			<CircleDollarSign size={20} />
		</button>
	</div>

	<div class="bg-base-100 overflow-x-auto rounded-lg shadow-lg">
		<table class="table w-full">
			<thead class="text-center">
				<tr>
					<th class="text-gray-900 dark:text-gray-100">Date</th>
					<th class="text-gray-900 dark:text-gray-100">Category</th>
					<th class="text-gray-900 dark:text-gray-100">Amount</th>
					<th class="text-gray-900 dark:text-gray-100">Description</th>
				</tr>
			</thead>
			<tbody class="text-center">
				{#each transactions as tx}
					<tr
						class={tx.category.transaction_type.type_slug === 'debit'
							? 'bg-red-100'
							: tx.category.transaction_type.type_slug === 'credit'
								? 'bg-green-100'
								: ''}
					>
						<td class="dark:text-gray-900">
							{formatDate(tx.date)}
						</td>
						<td>
							<span
								class="rounded px-2 py-1 text-white"
								style="background-color: {tx.category.color};"
							>
								{tx.category.category_name}
							</span>
						</td>
						<td class="dark:text-gray-900">{formatCurrency(tx.amount)}€</td>
						<td class="dark:text-gray-900">{tx.description || 'N/A'}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{:else}
	<div class="flex h-96 flex-col items-center justify-center">
		<p class="text-gray-500">
			No transactions found for <strong>{account.account_name}</strong>.
		</p>

		<!-- Button to add a new transaction -->
		<button
			class="btn btn-primary mt-4 flex items-center gap-2 shadow-lg"
			on:click={openCreateTransactionModal}
			aria-label="Add New Transaction"
		>
			<CircleDollarSign size={20} class="h-5 w-5" />
			<span>Create First Transaction</span>
		</button>
	</div>
{/if}

{#if showCreateTransactionModal}
	<CreateTransaction
		{account}
		on:closeModal={closeCreateTransactionModal}
		on:newTransaction={handleNewTransaction}
	></CreateTransaction>
{/if}
