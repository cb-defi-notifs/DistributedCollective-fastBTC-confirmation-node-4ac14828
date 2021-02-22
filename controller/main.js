/**
 * 
 */
import Web3 from 'web3';
import multisigAbi from '../config/multisigAbi';
import conf from '../config/config';
import { Mutex } from 'async-mutex';
import walletManager from './walletCtrl';
import telegramBot from '../utils/telegram';
import U from '../utils/helper';

class MainController {
    constructor() {
        this.web3 = new Web3(conf.nodeProvider);
        this.multisig = new this.web3.eth.Contract(multisigAbi, conf.multisigAddress);
        this.mutex = new Mutex();
        walletManager.init(this.web3);
    }

    start() {
        this.pollAndConfirmWithdrawRequests();
    }

    /**
    * Create inifinite loop
    * 1. get tx-id#s
    * 2. for tx-id: call isConfirmed on the multisig to check wheter this proposal is still unconfirmed
    * 3. if so: confirmWithdrawRequest
    */
    async pollAndConfirmWithdrawRequests() {
        while (true) {
            console.log("Get withdraw requests");
            const numberOfTransactions = await this.multisig.methods["getTransactionCount"](true, true).call();
            console.log("Number of pending transactions", numberOfTransactions);
            const allTransactionsIDs = await this.multisig.methods["getTransactionIds"](0, numberOfTransactions, true, true).call();
            allTransactionsIDs.forEach(async txID => {
                const isConfirmed = await this.multisig.methods["isConfirmed"](txID).call();
                console.log(isConfirmed)
                if (!isConfirmed) await this.confirmWithdrawRequest(txID);
            })
            await U.wasteTime(5);
        }
    }


    async confirmWithdrawRequest(txId) {
        console.log("confirm tx " + txId);
        const wallet = await this.getWallet();
        if (wallet.length == 0) return { error: "no wallet available to process the assignment" };
        const nonce = await this.web3.eth.getTransactionCount(wallet, 'pending');
        const gasPrice = await this.getGasPrice();

        const receipt = await this.multisig.methods.confirmTransaction(txId).send({
            from: wallet,
            gas: 1000000,
            gasPrice: gasPrice,
            nonce: nonce
        });
        telegramBot.sendMessage("Transaction with ID " + txId + " confirmed. Transaction hash: " + receipt.transactionHash);

        walletManager.decreasePending(wallet);
        return receipt;
    }

    /**
    * @notice loads a free wallet from the wallet manager 
    * @dev this is secured by a mutex to make sure we're never exceeding 4 pending transactions per wallet
    */
    async getWallet() {
        await this.mutex.acquire();
        let wallet = "";
        let timeout = 5 * 60 * 1000;
        try {
            //if I have to wait, any other thread needs to wait as well
            wallet = await walletManager.getFreeWallet(timeout);
            //because the node can't handle too many simultaneous requests
            await U.wasteTime(0.5);
            this.mutex.release();
        }
        catch (e) {
            this.mutex.release();
            console.error(e);
        }
        return wallet;
    }

    async getGasPrice() {
        const gasPrice = await this.web3.eth.getGasPrice();
        return Math.round(gasPrice);
    }

}


export default new MainController();