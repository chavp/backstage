
import React, { useMemo } from 'react';
import { useEntity } from '@backstage/plugin-catalog-react';
import {
  InfoCard,
  Table,
  Link,
  MissingAnnotationEmptyState,
} from '@backstage/core-components';
import { Chip, Grid } from '@material-ui/core';

// ------- ตั้งค่าคีย์พื้นฐานต่อ environment --------
type EnvKeys = {
  host?: string;
  ip?: string;
  endpoint?: string;
  namespace?: string;
  cluster?: string;
};

type EnvironmentOverviewCardProps = {
  // รายชื่อ env ที่อยากแสดง (เรียงลำดับในตาราง)
  envs?: string[];
  // กรณีอยากบังคับให้ env ต้องมี ถ้าไม่มีจะขึ้น MissingAnnotationEmptyState
  requiredEnvs?: string[];
  // เปลี่ยน prefix/รูปแบบคีย์ได้ ด้วยฟังก์ชัน mapping
  // default mapping: `${env}/host`, `${env}/ip`, `${env}/endpoint`, `${env}/k8s-namespace`, `${env}/k8s-cluster`
  mapEnvToKeys?: (env: string) => EnvKeys;
  title?: string;
};

const defaultMapEnvToKeys = (env: string): EnvKeys => ({
  host: `${env}/host`,
  ip: `${env}/ip`,
  endpoint: `${env}/endpoint`,
  namespace: `${env}/k8s-namespace`,
  cluster: `${env}/k8s-cluster`,
});

const statusColor = (value?: string) => {
  if (!value || value.trim() === '') return 'default';
  return 'primary';
};

export const EnvironmentOverviewCard = ({
  envs = ['dev', 'staging', 'prod'],
  requiredEnvs = [],
  mapEnvToKeys = defaultMapEnvToKeys,
  title = 'Deploy Environments',
}: EnvironmentOverviewCardProps) => {
  const { entity } = useEntity();
  const ann = entity?.metadata?.annotations ?? {};

  const rows = useMemo(() => {
    return envs.map(env => {
      const keys = mapEnvToKeys(env);
      const host = keys.host ? ann[keys.host] : undefined;
      const ip = keys.ip ? ann[keys.ip] : undefined;
      const endpoint = keys.endpoint ? ann[keys.endpoint] : undefined;
      const namespace = keys.namespace ? ann[keys.namespace] : undefined;
      const cluster = keys.cluster ? ann[keys.cluster] : undefined;

      return {
        env,
        host,
        ip,
        endpoint,
        namespace,
        cluster,
        status: host || endpoint ? 'active' : 'missing',
      };
    });
  }, [ann, envs, mapEnvToKeys]);

  // ตรวจว่ามี required env ครบหรือไม่
  const missingRequired = useMemo(() => {
    return requiredEnvs.filter(env => {
      const keys = mapEnvToKeys(env);
      const host = keys.host ? ann[keys.host] : undefined;
      const endpoint = keys.endpoint ? ann[keys.endpoint] : undefined;
      return !(host || endpoint);
    });
  }, [ann, requiredEnvs, mapEnvToKeys]);

  if (missingRequired.length > 0) {
    // แสดง empty state พร้อมบอกว่าคีย์ไหนที่ควรเติม
    const missingList = missingRequired
      .map(env => {
        const k = mapEnvToKeys(env);
        return [
          k.host && `${k.host}`,
          k.endpoint && `${k.endpoint}`,
        ]
          .filter(Boolean)
          .join(' หรือ ');
      })
      .join(', ');
    return (
      <MissingAnnotationEmptyState annotation={missingList} />
    );
  }

  const columns = [
    { title: 'Environment', field: 'env' },
    {
      title: 'Host',
      field: 'host',
      render: (rowData: any) => (
        <Grid container alignItems="center" spacing={1}>
          <Grid item>
            <Chip
              label={rowData.host || '—'}
              color={statusColor(rowData.host)}
              size="small"
            />
          </Grid>
        </Grid>
      ),
    },
    {
      title: 'IP',
      field: 'ip',
      render: (rowData: any) => (
        <Chip
          label={rowData.ip || '—'}
          color={statusColor(rowData.ip)}
          size="small"
        />
      ),
    },
    {
      title: 'Endpoint',
      field: 'endpoint',
      render: (rowData: any) =>
        rowData.endpoint ? (
          <Link to={rowData.endpoint} target="_blank" rel="noopener">
            {rowData.endpoint}
          </Link>
        ) : (
          '—'
        ),
    },
    {
      title: 'Namespace',
      field: 'namespace',
      render: (rowData: any) => (
        <Chip
          label={rowData.namespace || '—'}
          color={statusColor(rowData.namespace)}
          size="small"
        />
      ),
    },
    {
      title: 'Cluster',
      field: 'cluster',
      render: (rowData: any) => (
        <Chip
          label={rowData.cluster || '—'}
          color={statusColor(rowData.cluster)}
          size="small"
        />
      ),
    },
    {
      title: 'Status',
      field: 'status',
      render: (rowData: any) => (
        <Chip
          label={rowData.status === 'active' ? 'Active' : 'Missing'}
          color={rowData.status === 'active' ? 'primary' : 'default'}
          size="small"
        />
      ),
    },
  ];

  // กรองแถวที่ไม่มีข้อมูลเลย (ทั้ง host และ endpoint ว่าง) ให้หลุดไป
  const data = rows.filter(r => r.host || r.endpoint || r.ip || r.namespace || r.cluster);

  return (
    <InfoCard title={title}>
      <Table
        options={{
          paging: false,
          search: false,
          padding: 'dense',
        }}
        columns={columns as any}
        data={data}
      />
    </InfoCard>
  );
};