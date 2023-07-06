from unittest import mock
from unittest.mock import call
from bson import ObjectId
import datetime


common_id = "635916b2c8cb7a15f28af40a"

@mock.patch("SC4SNMP_UI_backend.apply_changes.handle_changes.datetime")
@mock.patch("SC4SNMP_UI_backend.apply_changes.handle_changes.run_job")
@mock.patch("pymongo.collection.Collection.update_one")
@mock.patch("pymongo.collection.Collection.find")
def test_apply_changes_first_call(m_find, m_update, m_run_job, m_datetime, client):
    datetime_object = datetime.datetime(2020, 7, 10, 10, 30, 0, 0)
    m_datetime.datetime.utcnow = mock.Mock(return_value=datetime_object)
    collection = {
        "_id": ObjectId(common_id),
        "previous_job_start_time": None,
        "currently_scheduled": False
    }
    m_find.side_effect = [
        [collection],
        [collection],
        [collection]
    ]
    calls_find = [
        call(),
        call(),
        call()
    ]
    calls_update = [
        call({"_id": ObjectId(common_id)},{"$set": {"previous_job_start_time": datetime_object}}),
        call({"_id": ObjectId(common_id)},{"$set": {"currently_scheduled": True}})
    ]
    apply_async_calls = [
        call(countdown=300, queue='apply_changes')
    ]

    m_run_job.apply_async.return_value = None
    m_update.return_value = None

    response = client.post("/apply-changes")
    m_find.assert_has_calls(calls_find)
    m_update.assert_has_calls(calls_update)
    m_run_job.apply_async.assert_has_calls(apply_async_calls)
    assert response.json == {"message": "Configuration will be updated in approximately 300 seconds"}


@mock.patch("SC4SNMP_UI_backend.apply_changes.handle_changes.datetime")
@mock.patch("SC4SNMP_UI_backend.apply_changes.handle_changes.run_job")
@mock.patch("pymongo.collection.Collection.update_one")
@mock.patch("pymongo.collection.Collection.find")
def test_apply_changes_job_currently_scheduled(m_find, m_update, m_run_job, m_datetime, client):
    datetime_object_old = datetime.datetime(2020, 7, 10, 10, 27, 10, 0)
    datetime_object_new = datetime.datetime(2020, 7, 10, 10, 30, 0, 0)
    m_datetime.datetime.utcnow = mock.Mock(return_value=datetime_object_new)
    collection = {
        "_id": ObjectId(common_id),
        "previous_job_start_time": datetime_object_old,
        "currently_scheduled": True
    }
    m_find.side_effect = [
        [collection],
        [collection],
        [collection]
    ]
    calls_find = [
        call(),
        call(),
        call()
    ]
    m_run_job.apply_async.return_value = None
    m_update.return_value = None

    response = client.post("/apply-changes")
    m_find.assert_has_calls(calls_find)
    assert not m_run_job.apply_async.called
    assert response.json == {"message": "Configuration will be updated in approximately 130 seconds"}


@mock.patch("SC4SNMP_UI_backend.apply_changes.handle_changes.datetime")
@mock.patch("SC4SNMP_UI_backend.apply_changes.handle_changes.run_job")
@mock.patch("pymongo.collection.Collection.update_one")
@mock.patch("pymongo.collection.Collection.find")
def test_apply_changes_new_job_delay_1(m_find, m_update, m_run_job, m_datetime, client):
    datetime_object_old = datetime.datetime(2020, 7, 10, 10, 20, 0, 0)
    datetime_object_new = datetime.datetime(2020, 7, 10, 10, 30, 0, 0)
    m_datetime.datetime.utcnow = mock.Mock(return_value=datetime_object_new)
    collection = {
        "_id": ObjectId(common_id),
        "previous_job_start_time": datetime_object_old,
        "currently_scheduled": False
    }
    m_find.side_effect = [
        [collection],
        [collection],
        [collection]
    ]
    calls_find = [
        call(),
        call(),
        call()
    ]
    apply_async_calls = [
        call(countdown=1, queue='apply_changes')
    ]

    m_run_job.apply_async.return_value = None
    m_update.return_value = None

    response = client.post("/apply-changes")
    m_find.assert_has_calls(calls_find)
    m_run_job.apply_async.assert_has_calls(apply_async_calls)
    assert response.json == {"message": "Configuration will be updated in approximately 1 seconds"}


@mock.patch("SC4SNMP_UI_backend.apply_changes.handle_changes.datetime")
@mock.patch("SC4SNMP_UI_backend.apply_changes.handle_changes.run_job")
@mock.patch("pymongo.collection.Collection.update_one")
@mock.patch("pymongo.collection.Collection.find")
def test_apply_changes_new_job_delay_when_previous_failed(m_find, m_update, m_run_job, m_datetime, client):
    datetime_object_old = datetime.datetime(2020, 7, 10, 10, 20, 0, 0)
    datetime_object_new = datetime.datetime(2020, 7, 10, 10, 30, 0, 0)
    m_datetime.datetime.utcnow = mock.Mock(return_value=datetime_object_new)
    collection_failed = {
        "_id": ObjectId(common_id),
        "previous_job_start_time": datetime_object_old,
        "currently_scheduled": True
    }
    collection_updated = {
        "_id": ObjectId(common_id),
        "previous_job_start_time": datetime_object_old,
        "currently_scheduled": False
    }

    m_find.side_effect = [
        [collection_failed],
        [collection_failed],
        [collection_updated]
    ]
    calls_find = [
        call(),
        call(),
        call()
    ]
    calls_update = [
        call({"_id": ObjectId(common_id)}, {"$set": {"currently_scheduled": False}}),
        call({"_id": ObjectId(common_id)},{"$set": {"currently_scheduled": True}})
    ]
    apply_async_calls = [
        call(countdown=1, queue='apply_changes')
    ]

    m_run_job.apply_async.return_value = None
    m_update.return_value = None

    response = client.post("/apply-changes")
    m_find.assert_has_calls(calls_find)
    m_update.assert_has_calls(calls_update)
    m_run_job.apply_async.assert_has_calls(apply_async_calls)
    assert response.json == {"message": "Configuration will be updated in approximately 1 seconds"}