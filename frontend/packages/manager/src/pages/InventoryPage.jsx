import React from 'react';
import InventoryList from "../components/inventory/InventoryList"
import AddInventoryModal from "../components/inventory/AddInventoryModal"

function InventoryPage() {
    return (
        <div>
            <AddInventoryModal />
            <InventoryList/>
        </div>
    );
}

export default InventoryPage;
