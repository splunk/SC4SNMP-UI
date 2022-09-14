import React from 'react';
import InventoryList from "../components/inventory/InventoryList"
import InventoryModal from "../components/inventory/InventoryModal"

function InventoryPage() {
    return (
        <div>
            <InventoryModal />
            <InventoryList />
        </div>
    );
}

export default InventoryPage;
