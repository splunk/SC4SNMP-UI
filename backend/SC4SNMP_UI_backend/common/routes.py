from flask import request, Blueprint
from flask_cors import cross_origin
from kubernetes import client, config

common_blueprint = Blueprint('common_blueprint', __name__)

@common_blueprint.route("/apply-changes")
@cross_origin()
def apply_changes():
    config.load_incluster_config()
    batch_v1 = client.BatchV1Api()

    job = create_job_object()
    create_job(batch_v1, job)
    update_job(batch_v1, job)

JOB_NAME = "pi"

def create_job_object():
    # Configureate Pod template container
    container = client.V1Container(
        name="pi",
        image="perl",
        command=["perl", "-Mbignum=bpi", "-wle", "print bpi(2000)"])
    # Create and configurate a spec section
    template = client.V1PodTemplateSpec(
        metadata=client.V1ObjectMeta(labels={"app": "pi"}),
        spec=client.V1PodSpec(restart_policy="Never", containers=[container]))
    # Create the specification of deployment
    spec = client.V1JobSpec(
        template=template,
        backoff_limit=4)
    # Instantiate the job object
    job = client.V1Job(
        api_version="batch/v1",
        kind="Job",
        metadata=client.V1ObjectMeta(name=JOB_NAME),
        spec=spec)

    return job

def create_job(api_instance, job):
    # Create job
    api_response = api_instance.create_namespaced_job(
        body=job,
        namespace="default")
    print("Job created. status='%s'" % str(api_response.status))

def update_job(api_instance, job):
    # Update container image
    job.spec.template.spec.containers[0].image = "perl"
    # Update the job
    api_response = api_instance.patch_namespaced_job(
        name=JOB_NAME,
        namespace="default",
        body=job)
    print("Job updated. status='%s'" % str(api_response.status))

def delete_job(api_instance):
    # Delete job
    api_response = api_instance.delete_namespaced_job(
        name=JOB_NAME,
        namespace="default",
        body=client.V1DeleteOptions(
            propagation_policy='Foreground',
            grace_period_seconds=5))
    print("Job deleted. status='%s'" % str(api_response.status))
