import * as k8s from '../imports/k8s';
import { Construct, Node } from 'constructs';

export interface ConfigMapProps {

}

export class ConfigMap extends Construct {

  public readonly name: string;
  public readonly paths: string[];

  constructor(scope: Construct, id: string, props: ConfigMapProps) {
    super(scope, id);

    new k8s.ConfigMap(this, 'ConfigMap', {});
  }
  
}

export interface AWSElasticBlockStore {

  /**
   * Filesystem type of the volume that you want to mount. Tip: Ensure that the filesystem type is supported by the host operating system. Examples: "ext4", "xfs", "ntfs". Implicitly inferred to be "ext4" if unspecified. More info: https://kubernetes.io/docs/concepts/storage/volumes#awselasticblockstore
   *
   * @schema io.k8s.api.core.v1.AWSElasticBlockStoreVolumeSource#fsType
   */
  readonly fsType?: string;

  /**
   * The partition in the volume that you want to mount. If omitted, the default is to mount by volume name. Examples: For volume /dev/sda1, you specify the partition as "1". Similarly, the volume partition for /dev/sda is "0" (or you can leave the property empty).
   *
   * @schema io.k8s.api.core.v1.AWSElasticBlockStoreVolumeSource#partition
   */
  readonly partition?: number;

  /**
   * Specify "true" to force and set the ReadOnly property in VolumeMounts to "true". If omitted, the default is "false". More info: https://kubernetes.io/docs/concepts/storage/volumes#awselasticblockstore
   *
   * @schema io.k8s.api.core.v1.AWSElasticBlockStoreVolumeSource#readOnly
   */
  readonly readOnly?: boolean;

  /**
   * Unique ID of the persistent disk resource in AWS (Amazon EBS volume). More info: https://kubernetes.io/docs/concepts/storage/volumes#awselasticblockstore
   *
   * @schema io.k8s.api.core.v1.AWSElasticBlockStoreVolumeSource#volumeID
   */
  readonly volumeID: string;

}

export class Volume {

  private constructor(public readonly name: string, 
                      public readonly configMap?: ConfigMap,
                      public readonly awsElasticBlockStore?: AWSElasticBlockStore) {}

  public static fromConfigMap(configMap: ConfigMap) {
    return new Volume(`${configMap.name}-volume`, configMap);
  }

  public static fromAWSElasticBlockStore(ebs: AWSElasticBlockStore) {
    return new Volume(`${ebs.volumeID}-volume`, undefined, ebs)
  }

}

/**
 * volumeDevice describes a mapping of a raw block device within a container.
 *
 * @schema io.k8s.api.core.v1.VolumeDevice
 */
export interface VolumeDevice {
  /**
   * devicePath is the path inside of the container that the device will be mapped to.
   *
   * @schema io.k8s.api.core.v1.VolumeDevice#devicePath
   */
  readonly devicePath: string;

  /**
   * name must match the name of a persistentVolumeClaim in the pod
   *
   * @schema io.k8s.api.core.v1.VolumeDevice#name
   */
  readonly name: string;

}

export enum TerminationMessagePolicy {
  
  FILE = 'FILE',

  FALLBACK_TO_LOGS_ON_ERROR = 'FallbackToLogsOnError'
}

export interface TerminationMessage {

  /**
   * Optional: Path at which the file to which the container's termination message will be written is mounted into the container's filesystem. Message written is intended to be brief final status, such as an assertion failure message. Will be truncated by the node if greater than 4096 bytes. The total message length across all containers will be limited to 12kb. Defaults to /dev/termination-log. Cannot be updated.
   *
   * @default dev/termination-log. Cannot be updated.
   * @schema io.k8s.api.core.v1.Container#terminationMessagePath
   */
  readonly path?: string;

  /**
   * Indicate how the termination message should be populated. File will use the contents of terminationMessagePath to populate the container status message on both success and failure. FallbackToLogsOnError will use the last chunk of container log output if the termination message file is empty and the container exited with an error. The log output is limited to 2048 bytes or 80 lines, whichever is smaller. Defaults to File. Cannot be updated.
   *
   * @default File. Cannot be updated.
   * @schema io.k8s.api.core.v1.Container#terminationMessagePolicy
   */
  readonly policy?: TerminationMessagePolicy;

}

export interface ContainerProps {

  /**
   * Arguments to the entrypoint. The docker image's CMD is used if this is not provided. Variable references $(VAR_NAME) are expanded using the container's environment. If a variable cannot be resolved, the reference in the input string will be unchanged. The $(VAR_NAME) syntax can be escaped with a double $$, ie: $$(VAR_NAME). Escaped references will never be expanded, regardless of whether the variable exists or not. Cannot be updated. More info: https://kubernetes.io/docs/tasks/inject-data-application/define-command-argument-container/#running-a-command-in-a-shell
   *
   * @schema io.k8s.api.core.v1.Container#args
   */
  readonly args?: string[];

  /**
   * Entrypoint array. Not executed within a shell. The docker image's ENTRYPOINT is used if this is not provided. Variable references $(VAR_NAME) are expanded using the container's environment. If a variable cannot be resolved, the reference in the input string will be unchanged. The $(VAR_NAME) syntax can be escaped with a double $$, ie: $$(VAR_NAME). Escaped references will never be expanded, regardless of whether the variable exists or not. Cannot be updated. More info: https://kubernetes.io/docs/tasks/inject-data-application/define-command-argument-container/#running-a-command-in-a-shell
   *
   * @schema io.k8s.api.core.v1.Container#command
   */
  readonly command?: string[];

  /**
   * List of environment variables to set in the container. Cannot be updated.
   *
   * @schema io.k8s.api.core.v1.Container#env
   */
  readonly env?: EnvVar[];

  /**
   * List of sources to populate environment variables in the container. The keys defined within a source must be a C_IDENTIFIER. All invalid keys will be reported as an event when the container is starting. When a key exists in multiple sources, the value associated with the last source will take precedence. Values defined by an Env with a duplicate key will take precedence. Cannot be updated.
   *
   * @schema io.k8s.api.core.v1.Container#envFrom
   */
  readonly envFrom?: EnvFromSource[];

  /**
   * Docker image name. More info: https://kubernetes.io/docs/concepts/containers/images This field is optional to allow higher level config management to default or override container images in workload controllers like Deployments and StatefulSets.
   *
   * @schema io.k8s.api.core.v1.Container#image
   */
  readonly image?: string;

  /**
   * Image pull policy. One of Always, Never, IfNotPresent. Defaults to Always if :latest tag is specified, or IfNotPresent otherwise. Cannot be updated. More info: https://kubernetes.io/docs/concepts/containers/images#updating-images
   *
   * @default Always if :latest tag is specified, or IfNotPresent otherwise. Cannot be updated. More info: https://kubernetes.io/docs/concepts/containers/images#updating-images
   * @schema io.k8s.api.core.v1.Container#imagePullPolicy
   */
  readonly imagePullPolicy?: string;

  /**
   * Actions that the management system should take in response to container lifecycle events. Cannot be updated.
   *
   * @schema io.k8s.api.core.v1.Container#lifecycle
   */
  readonly lifecycle?: Lifecycle;

  /**
   * Periodic probe of container liveness. Container will be restarted if the probe fails. Cannot be updated. More info: https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle#container-probes
   *
   * @schema io.k8s.api.core.v1.Container#livenessProbe
   */
  readonly livenessProbe?: Probe;

  /**
   * Name of the container specified as a DNS_LABEL. Each container in a pod must have a unique name (DNS_LABEL). Cannot be updated.
   *
   * @schema io.k8s.api.core.v1.Container#name
   */
  readonly name: string;

  /**
   * List of ports to expose from the container. Exposing a port here gives the system additional information about the network connections a container uses, but is primarily informational. Not specifying a port here DOES NOT prevent that port from being exposed. Any port which is listening on the default "0.0.0.0" address inside a container will be accessible from the network. Cannot be updated.
   *
   * @schema io.k8s.api.core.v1.Container#ports
   */
  readonly ports?: ContainerPort[];

  /**
   * Periodic probe of container service readiness. Container will be removed from service endpoints if the probe fails. Cannot be updated. More info: https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle#container-probes
   *
   * @schema io.k8s.api.core.v1.Container#readinessProbe
   */
  readonly readinessProbe?: Probe;

  /**
   * Compute Resources required by this container. Cannot be updated. More info: https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/
   *
   * @schema io.k8s.api.core.v1.Container#resources
   */
  readonly resources?: ResourceRequirements;

  /**
   * Security options the pod should run with. More info: https://kubernetes.io/docs/concepts/policy/security-context/ More info: https://kubernetes.io/docs/tasks/configure-pod-container/security-context/
   *
   * @schema io.k8s.api.core.v1.Container#securityContext
   */
  readonly securityContext?: SecurityContext;

  /**
   * Whether this container should allocate a buffer for stdin in the container runtime. If this is not set, reads from stdin in the container will always result in EOF. Default is false.
   *
   * @default false.
   * @schema io.k8s.api.core.v1.Container#stdin
   */
  readonly stdin?: boolean;

  /**
   * Whether the container runtime should close the stdin channel after it has been opened by a single attach. When stdin is true the stdin stream will remain open across multiple attach sessions. If stdinOnce is set to true, stdin is opened on container start, is empty until the first client attaches to stdin, and then remains open and accepts data until the client disconnects, at which time stdin is closed and remains closed until the container is restarted. If this flag is false, a container processes that reads from stdin will never receive an EOF. Default is false
   *
   * @default false
   * @schema io.k8s.api.core.v1.Container#stdinOnce
   */
  readonly stdinOnce?: boolean;

  readonly terminationMessage?: TerminationMessage;

  /**
   * Whether this container should allocate a TTY for itself, also requires 'stdin' to be true. Default is false.
   *
   * @default false.
   * @schema io.k8s.api.core.v1.Container#tty
   */
  readonly tty?: boolean;

  /**
   * volumeDevices is the list of block devices to be used by the container. This is a beta feature.
   *
   * @schema io.k8s.api.core.v1.Container#volumeDevices
   */
  readonly volumeDevices?: VolumeDevice[];

  /**
   * Pod volumes to mount into the container's filesystem. Cannot be updated.
   *
   * @schema io.k8s.api.core.v1.Container#volumeMounts
   */
  readonly volumeMounts?: VolumeMount[];

  /**
   * Container's working directory. If not specified, the container runtime's default will be used, which might be configured in the container image. Cannot be updated.
   *
   * @schema io.k8s.api.core.v1.Container#workingDir
   */
  readonly workingDir?: string;

}

export interface VolumeMount {

  /**
   * Path within the container at which the volume should be mounted.  Must not contain ':'.
   *
   * @schema io.k8s.api.core.v1.VolumeMount#mountPath
   */
  readonly mountPath: string;

  /**
   * mountPropagation determines how mounts are propagated from the host to container and the other way around. When not set, MountPropagationNone is used. This field is beta in 1.10.
   *
   * @schema io.k8s.api.core.v1.VolumeMount#mountPropagation
   */
  readonly mountPropagation?: string;

  /**
   * This must match the Name of a Volume.
   *
   * @schema io.k8s.api.core.v1.VolumeMount#name
   */
  readonly name: string;

  /**
   * Mounted read-only if true, read-write otherwise (false or unspecified). Defaults to false.
   *
   * @default false.
   * @schema io.k8s.api.core.v1.VolumeMount#readOnly
   */
  readonly readOnly?: boolean;

  /**
   * Path within the volume from which the container's volume should be mounted. Defaults to "" (volume's root).
   *
   * @default volume's root).
   * @schema io.k8s.api.core.v1.VolumeMount#subPath
   */
  readonly subPath?: string;

  /**
   * Expanded path within the volume from which the container's volume should be mounted. Behaves similarly to SubPath but environment variable references $(VAR_NAME) are expanded using the container's environment. Defaults to "" (volume's root). SubPathExpr and SubPath are mutually exclusive. This field is beta in 1.15.
   *
   * @default volume's root). SubPathExpr and SubPath are mutually exclusive. This field is beta in 1.15.
   * @schema io.k8s.api.core.v1.VolumeMount#subPathExpr
   */
  readonly subPathExpr?: string;

}

export class Container {

  public name: string;
  public args?: string[];
  public command?: string[];
  public env?: EnvVar[];
  public envFrom?: EnvFromSource[];
  public image?: string;
  public imagePullPolicy?: string;
  public lifecycle?: Lifecycle;
  public livenessProbe?: Probe;
  public ports?: ContainerPort[];
  public readinessProbe?: Probe;
  public resources?: ResourceRequirements;
  public securityContext?: SecurityContext;
  public stdin?: boolean;
  public stdinOnce?: boolean;
  public terminationMessage?: TerminationMessage;
  public tty?: boolean;
  public volumeDevices?: VolumeDevice[];
  public volumeMounts: VolumeMount[];
  public workingDir?: string;

  constructor(props: ContainerProps) {
    this.volumeMounts = props.volumeMounts ?? []
  }

  public mount(volumeMount: VolumeMount) {
    this.volumeMounts.push(volumeMount)
  }

  public expose() {
    
  }

  public allocateTTY() {
    this.tty = true;

    // stdin must be true to allocate tty. 
    // TODO - what happens if the user explicitly set to false?
    this.stdin = true;
  }

  public get spec(): k8s.Container {

  }

}

export interface StatefulSetProps {

  readonly containers: Container[];

  readonly configMap?: ConfigMap;

}

export class StatefulSet extends Construct {

  private readonly props: StatefulSetProps;

  constructor(scope: Construct, id: string, props: StatefulSetProps) {
    super(scope, id);

    this.props = props;

    const volumes: k8s.Volume[] = []
    const containers: k8s.Container[] = [];

    if (props.configMap) {

      // make sure the configMap is created before since we depend on it.
      // TODO - check if 'kustomize' handles this already.
      Node.of(this).addDependency(props.configMap)

      // first add a volume that contains the config map.
      const volume = Volume.fromConfigMap(props.configMap);

      volumes.push({
        name: volume.name,
        configMap: {
          name: volume.configMap!.name
        }
      })

      // for every container, mount each of config map paths
      // to a different mount point.
      for (const container of this.props.containers) {

        for (const p of props.configMap.paths) {
          container.mount({
            name: volume.name,
            mountPath: p
          })  
        }
      }

    }

    for (const c of props.containers) {
      containers.push({
        name: c.name,
        volumeMounts: c.volumeMounts,
        tty: c.tty,
        stdin: c.stdin,
        terminationMessagePath: c.terminationMessage?.path,
        terminationMessagePolicy: c.terminationMessage?.policy
      });
    }
    
    new k8s.StatefulSet(this, 'StatefulSet', {
      spec: {
        template: {
          spec: {
            volumes: volumes,
            containers: containers,
          }
        },
        serviceName: '',
        selector: {
          matchLabels: {

          }
        },
      }
    });
  }

}