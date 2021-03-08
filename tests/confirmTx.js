import rskCtrl from '../controller/rskCtrl';


export default async function confirmTx() {
    console.log("Confirm tx.\nInitializing RSK");
    await rskCtrl.init();

   const tx = await rskCtrl.confirmWithdrawRequest(0)
    console.log(tx);
}

confirmTx();