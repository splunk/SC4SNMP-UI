import yaml
from kubernetes import client
from SC4SNMP_UI_backend.apply_changes.kubernetes_job import create_job_object

JOB_CONFIGURATION_YAML = yaml.safe_load("""
apiVersion: batch/v1
kind: Job
metadata:
  name: release-name-splunk-connect-for-snmp-inventory
  labels:
    app.kubernetes.io/name: splunk-connect-for-snmp-inventory
    app.kubernetes.io/instance: release-name
    helm.sh/chart: splunk-connect-for-snmp-1.9.0
    app.kubernetes.io/version: "1.9.0"
    app.kubernetes.io/managed-by: Helm
spec:
  ttlSecondsAfterFinished: 300
  template:
    metadata:
      annotations:
        imageregistry: https://hub.docker.com/

      labels:
        app.kubernetes.io/name: splunk-connect-for-snmp-inventory
        app.kubernetes.io/instance: release-name
    spec:
      imagePullSecrets:
        - name: myregistrykey
      containers:
        - name: splunk-connect-for-snmp-inventory
          image: "ghcr.io/splunk/splunk-connect-for-snmp/container:1.9.0"
          imagePullPolicy: Always
          args:
              ["inventory"]
          env:
          - name: CONFIG_PATH
            value: /app/config/config.yaml
          - name: REDIS_URL
            value: redis://release-name-redis-headless:6379/1
          - name: INVENTORY_PATH
            value: /app/inventory/inventory.csv
          - name: CELERY_BROKER_URL
            value: redis://release-name-redis-headless:6379/0
          - name: MONGO_URI
            value: mongodb://release-name-mongodb:27017
          - name: MIB_SOURCES
            value: "http://release-name-mibserver/asn1/@mib@"
          - name: MIB_INDEX
            value: "http://release-name-mibserver/index.csv"
          - name: MIB_STANDARD
            value: "http://release-name-mibserver/standard.txt"
          - name: LOG_LEVEL
            value: INFO
          - name: CONFIG_FROM_MONGO
            value: "true"
          volumeMounts:
            - name: config
              mountPath: "/app/config"
              readOnly: true
            - name: inventory
              mountPath: "/app/inventory"
              readOnly: true
            - name: pysnmp-cache-volume
              mountPath: "/.pysnmp/"
              readOnly: false
            - name: tmp
              mountPath: "/tmp/"
              readOnly: false

      volumes:
        # You set volumes at the Pod level, then mount them into containers inside that Pod
        - name: config
          configMap:
            # Provide the name of the ConfigMap you want to mount.
            name: splunk-connect-for-snmp-config
            # An array of keys from the ConfigMap to create as files
            items:
              - key: "config.yaml"
                path: "config.yaml"
        - name: inventory
          configMap:
            # Provide the name of the ConfigMap you want to mount.
            name: splunk-connect-for-snmp-inventory
            # An array of keys from the ConfigMap to create as files
            items:
              - key: "inventory.csv"
                path: "inventory.csv"
        - name: pysnmp-cache-volume
          emptyDir: {}
        - name: tmp
          emptyDir: {}
      restartPolicy: OnFailure
""")

def test_create_job_object():
    expected_job = client.V1Job(
        api_version="batch/v1",
        kind="Job",
        metadata=client.V1ObjectMeta(
            name="release-name-splunk-connect-for-snmp-inventory",
            labels={
                "app.kubernetes.io/name": "splunk-connect-for-snmp-inventory",
                "app.kubernetes.io/instance": "release-name",
                "helm.sh/chart": "splunk-connect-for-snmp-1.9.0",
                "app.kubernetes.io/version": "1.9.0",
                "app.kubernetes.io/managed-by": "Helm"
            }
        ),
        spec=client.V1JobSpec(
            ttl_seconds_after_finished=300,
            template=client.V1PodTemplateSpec(
                metadata=client.V1ObjectMeta(
                    annotations={
                        "imageregistry": "https://hub.docker.com/"
                    },
                    labels={
                        "app.kubernetes.io/name": "splunk-connect-for-snmp-inventory",
                        "app.kubernetes.io/instance": "release-name"
                    }
                ),
                spec=client.V1PodSpec(
                    image_pull_secrets=[client.V1LocalObjectReference(name="myregistrykey")],
                    containers=[
                        client.V1Container(
                            name="splunk-connect-for-snmp-inventory",
                            image="ghcr.io/splunk/splunk-connect-for-snmp/container:1.9.0",
                            image_pull_policy="Always",
                            args=["inventory"],
                            env=[
                                client.V1EnvVar(name="CONFIG_PATH",value="/app/config/config.yaml"),
                                client.V1EnvVar(name="REDIS_URL", value="redis://release-name-redis-headless:6379/1"),
                                client.V1EnvVar(name="INVENTORY_PATH", value="/app/inventory/inventory.csv"),
                                client.V1EnvVar(name="CELERY_BROKER_URL", value="redis://release-name-redis-headless:6379/0"),
                                client.V1EnvVar(name="MONGO_URI", value="mongodb://release-name-mongodb:27017"),
                                client.V1EnvVar(name="MIB_SOURCES", value="http://release-name-mibserver/asn1/@mib@"),
                                client.V1EnvVar(name="MIB_INDEX", value="http://release-name-mibserver/index.csv"),
                                client.V1EnvVar(name="MIB_STANDARD", value="http://release-name-mibserver/standard.txt"),
                                client.V1EnvVar(name="LOG_LEVEL", value="INFO"),
                                client.V1EnvVar(name="CONFIG_FROM_MONGO", value="true")
                            ],
                            volume_mounts=[
                                client.V1VolumeMount(name="config", mount_path="/app/config", read_only=True),
                                client.V1VolumeMount(name="inventory", mount_path="/app/inventory", read_only=True),
                                client.V1VolumeMount(name="pysnmp-cache-volume", mount_path="/.pysnmp/", read_only=False),
                                client.V1VolumeMount(name="tmp", mount_path="/tmp/", read_only=False),
                            ]
                        )
                    ],
                    volumes=[
                        client.V1Volume(name="config",
                                        config_map=client.V1ConfigMapVolumeSource(
                                            name="splunk-connect-for-snmp-config",
                                            items=[
                                                client.V1KeyToPath(key="config.yaml",path="config.yaml")
                                            ]
                                        )),
                        client.V1Volume(name="inventory",
                                        config_map=client.V1ConfigMapVolumeSource(
                                            name="splunk-connect-for-snmp-inventory",
                                            items=[
                                                client.V1KeyToPath(key="inventory.csv", path="inventory.csv")
                                            ]
                                        )),
                        client.V1Volume(name="pysnmp-cache-volume", empty_dir=client.V1EmptyDirVolumeSource()),
                        client.V1Volume(name="tmp", empty_dir=client.V1EmptyDirVolumeSource())
                    ],
                    restart_policy="OnFailure"
                )
            )
        )
    )

    assert create_job_object(JOB_CONFIGURATION_YAML) == expected_job