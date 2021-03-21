import telegramBot from '../secrets/telegram.js';
import walletSigs from '../secrets/walletSigs.main';
import accounts from "../secrets/accounts";

export default {
    nodeId: 2, //every node gets a unique id
    masterNode: 'http://3.131.33.161:3000/',
    rskNodeProvider: 'https://mainnet.sovryn.app/rpc',
    btcNodeProvider: {},
    network: "main",
    db: "node_mainnet",
    multisigAddress: "0x0f279e810B95E0d425622b9b40D7bCD0B5C4B19d",
    walletSigs,
    startIndex: 100, //multisig tx-index from which the node starts confirming withdraw requests 
    account: accounts["main"],
    blockExplorer: "https://explorer.rsk.co",
    sovrynInternalTelegramId: -1001469142339, 
    errorBotTelegram: Object.keys(telegramBot).length > 0 ? telegramBot : null
}