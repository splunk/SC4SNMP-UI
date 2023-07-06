from flask import Blueprint, jsonify
from flask_cors import cross_origin
from SC4SNMP_UI_backend.apply_changes.handle_changes import ApplyChanges

apply_changes_blueprint = Blueprint('common_blueprint', __name__)

@apply_changes_blueprint.route("/apply-changes", methods=['POST'])
@cross_origin()
def apply_changes():
    changes = ApplyChanges()
    job_delay = changes.apply_changes()
    result = jsonify({"message": f"Configuration will be updated in approximately {job_delay} seconds"})
    return result, 200