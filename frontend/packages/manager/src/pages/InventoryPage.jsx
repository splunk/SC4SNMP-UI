import React, {useContext} from 'react';
import InventoryList from "../components/inventory/InventoryList"
import AddInventoryModal from "../components/inventory/AddInventoryModal"
import InventoryContext from "../store/inventory-contxt";
import Button from '@splunk/react-ui/Button';

function InventoryPage() {
    const InvCtx = useContext(InventoryContext);

    return (
        <div>
            <AddInventoryModal />
            <InventoryList inventoryChange={InvCtx.inventoryChange}/>
        </div>
    );
}

export default InventoryPage;
