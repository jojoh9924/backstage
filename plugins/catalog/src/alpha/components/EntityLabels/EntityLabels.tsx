/*
 * Copyright 2025 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { useSyncExternalStore } from 'react';
import { HeaderLabel } from '@backstage/core-components';
import {
  Entity,
  RELATION_OWNED_BY,
  RELATION_PART_OF,
} from '@backstage/catalog-model';
import {
  EntityRefLinks,
  getEntityRelations,
  getFreshnessFraction,
  freshnessSubscribe,
  freshnessGetSnapshot,
} from '@backstage/plugin-catalog-react';
import { useTranslationRef } from '@backstage/core-plugin-api/alpha';
import { catalogTranslationRef } from '../../translation';
import {
  TECHDOCS_ANNOTATION,
  TECHDOCS_EXTERNAL_ANNOTATION,
} from '@backstage/plugin-techdocs-common';

const LAST_UPDATED_MAP: Record<string, string> = {
  'wayback-search': '3 months ago',
  'artist-lookup': '2 days ago',
  petstore: '14 days ago',
  'playback-order': '5 days ago',
  'playback-lib': '21 days ago',
  'podcast-api': '8 days ago',
  'queue-proxy': '1 day ago',
  searcher: '11 days ago',
  'shuffle-api': '30 days ago',
  'www-artist': '4 days ago',
  'wayback-archive': '6 days ago',
  'wayback-archive-ingestion': '17 days ago',
  'wayback-archive-storage': '9 days ago',
};

function isDataFresh(entityName: string): boolean {
  const text =
    LAST_UPDATED_MAP[entityName] ||
    `${Math.floor(
      Math.abs((entityName.charCodeAt(0) * 7 + entityName.length * 13) % 28) +
        1,
    )} days ago`;
  const monthMatch = text.match(/(\d+)\s*months?\s*ago/);
  if (monthMatch) return parseInt(monthMatch[1], 10) < 3;
  const yearMatch = text.match(/(\d+)\s*years?\s*ago/);
  if (yearMatch) return false;
  return true;
}

function computeReadinessScore(
  entity: Entity,
  freshnessFraction: number,
): number {
  let raw = 0;

  const owners = getEntityRelations(entity, RELATION_OWNED_BY);
  if (owners.length > 0) raw += 1.5;
  if (entity.metadata?.description) raw += 1.5;
  if (entity.spec?.lifecycle) raw += 1;
  const systems = getEntityRelations(entity, RELATION_PART_OF, {
    kind: 'system',
  });
  if (systems.length > 0) raw += 1.5;
  if ((entity.metadata?.tags ?? []).length > 0) raw += 0.5;

  const sourceLocation =
    entity.metadata?.annotations?.['backstage.io/source-location'];
  if (sourceLocation && sourceLocation.startsWith('url:')) raw += 1.5;

  const hasTechdocs = !!(
    entity.metadata?.annotations?.[TECHDOCS_ANNOTATION] ||
    entity.metadata?.annotations?.[TECHDOCS_EXTERNAL_ANNOTATION]
  );
  if (hasTechdocs) raw += 1;

  if (isDataFresh(entity.metadata.name)) {
    raw += 1.5;
  } else {
    raw += 1.5 * freshnessFraction;
  }

  return Math.round(raw * 10) / 10;
}

function scoreColor(score: number): string {
  if (score >= 7) return '#2e7d32';
  if (score >= 4) return '#e5a000';
  return '#c62828';
}

type EntityLabelsProps = {
  entity: Entity;
};

export function EntityLabels(props: EntityLabelsProps) {
  const { entity } = props;
  const ownedByRelations = getEntityRelations(entity, RELATION_OWNED_BY);
  const { t } = useTranslationRef(catalogTranslationRef);

  useSyncExternalStore(freshnessSubscribe, freshnessGetSnapshot);
  const fraction = getFreshnessFraction(entity.metadata.name);
  const score = computeReadinessScore(entity, fraction);
  const color = scoreColor(score);

  return (
    <>
      <div
        title={`Readiness Score: ${score} / 10`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: `3px solid ${color}`,
          backgroundColor: 'rgba(0,0,0,0.04)',
          color: '#000',
          fontSize: '0.8rem',
          fontWeight: 700,
          marginRight: 8,
          flexShrink: 0,
        }}
      >
        {score.toFixed(1)}
      </div>
      {ownedByRelations.length > 0 && (
        <HeaderLabel
          label={t('entityLabels.ownerLabel')}
          contentTypograpyRootComponent="p"
          value={
            <EntityRefLinks
              entityRefs={ownedByRelations}
              defaultKind="Group"
              color="inherit"
            />
          }
        />
      )}
      {entity.spec?.lifecycle && (
        <HeaderLabel
          label={t('entityLabels.lifecycleLabel')}
          value={entity.spec.lifecycle?.toString()}
        />
      )}
    </>
  );
}
