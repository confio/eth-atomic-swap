const Token = artifacts.require("./TestERC20.sol");
const BN = require('bn.js');

const unit = new BN(10).pow(new BN(18));
const amount = unit.mul(new BN(500));
const zero = new BN(0);

contract("Token", function(accounts) {
	it("should return the initial balances", async function() {
		const token = await Token.deployed();
		const initial = unit.mul(new BN(100000));
		const owner_balance = await token.balanceOf.call(accounts[0]);
		const rest_balance = await token.balanceOf.call(accounts[1]);

		// Check for initial balances
		assert(owner_balance.eq(initial), "accounts[0] balance is incorrect");
		assert(rest_balance.eq(zero), "accounts[1] balance is incorrect");
	});

	it("should return the initial allowances", async function() {
		const token = await Token.deployed();
		const initial = await token.allowance.call(accounts[0], accounts[1]);
		assert(initial.eq(zero), "allowance is incorrect");
	});

	it("should transfer from one account to another", async function() {
		const token = await Token.deployed();
		const initial = await token.balanceOf.call(accounts[0]);
		// Transfer from accounts[0] to accounts[1]
		await token.transfer(accounts[1], amount, {from: accounts[0]});
		const sender_balance = await token.balanceOf.call(accounts[0]);
		const receiver_balance = await token.balanceOf.call(accounts[1]);
		assert(sender_balance.eq(initial.sub(amount)), "amount was not deducted from sender account");
		assert(receiver_balance.eq(amount), "amount was not added to receiver account");
	});

	it("should not allow transfer with insufficient funds", async function() {
		const token = await Token.deployed();
		const sender_initial = await token.balanceOf.call(accounts[0]);
		const receiver_initial = await token.balanceOf.call(accounts[1]);
		const amount = sender_initial.mul(new BN(2)); // Transfer value greater than intiial amount

		// Try transferring with insufficient funds
		try {
			await token.transfer(accounts[1], amount, {from: accounts[0]});
			assert(false, "We should never get here");
		} catch(error) {
			const sender_final = await token.balanceOf.call(accounts[0]);
			const receiver_final = await token.balanceOf.call(accounts[1]);
			assert(sender_final.sub(sender_initial), "transfer was sent");
			assert(receiver_final.sub(receiver_final), "transfer was received");
		}
	});

	it("should transfer with allowance", async function() {
		const token = await Token.deployed();
		const sender_initial = await token.balanceOf.call(accounts[0]);
		const receiver_initial = await token.balanceOf.call("0x8bc790a583789367f72c9c59678ff85a00a5e5d0");

		// First approve accounts[1] from accounts[0]
		await token.approve("0x8bc790a583789367f72c9c59678ff85a00a5e5d0", amount, {from: accounts[0]});
		const approval = await token.allowance.call(accounts[0], "0x8bc790a583789367f72c9c59678ff85a00a5e5d0");
		assert(approval.eq(amount), "amount was not approved");
	});

	it("should not allow transfer without allowance", async function() {
		const token = await Token.deployed();
		const sender_initial = await token.balanceOf.call(accounts[1]);
		const receiver_initial = await token.balanceOf.call(accounts[2]);

		// Try transferring from accounts[1] to accounts[2] without allowance
		try {
			await token.transferFrom(accounts[1], accounts[2], amount, {from: accounts[0]});
			assert(false, "We should never get here");
		} catch(error) {
			const sender_final = await token.balanceOf.call(accounts[1]);
			const receiver_final = await token.balanceOf.call(accounts[2]);
			assert(sender_final.eq(sender_initial), "transfer was sent");
			assert(receiver_final.eq(receiver_final), "transfer was received");
		}
	});

	it("should not allow transfer of negative value", async function() {
		const token = await Token.deployed();
		const sender_initial = await token.balanceOf.call(accounts[0]);
		const receiver_initial = await token.balanceOf.call(accounts[1]);

		// Try transferring negative amount
		try {
			await token.transfer(accounts[1], amount);
			assert(false, "We should never get here");
		} catch(error) {
			// Check balance has not changed
			const sender_final = await token.balanceOf.call(accounts[0]);
			const receiver_final = await token.balanceOf.call(accounts[1]);
			assert(!sender_final.eq(sender_initial), "transfer was sent");
			assert(receiver_final.eq(receiver_final), "transfer was received");
		}
	});

	it("should burn valid amount", async function() {
		const token = await Token.deployed();
		const initial = await token.balanceOf.call(accounts[0]);

		// Burn from accounts[0]'s balance
		await token.burn(initial, {from: accounts[0]});
		const balance = await token.balanceOf.call(accounts[0]);
		assert(balance.eq(zero), "balance was not burned");
	});

	it("should not allow burn without allowance", async function() {
		const token = await Token.deployed();
		const initial = await token.balanceOf.call(accounts[1]);

		// Try burning accounts[1]'s balance without allowance
		try {
			await token.burnFrom(accounts[1], amount);
			assert(false, "We should never get here");
		} catch(error) {
			// Check accounts[1]'s balance has not changed
			const balance = await token.balanceOf.call(accounts[1]);
			assert(balance.eq(initial), "balance was burned");
		}
	});

	it("should not burn negative amount", async function() {
		const token = await Token.deployed();
		const initial = await token.balanceOf.call(accounts[0]);

		// Try burning negative amount
		try {
			await token.burn(initial * -1);
			assert(false, "We should never get here");
		} catch(error) {
			// Check accounts[0]'s balance has not changed
			const balance = await token.balanceOf.call(accounts[0]);
			assert(balance.eq(initial), "negative amount was burned");
		}
	});
});