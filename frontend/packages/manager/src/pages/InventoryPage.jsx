import React from 'react';
import InventoryList from "../components/InventoryList"
import InventoryModal from "../components/InventoryModal"

function InventoryPage() {
    return (
        <div>
            <InventoryModal />
            <InventoryList />
        </div>
    );
}

export default InventoryPage;
