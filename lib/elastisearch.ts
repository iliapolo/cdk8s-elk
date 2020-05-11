import { Construct } from 'constructs';
import * as k8s from '../imports/k8s';
import * as YAML from 'yaml';

export interface ElasticSearchProps {

  readonly esConfig?: any;

  readonly ingress?: any;

  readonly maxUnavailable?: number

  readonly httpPort?: number

  readonly transportPort?: number

  readonly podSecurityPolicy?: any

  readonly rbac?: any

  readonly nodeGroup: string

  readonly service: any

  readonly labels: any

  readonly replicas: number

  readonly podManagementPolicy: string

  readonly updateStrategy: string

  readonly persistence: any

  readonly volumeClaimTemplate: any

  readonly podAnnotations: any

  readonly schedulerName: string

  readonly podSecurityContext: any

  readonly tolerations: any

  readonly nodeSelector: any

  readonly antiAffinity: string

  readonly nodeAffinity: any

  readonly priorityClassName: string

  readonly antiAffinityTopologyKey: string

  readonly terminationGracePeriodSeconds: number

  readonly keystore: any

  readonly extraVolumes: any

  readonly imagePullSecrets: any

  readonly sysctlInitContainer: any

  readonly image: string

  readonly imageTag: string

  readonly imagePullPolicy: string

  readonly sysctlVmMaxMapCount: number

  readonly initResources: any

  readonly extraEnvs: any

  readonly extraInitContainers: any

  readonly securityContext: any

  readonly readinessProbe: any

  readonly resources: any

  readonly roles: any

  readonly minimumMasterNodes: number
}

export class ElasticSearch extends Construct {
  constructor(scope: Construct, id: string, props: ElasticSearchProps) {
    super(scope, id);

    const heritage = `"${releaseService}"`;
    const release = `"${releaseName}"`;
    const chart = `"${chartName}-${chartVersion}"`;
    const app = `"${uname}"`;
    const namespace = `"${releaseNamespace}"`;
    const masterService = 'TBD';
    const majorVersion = 'TBD'
    const uname = 'TBD';
    
    if (props.esConfig) {

      const data: Record<string, string> = {}

      for (let path in props.esConfig) {
        data[path] = ` | \n${YAML.stringify(props.esConfig[path], {indent: 2})}`
      }

      new k8s.ConfigMap(this, 'ConfigMap', {
        metadata: {
          name: `${uname}-config`,
          labels: {
            heritage: heritage,
            release: release,
            chart: chart,
            app: app,
          }
        },
        data: data
      })
    }

    if (props.ingress?.enabled) {

      const tls: k8s.IngressTLS[] = []

      for (let t in props.ingress.tls) {
        tls.push({
          hosts: t.hosts,
          secretName: t.secretName
        })
      }

      const rules: k8s.IngressRule[] = []

      for (let host in props.ingress.hosts) {
        rules.push({
          host: host,
          http: {
            paths: [{
              path: props.ingress.path,
              backend: {
                serviceName: uname,
                servicePort: props.httpPort
              }
            }]
          }
        })
      }

      new k8s.Ingress(this, 'Ingress', {
        metadata: {
          name: uname,
          labels: {
            app: app,
            release: release,
            heritage: heritage
          },
          annotations: props.ingress.annotations
        },
        spec: {
          tls: tls,
          rules: rules
        }
      })

    }

    if (props.maxUnavailable) {
      new k8s.PodDisruptionBudget(this, 'PodDisruptionBudget', {
        metadata: {
          name: `${uname}-pdb`
        },
        spec: {
          maxUnavailable: props.maxUnavailable,
          selector: {
            matchLabels: {
              app: uname
            }
          }
        }
      })
    }

    if (props.podSecurityPolicy?.create) {
      new k8s.PodSecurityPolicy(this, 'PodSecurityPolicy', {
        metadata: {
          name: `"${props.podSecurityPolicy.name ?? uname}"`,
          labels: {
            heritage: heritage,
            release: release,
            chart: chart,
            app: app
          }
        },
        spec: props.podSecurityPolicy.spec
      })
    }

    if (props.rbac?.create) {
      
      new k8s.Role(this, 'Role', {
        metadata: {
          name: `"${uname}"`,
          labels: {
            heritage: heritage,
            release: release,
            chart: chart,
            app: app
          }
        },
        rules: [{
          apiGroups: ['extensions'],
          resources: ['podsecuritypolicies'],
          resourceNames: [`"${props.podSecurityPolicy?.name || uname}"`],
          verbs: ['use']
        }]
      })

      new k8s.RoleBinding(this, 'RoleBinding', {
        metadata: {
          name: `"${uname}"`,
          labels: {
            heritage: heritage,
            release: release,
            chart: chart,
            app: app
          }
        },
        subjects: [{
          kind: 'ServiceAccount',
          name: `"${props.rbac?.serviceAccountName || uname}"`,
          namespace: namespace
        }],
        roleRef: {
          kind: 'Role',
          name: uname,
          apiGroup: 'rbac.authorization.k8s.io'
        }
      })

      new k8s.ServiceAccount(this, 'ServiceAccount', {
        metadata: {
          name: `"${props.rbac.serviceAccountName || uname}"`,
          labels: {
            heritage: heritage,
            release: release,
            chart: chart,
            app: app
          }
        }
      })
    }

    new k8s.Service(this, 'Service', {
      metadata: {
        name: props.nodeGroup === 'master' ? masterService : uname,
        labels: {
          heritage: heritage,
          release: release,
          chart: chart,
          app: app
          ...props.service.labels
        },
        annotations: props.service.annotations
      },
      spec: {
        type: props.service.type,
        selector: {
          heritage: heritage,
          release: release,
          chart: chart,
          app: app
        },
        ports: [
          {
            name: props.service.httpPortName || 'default',
            protocol: 'TCP',
            port: props.httpPort,
            nodePort: props.service.nodePort
          },
          {
            name: props.service.transportPortName || 'transport',
            protocol: 'TCP',
            port: props.transportPort
          }
        ],
        loadBalancerIP: props.service.loadBalancerIP,
        loadBalancerSourceRanges: props.service.loadBalancerSourceRanges
      }
    })

    new k8s.Service(this, 'Service', {
      metadata: {
        name: `${props.nodeGroup === 'master' ? masterService : uname}-headless`,
        labels: {
          heritage: heritage,
          release: release,
          chart: chart,
          app: app,
          ...props.service.labelsHeadless
        },
        annotations: {
          'service.alpha.kubernetes.io/tolerate-unready-endpoints': 'true'
        }
      },
      spec: {
        // This is needed for statefulset hostnames like elasticsearch-0 to resolve
        clusterIP: 'None',
        // Create endpoints also if the related pod isn't ready
        publishNotReadyAddresses: true,
        selector: {
          app: app
        },
        ports: [
          {
            name: props.service.httpPortName || 'http',
            port: props.httpPort
          },
          {
            name: props.service.transportPortName || 'transport',
            port: props.transportPort
          }
        ]

      }
    })

    const affinity = props.antiAffinity === 'hard' || props.antiAffinity === 'soft' || props.nodeAffinity

    let podAffinity: k8s.PodAffinity = {}

    if (props.antiAffinity === 'hard') {
      podAffinity = {
        requiredDuringSchedulingIgnoredDuringExecution: [
          {
            labelSelector: {
              matchExpressions: [
                {
                  key: 'app',
                  operator: 'In',
                  values: [uname]
                }
              ]
            },
            topologyKey: props.antiAffinityTopologyKey
          }
        ]
      }
    } else if (props.antiAffinity === 'soft') {
      podAffinity = {
        preferredDuringSchedulingIgnoredDuringExecution: [
          {
            weight: 1,
            podAffinityTerm: {
              topologyKey: props.antiAffinityTopologyKey,
              labelSelector: {
                matchExpressions: [
                  {
                    key: 'app',
                    operator: 'In',
                    values: [uname]
                  }
                ]
              }
            }
          }
        ]
      }
    }

    new k8s.StatefulSet(this, 'StatefulSet', {
      metadata: {
        name: uname,
        labels: {
          heritage: heritage,
          release: release,
          chart: chart,
          app: app,
          ...props.labels
        },
        annotations: {
          'esMajorVersion': majorVersion
        }
      },
      spec: {
        serviceName: `${uname}-headless`,
        selector: {
          matchLabels: {
            app: app
          }
        },
        replicas: props.replicas,
        podManagementPolicy: props.podManagementPolicy,
        updateStrategy: {
          type: props.updateStrategy
        },
        volumeClaimTemplates: props.persistence?.enabled ? [
          new k8s.PersistentVolumeClaim(this, 'PersistentVolumeClaim', {
            metadata: {
              name: uname,
              annotations: props.persistence.annotations
            },
            spec: props.volumeClaimTemplate
          })
        ] : undefined,
        template: {
          metadata: {
            name: uname,
            labels: {
              heritage: heritage,
              release: release,
              chart: chart,
              app: app,
              ...props.labels
            },
            annotations: {
              ...props.podAnnotations,
              /* This forces a restart if the configmap has changed */
              configchecksum: props.esConfig ? sha256Trunc63(props.esConfig) : undefined
            }
          },
          spec: {
            schedulerName: props.schedulerName,
            securityContext: {
              ...props.podSecurityContext
            },
            serviceAccountName: props.rbac?.create ? uname : (`"${props.rbac.serviceAccountName}"` || undefined),
            tolerations: props.tolerations,
            nodeSelector: props.nodeSelector,
            priorityClassName: affinity ? props.priorityClassName : undefined,
            affinity: affinity ? {
              podAntiAffinity: podAffinity,
              nodeAffinity: props.nodeAffinity
            } : undefined,
            terminationGracePeriodSeconds: props.terminationGracePeriodSeconds,
            volumes: (function (): k8s.Volume[] {
              
              const mounts: k8s.Volume[] = []

              for (let m in props.secretMounts) {
                mounts.push({
                  name: m.name,
                  secret: {
                    secretName: m.secretName
                  }
                })
              }

              if (props.esConfig) {
                mounts.push({
                  name: 'esconfig',
                  configMap: {
                    name: `${uname}-config`
                  }
                })
              }

              if (props.keystore) {
                mounts.push({
                  name: 'keystore',
                  emptyDir: {}
                })

                for (let k in props.keystore) {
                  mounts.push({
                    name: `keystore-${k.secretName}`,
                    secret: k.secret 
                  })
                }

              }
              
              mounts.push(...props.extraVolumes)

              return mounts;
            })(),
            imagePullSecrets: props.imagePullSecrets,
            initContainers: (function (): k8s.Container[] {
              
              const containers: k8s.Container[] = []

              if (props.sysctlInitContainer?.enabled) {
                containers.push({
                  name: 'configure-sysctl',
                  securityContext: {
                    runAsUser: 0,
                    privileged: true
                  },
                  image: `${props.image}:${props.imageTag}`,
                  imagePullPolicy: props.imagePullPolicy,
                  command: ['sysctl', '-w',`vm.max_map_count=${props.sysctlVmMaxMapCount}`],
                  resources: props.initResources
                })
              }

              if (props.keystore) {

                containers.push({
                  name: 'keystore',
                  image: `${props.image}:${props.imageTag}`,
                  imagePullPolicy: props.imagePullPolicy,
                  command: [
                    'sh',
                    '-c',
                    `
#!/usr/bin/env bash
set -euo pipefail
elasticsearch-keystore create
for i in /tmp/keystoreSecrets/*/*; do
  key=$(basename $i)
  echo "Adding file $i to keystore key $key"
  elasticsearch-keystore add-file "$key" "$i"
done
# Add the bootstrap password since otherwise the Elasticsearch entrypoint tries to do this on startup
if [ ! -z \${ELASTIC_PASSWORD+x} ]; then
  echo 'Adding env $ELASTIC_PASSWORD to keystore as key bootstrap.password'
  echo "$ELASTIC_PASSWORD" | elasticsearch-keystore add -x bootstrap.password
fi
cp -a /usr/share/elasticsearch/config/elasticsearch.keystore /tmp/keystore/
                    `
                  ],
                  env: props.extraEnvs,
                  resources: props.initResources,
                  volumeMounts: [
                    {
                      name: 'keystore',
                      mountPath: '/tmp/keystore'
                    },
                    ...props.keystore.map((k: any) => {
                      return {
                        name: `keystore-${k.secretName}`,
                        mountPath: `/tmp/keystoreSecrets/${k.secretName}`
                      } 
                    }),
                  ],
                },
                ...props.extraInitContainers
                )
              }
              return containers;

            })(),
            containers: (function (): k8s.Container[] {
              const containers: k8s.Container[] = [
                {
                  name: uname,
                  securityContext: props.securityContext,
                  image: `${props.image}:${props.imageTag}`,
                  imagePullPolicy: props.imagePullPolicy,
                  readinessProbe: {
                    exec: {
                      command: [
                        'sh',
                        '-c',
                        `
  #!/usr/bin/env bash -e
  # If the node is starting up wait for the cluster to be ready (request params: '{{ .Values.clusterHealthCheckParams }}' )
  # Once it has started only check that the node itself is responding
  START_FILE=/tmp/.es_start_file
  http () {
      local path="\${1}"
      if [ -n "\${ELASTIC_USERNAME}" ] && [ -n "\${ELASTIC_PASSWORD}" ]; then
        BASIC_AUTH="-u \${ELASTIC_USERNAME}:\${ELASTIC_PASSWORD}"
      else
        BASIC_AUTH=''
      fi
      curl -XGET -s -k --fail \${BASIC_AUTH} {{ .Values.protocol }}://127.0.0.1:{{ .Values.httpPort }}\${path}
  }
  if [ -f "\${START_FILE}" ]; then
      echo 'Elasticsearch is already running, lets check the node is healthy and there are master nodes available'
      http "/_cluster/health?timeout=0s"
  else
      echo 'Waiting for elasticsearch cluster to become ready (request params: "{{ .Values.clusterHealthCheckParams }}" )'
      if http "/_cluster/health?{{ .Values.clusterHealthCheckParams }}" ; then
          touch \${START_FILE}
          exit 0
      else
          echo 'Cluster is not yet ready (request params: "{{ .Values.clusterHealthCheckParams }}" )'
          exit 1
      fi
  fi
                        `
                      ]
                    },
                    ...props.readinessProbe
                  },
                  ports: [
                    {
                      name: 'http',
                      containerPort: props.httpPort
                    },
                    {
                      name: 'transport',
                      containerPort: props.transportPort
                    }
                  ],
                  resources: props.resources,
                  env: (function (): k8s.EnvVar[] {
  
                    const envs: k8s.EnvVar[] = [{name: 'node.name', valueFrom: {fieldRef: {fieldPath: 'metadata.name'}}}]
  
                    if (props.roles.master) {
                      if (majorVersion >= 7) {
                        envs.push({
                          name: 'cluster.initial_master_nodes',
                          value: elasticEndpoints
                        })
                      } else {
                        envs.push({
                          name: 'discovery.zen.minimum_master_nodes',
                          value: props.minimumMasterNodes
                        })
                      }
  
                      if (majorVersion < 7) {
                        envs.push({
                          name: 'discovery.zen.ping.unicast.hosts',
                          value: `${masterService}-headless`
                        })
                      } else {
                        envs.push({
                          name: 'discovery.seed_hosts',
                          value: `${masterService}-headless`
                        })
                      }
  
                      envs.push(
                        {
                          name: 'cluster.name',
                          value: props.clusterName
                        },
                        {
                          name: 'network.host',
                          value: props.networkHost
                        },
                        {
                          name: 'ES_JAVA_OPTS',
                          value: props.esJavaOps
                        }
                      )
                      
                      for (r in props.roles) {
                        envs.push({
                          name: r,
                          value: props.roles[r]
                        })
                      }
  
                      envs.push(...props.extraEnvs)
                    }
                  })(),
                  volumeMounts: (function (): k8s.VolumeMount[] {
  
                    const mounts: k8s.VolumeMount[] = []
  
                    if (props.persistence.enabled) {
                      mounts.push({
                        name: uname,
                        mountPath: '/usr/share/elasticsearch/data'
                      })
                    }
  
                    if (props.keystore) {
                      mounts.push({
                        name: 'keystore',
                        mountPath: '/usr/share/elasticsearch/config/elasticsearch.keystore',
                        subPath: 'elasticsearch.keystore'
                      })
                    }
  
                    for (let k in props.secretMounts) {
                      mounts.push({
                        name: k.name,
                        mountPath: k.path,
                        subPath: k.subPath
                      })
                    }
  
                    for (let k in props.esConfig) {
                      mounts.push({
                        name: 'esconfig',
                        mountPath: `/usr/share/elasticsearch/config/${k}`,
                        subPath: k
                      })
                    }
  
                    mounts.push(...props.extraVolumes)
  
                  })()
                }
              ]

              if (props.masterTerminationFix) {
                if (props.roles.master) {
                  containers.push({
                    name: 'elasticsearch-master-graceful-termination-handler',
                    image: `${props.image}:${props.imageTag}`,
                    imagePullPolicy: props.imagePullPolicy,  
                    command: [
                      'sh',
                      '-c',
                      `
#!/usr/bin/env bash
set -eo pipefail
http () {
    local path="${1}"
    if [ -n "\${ELASTIC_USERNAME}" ] && [ -n "\${ELASTIC_PASSWORD}" ]; then
      BASIC_AUTH="-u \${ELASTIC_USERNAME}:\${ELASTIC_PASSWORD}"
    else
      BASIC_AUTH=''
    fi
    curl -XGET -s -k --fail \${BASIC_AUTH} {{ .Values.protocol }}://{{ template "elasticsearch.masterService" . }}:{{ .Values.httpPort }}${path}
}
cleanup () {
  while true ; do
    local master="$(http "/_cat/master?h=node" || echo "")"
    if [[ $master == "{{ template "elasticsearch.masterService" . }}"* && $master != "\${NODE_NAME}" ]]; then
      echo "This node is not master."
      break
    fi
    echo "This node is still master, waiting gracefully for it to step down"
    sleep 1
  done
  exit 0
}
trap cleanup SIGTERM
sleep infinity &
wait $!                      
                      `
                    ],
                    resources: props.sideCarResources,
                    env: (function () {
                      const vars: k8s.EnvVar[] = [{
                        name: 'NODE_NAME',
                        valueFrom: {
                          fieldRef: {
                            fieldPath: 'metadata.name'
                          }
                        }
                      }]

                      vars.push(...props.extraEnvs)
                      return vars
                    })(),
                    lifecycle: props.lifecycle
                  })
                }
              }
              
              containers.push(...props.extraContainers)
              return containers
            })()
          }
        }
      }
    })

  }
}

