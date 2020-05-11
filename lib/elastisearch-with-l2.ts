import { Construct } from 'constructs';
import * as cdk8s from './cdk8s';
import * as k8s from '../imports/k8s';

export interface SecretMount {

  readonly name: string;

  readonly secretName: string;

  readonly path: string;
}

export interface SysCtl {

  readonly enabled: boolean;

  readonly vmMaxMapCount: number
}

export interface Image {

  readonly name?: string;

  readonly tag?: string;

  readonly pullPolicy?: string;
}

export interface ElasticSearchProps {

  readonly secretMounts?: SecretMount[];

  readonly configMap?: cdk8s.ConfigMap;

  readonly keystore?: k8s.SecretVolumeSource[]

  readonly extraVolumes?: k8s.SecretVolumeSource[]

  readonly sysCtl?: SysCtl;

  readonly image?: Image;

  readonly initResources?: k8s.ResourceRequirements

  readonly extraEnvs?: k8s.EnvVar[]

  readonly extraInitContainers?: k8s.Container[];

}

export class ElasticSearch extends Construct {
  constructor(scope: Construct, id: string, props: ElasticSearchProps) {
    super(scope, id);

    const statefulSet = new cdk8s.StatefulSet(this, 'StatefulSet', {});

    for (const m of props.secretMounts ?? []) {
      
      const volume: k8s.Volume = {
        name: m.name,
        secret: {
          secretName: m.secretName
        }
      }

      statefulSet.spec.template.spec.addVolume(volume);
    }

    if (props.configMap) {

      const volume: k8s.Volume = {
        name: 'esconfig',
        configMap: {
          name: props.configMap.name
        }
      }

      statefulSet.spec.template.spec.addVolume(volume);
    }

    if (props.keystore) {

      const emptyDir: k8s.Volume = {
        name: 'keystore',
        emptyDir: {}
      }

      statefulSet.spec.template.spec.addVolume(emptyDir);

      for (const key of props.keystore) {
        const volume: k8s.Volume = {
          name: `keystore-${key.secretName}`,
          secret: key
        }
        statefulSet.spec.template.spec.addVolume(volume);
      }

      const container: k8s.Container = {
        name: 'keystore',
        image: `${props.image?.name}:${props.image?.tag}`,
        imagePullPolicy: props.image?.pullPolicy,
        command: ['sh', '-c', Resources.of('keystore-init.sh')],
        env: props.extraEnvs,
        resources: props.initResources,
        volumeMounts: [
          {
            name: 'keystore',
            mountPath: '/tmp/keystore'
          },
          ...props.keystore.map((k: k8s.SecretVolumeSource) => {
            return {
              name: `keystore-${k.secretName}`,
              mountPath: `/tmp/keystoreSecrets/${k.secretName}`
            } 
          })
        ]
      }

      statefulSet.spec.template.spec.addInitContainer(container);

    }

    for (const extra of props.extraVolumes ?? []) {
      statefulSet.spec.template.spec.addVolume(extra);
    }

    if (props.sysCtl?.enabled) {

      const container: k8s.Container = {
        name: 'configure-sysctl',
        securityContext: {
          runAsUser: 0,
          privileged: true
        },
        image: `${props.image?.name}:${props.image?.tag}`,
        imagePullPolicy: props.image?.pullPolicy,
        command: ['sysctl', '-w',`vm.max_map_count=${props.sysCtl.vmMaxMapCount}`],
        resources: props.initResources
      }

      statefulSet.spec.template.spec.addInitContainer(container);
    }

    for (const container of props.extraInitContainers ?? []) {
      statefulSet.spec.template.spec.addInitContainer(container);
    }

  }
}

