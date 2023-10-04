from kubernetes import client
from copy import copy
from celery.utils.log import get_task_logger

logger = get_task_logger(__name__)

# Functions in this file create different sections of kubernetes job,
# based on job config yaml file from splunk-connect-for-snmp.

def create_container(container: dict):
    """
    Create a container object from yaml configuration.

    :param container: Parsed yaml configuration of a single container from
                    spec.template.spec.containers section.
    :return: V1Container
    """
    name = container["name"]
    image = container["image"]
    image_pull_policy = container["imagePullPolicy"]
    args = container["args"]
    env = []
    for e in container["env"]:
        env_var = client.V1EnvVar(name=e["name"],
                                  value=e["value"])
        env.append(copy(env_var))
    volume_mounts = []
    for v in container["volumeMounts"]:
        vol = client.V1VolumeMount(name=v["name"],
                                   mount_path=v["mountPath"],
                                   read_only=v["readOnly"])
        volume_mounts.append(copy(vol))
    container_object = client.V1Container(name=name,
                                          image=image,
                                          image_pull_policy=image_pull_policy,
                                          args=args,
                                          env=env,
                                          volume_mounts=volume_mounts)
    return container_object


def create_volume(volume: dict):
    """
    Create a volume object from yaml configuration.
    
    :param volume: Parsed yaml configuration of a single volume from
                    spec.template.spec.volumes section.
    :return: V1Volume
    """
    name = volume["name"]
    if "configMap" in volume:
        config_map_name = volume["configMap"]["name"]
        items = []
        for i in volume["configMap"]["items"]:
            item = client.V1KeyToPath(key=i["key"],
                                      path=i["path"])
            items.append(copy(item))
        config_map = client.V1ConfigMapVolumeSource(name=config_map_name,
                                                    items=items)
        volume_object = client.V1Volume(name=name,
                                        config_map=config_map)
    else:
        volume_object = client.V1Volume(name=name,
                                        empty_dir=client.V1EmptyDirVolumeSource())
    return volume_object


def create_pod_spec(spec: dict):
    """
    Create spec.template.spec section of a kubernetes job.

    :param spec: Parsed yaml spec.template.spec configuration
    :return: V1PodSpec
    """
    containers = [create_container(c) for c in spec["containers"]]
    volumes = [create_volume(v) for v in spec["volumes"]]
    restart_policy = spec["restartPolicy"]
    secrets = None
    if "imagePullSecrets" in spec:
        secrets = []
        for secret in spec["imagePullSecrets"]:
            new_secret = client.V1LocalObjectReference(name=secret["name"])
            secrets.append(new_secret)
    if secrets is not None:
        spec_object = client.V1PodSpec(containers=containers,
                                       volumes=volumes,
                                       restart_policy=restart_policy,
                                       image_pull_secrets=secrets)
    else:
        spec_object = client.V1PodSpec(containers=containers,
                                       volumes=volumes,
                                       restart_policy=restart_policy)
    return spec_object


def create_pod_metadata(metadata: dict):
    """
    Create spec.template.metadata section of a kubernetes job.

    :param metadata: Parsed yaml spec.template.metadata configuration
    :return: V1ObjectMeta
    """
    labels = {}
    for key, value in metadata["labels"].items():
        labels[key] = value
    annotations = None
    if "annotations" in metadata:
        annotations = {}
        for key, value in metadata["annotations"].items():
            annotations[key] = value
    if annotations is not None:
        metadata_object = client.V1ObjectMeta(annotations=annotations, labels=labels)
    else:
        metadata_object = client.V1ObjectMeta(labels=labels)
    return metadata_object


def create_pod_template(pod_template: dict):
    """
    Create spec.template section of a kubernetes job.

    :param pod_template: Parsed yaml spec.template configuration
    :return: V1PodTemplateSpec
    """
    metadata = create_pod_metadata(pod_template["metadata"])
    spec = create_pod_spec(pod_template["spec"])
    template_object = client.V1PodTemplateSpec(metadata=metadata,
                                               spec=spec)
    return template_object


def create_job_spec(spec: dict):
    """
    Create spec section of a kubernetes job.

    :param spec: Parsed yaml job spec configuration
    :return:V1JobSpec
    """
    ttl_seconds_after_finished = spec["ttlSecondsAfterFinished"]
    template = create_pod_template(spec["template"])
    job_spec_object = client.V1JobSpec(ttl_seconds_after_finished=ttl_seconds_after_finished,
                                       template=template)
    return job_spec_object


def create_job_metadata(metadata: dict):
    """
    Create metadata section of a kubernetes job.

    :param metadata: Parsed yaml job metadata configuration
    :return: V1ObjectMeta
    """
    name = metadata["name"]
    labels = {}
    for key, value in metadata["labels"].items():
        labels[key] = value
    metadata_object = client.V1ObjectMeta(name=name,
                                          labels=labels)
    return metadata_object


def create_job_object(config_file: dict):
    """
    Create job object based on provided configuration file

    :param config_file: Parsed yaml job configuration file
    :return: V1Job
    """
    metadata = create_job_metadata(config_file["metadata"])
    spec = create_job_spec(config_file["spec"])
    job = client.V1Job(
        api_version="batch/v1",
        kind="Job",
        metadata=metadata,
        spec=spec)

    return job

def create_job(api_instance, job, namespace):
    """
    Create new job in kubernetes namespace
    """
    if api_instance is None or job is None:
        logger.debug("Api instance and job must not be None")
    else:
        api_response = api_instance.create_namespaced_job(
            body=job,
            namespace=namespace)
        logger.info(f"Job created. status='{str(api_response.status)}'")