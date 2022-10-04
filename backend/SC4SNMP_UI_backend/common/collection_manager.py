class ConnectorCollectionManager:
    def __init__(self, mongo, collection_name):
        self.mongo = mongo
        self.collection = getattr(mongo.sc4snmp, collection_name)

    def return_collection_once(self):
        collection_elements = {}
        collection_cursor = self.collection.find({}, {"_id": 0})
        for item in collection_cursor:
            collection_elements.update(item)
        return collection_elements

    def return_collection(self):
        for retry in range(3):
            collection_elements = self.return_collection_once()
            if collection_elements:
                return collection_elements
        return {}

    def update_collection(self, elements):
        elements_to_insert = []
        for key, value in elements.items():
            elements_to_insert.append({key: value})
        if elements_to_insert:
            with self.mongo.start_session() as session:
                with session.start_transaction():
                    self.collection.delete_many({})
                    self.collection.insert_many(elements_to_insert)
        else:
            self.collection.delete_many({})
