from flask import Blueprint, jsonify
from flask_cors import cross_origin
from SC4SNMP_UI_backend.apply_changes.apply_changes import ApplyChanges
import os

apply_changes_blueprint = Blueprint('common_blueprint', __name__)
JOB_CREATION_RETRIES = int(os.getenv("JOB_CREATION_RETRIES", 10))

@apply_changes_blueprint.route("/apply-changes", methods=['POST'])
@cross_origin()
def apply_changes():
    changes = ApplyChanges()
    job_delay, currently_scheduled = changes.apply_changes()
    if job_delay <= 1 and currently_scheduled:
        message = "There might be previous kubernetes job still present in the namespace. Configuration update will be" \
                  f"retried {JOB_CREATION_RETRIES} times. If your configuration won't be updated in a few minutes, make sure that " \
                  f"snmp-splunk-connect-for-snmp-inventory job isn't present in your kubernetes deployment namespace and " \
                  f"click 'Apply changes' button once again."
    else:
        message = f"Configuration will be updated in approximately {job_delay} seconds."
    result = jsonify({"message": message})
    return result, 200