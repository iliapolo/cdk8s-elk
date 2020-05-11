#!/usr/bin/env bash
set -euo pipefail

elasticsearch-keystore create

for i in /tmp/keystoreSecrets/*/*; do
  key=$(basename $i)
  echo "Adding file $i to keystore key $key"
  elasticsearch-keystore add-file "$key" "$i"
done

# Add the bootstrap password since otherwise the Elasticsearch entrypoint 
# tries to do this on startup
if [ ! -z ${ELASTIC_PASSWORD+x} ]; then
  echo 'Adding env $ELASTIC_PASSWORD to keystore as key bootstrap.password'
  echo "$ELASTIC_PASSWORD" | elasticsearch-keystore add -x bootstrap.password
fi

cp -a /usr/share/elasticsearch/config/elasticsearch.keystore /tmp/keystore/
