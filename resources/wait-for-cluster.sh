 #!/usr/bin/env bash -e
  # If the node is starting up wait for the cluster to be ready (request params: '{{ .Values.clusterHealthCheckParams }}' )
  # Once it has started only check that the node itself is responding
  START_FILE=/tmp/.es_start_file
  http () {
      local path="${1}"
      if [ -n "${ELASTIC_USERNAME}" ] && [ -n "${ELASTIC_PASSWORD}" ]; then
        BASIC_AUTH="-u ${ELASTIC_USERNAME}:${ELASTIC_PASSWORD}"
      else
        BASIC_AUTH=''
      fi
      curl -XGET -s -k --fail \${BASIC_AUTH} {{ .Values.protocol }}://127.0.0.1:{{ .Values.httpPort }}\${path}
  }
  if [ -f "${START_FILE}" ]; then
      echo 'Elasticsearch is already running, lets check the node is healthy and there are master nodes available'
      http "/_cluster/health?timeout=0s"
  else
      echo 'Waiting for elasticsearch cluster to become ready (request params: "{{ .Values.clusterHealthCheckParams }}" )'
      if http "/_cluster/health?{{ .Values.clusterHealthCheckParams }}" ; then
          touch ${START_FILE}
          exit 0
      else
          echo 'Cluster is not yet ready (request params: "{{ .Values.clusterHealthCheckParams }}" )'
          exit 1
      fi
  fi
