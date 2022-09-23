import React, {useContext} from 'react';
import InventoryList from "../components/inventory/InventoryList"
import AddInventoryModal from "../components/inventory/AddInventoryModal"
import InventoryContext from "../store/inventory-contxt";
import Button from '@splunk/react-ui/Button';

function InventoryPage() {
    const InvCtx = useContext(InventoryContext);

    const handleRequestOpen = () => {
        InvCtx.setAddOpen(true);
        InvCtx.setIsEdit(false);
        InvCtx.resetFormData();
    };

    return (
        <div>
            <Button onClick={handleRequestOpen} ref={InvCtx.addModalToggle} label="Add new device" />
            <AddInventoryModal />
            <InventoryList inventoryChange={InvCtx.inventoryChange}/>
        </div>
    );
}

export default InventoryPage;
