import { Construct } from 'constructs';
import * as k8s from '../../imports/k8s';

export interface IngressProps {
  
  readonly tls?: boolean

}

export class Ingress extends Construct {
  constructor(scope: Construct, id: string, props: IngressProps) {
    super(scope, id);
  
    

    const ingress = new k8s.Ingress(this, 'Ingress', {
      spec: {
        tls: tls
      }
    })
  }
}