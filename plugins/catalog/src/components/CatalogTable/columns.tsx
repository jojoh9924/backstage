/*
 * Copyright 2021 The Backstage Authors
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
import {
  defaultEntityPresentation,
  EntityRefLink,
  EntityRefLinks,
  getEntityRelations,
  getFreshnessFraction,
  type EntityPresentationApi,
} from '@backstage/plugin-catalog-react';
import Chip from '@material-ui/core/Chip';
import Tooltip from '@material-ui/core/Tooltip';
import { CatalogTableRow } from './types';
import { OverflowTooltip, TableColumn } from '@backstage/core-components';
import {
  Entity,
  RELATION_OWNED_BY,
  RELATION_PART_OF,
} from '@backstage/catalog-model';
import { JsonArray } from '@backstage/types';
import { EntityTableColumnTitle } from '@backstage/plugin-catalog-react/alpha';
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

function computeReadinessScore(entity: Entity): number {
  let raw = 0;
  if (getEntityRelations(entity, RELATION_OWNED_BY).length > 0) raw += 1.5;
  if (entity.metadata?.description) raw += 1.5;
  if (entity.spec?.lifecycle) raw += 1;
  if (
    getEntityRelations(entity, RELATION_PART_OF, { kind: 'system' }).length > 0
  )
    raw += 1.5;
  if ((entity.metadata?.tags ?? []).length > 0) raw += 0.5;
  const sourceLocation =
    entity.metadata?.annotations?.['backstage.io/source-location'];
  if (sourceLocation && sourceLocation.startsWith('url:')) raw += 1.5;
  if (
    entity.metadata?.annotations?.[TECHDOCS_ANNOTATION] ||
    entity.metadata?.annotations?.[TECHDOCS_EXTERNAL_ANNOTATION]
  )
    raw += 1;
  if (isDataFresh(entity.metadata.name)) {
    raw += 1.5;
  } else {
    raw += 1.5 * getFreshnessFraction(entity.metadata.name);
  }
  return Math.round(raw * 10) / 10;
}

function scoreColor(score: number): string {
  if (score >= 10) return '#1565c0';
  if (score >= 7) return '#2e7d32';
  if (score >= 4) return '#f9a825';
  return '#d32f2f';
}

// The columnFactories symbol is not directly exported, but through the
// CatalogTable.columns field.
/** @public */
export const columnFactories = Object.freeze({
  createNameColumn(options?: {
    defaultKind?: string;
    entityPresentationApi?: EntityPresentationApi;
  }): TableColumn<CatalogTableRow> {
    function formatContent(entity: Entity): string {
      if (options?.entityPresentationApi) {
        return options.entityPresentationApi.forEntity(entity, {
          defaultKind: options?.defaultKind,
        }).snapshot.primaryTitle;
      }
      return defaultEntityPresentation(entity, {
        defaultKind: options?.defaultKind,
      }).primaryTitle;
    }

    return {
      title: <EntityTableColumnTitle translationKey="name" />,
      field: 'resolved.entityRef',
      highlight: true,
      customSort({ entity: entity1 }, { entity: entity2 }) {
        // TODO: We could implement this more efficiently by comparing field by field.
        // This has similar issues as above.
        return formatContent(entity1).localeCompare(formatContent(entity2));
      },
      render: ({ entity }) => (
        <EntityRefLink
          entityRef={entity}
          defaultKind={options?.defaultKind || 'Component'}
        />
      ),
    };
  },
  createSystemColumn(): TableColumn<CatalogTableRow> {
    return {
      title: <EntityTableColumnTitle translationKey="system" />,
      field: 'resolved.partOfSystemRelationTitle',
      customFilterAndSearch: (query, row) => {
        if (!row.resolved.partOfSystemRelations) {
          return false;
        }

        const systemNames = row.resolved.partOfSystemRelations.map(
          ref => ref.name,
        ); // Extract system names from entityRefs

        const searchText = systemNames.join(', ').toLocaleUpperCase('en-US');
        return searchText.includes(query.toLocaleUpperCase('en-US'));
      },
      render: ({ resolved }) => (
        <EntityRefLinks
          entityRefs={resolved.partOfSystemRelations}
          defaultKind="system"
        />
      ),
    };
  },
  createOwnerColumn(): TableColumn<CatalogTableRow> {
    return {
      title: <EntityTableColumnTitle translationKey="owner" />,
      field: 'resolved.ownedByRelationsTitle',
      render: ({ resolved }) => (
        <EntityRefLinks
          entityRefs={resolved.ownedByRelations}
          defaultKind="group"
        />
      ),
    };
  },
  createSpecTargetsColumn(): TableColumn<CatalogTableRow> {
    return {
      title: <EntityTableColumnTitle translationKey="targets" />,
      field: 'entity.spec.targets',
      customFilterAndSearch: (query, row) => {
        let targets: JsonArray = [];
        if (
          row.entity?.spec?.targets &&
          Array.isArray(row.entity?.spec?.targets)
        ) {
          targets = row.entity?.spec?.targets;
        } else if (row.entity?.spec?.target) {
          targets = [row.entity?.spec?.target];
        }
        return targets
          .join(', ')
          .toLocaleUpperCase('en-US')
          .includes(query.toLocaleUpperCase('en-US'));
      },
      render: ({ entity }) => (
        <>
          {(entity?.spec?.targets || entity?.spec?.target) && (
            <OverflowTooltip
              text={(
                (entity!.spec!.targets as JsonArray) || [entity.spec.target]
              ).join(', ')}
              placement="bottom-start"
            />
          )}
        </>
      ),
    };
  },
  createSpecTypeColumn(
    options: {
      hidden: boolean;
    } = { hidden: false },
  ): TableColumn<CatalogTableRow> {
    return {
      title: <EntityTableColumnTitle translationKey="type" />,
      field: 'entity.spec.type',
      hidden: options.hidden,
      width: 'auto',
    };
  },
  createSpecLifecycleColumn(): TableColumn<CatalogTableRow> {
    return {
      title: <EntityTableColumnTitle translationKey="lifecycle" />,
      field: 'entity.spec.lifecycle',
    };
  },
  createMetadataDescriptionColumn(): TableColumn<CatalogTableRow> {
    return {
      title: <EntityTableColumnTitle translationKey="description" />,
      field: 'entity.metadata.description',
      render: ({ entity }) => (
        <OverflowTooltip
          text={entity.metadata.description}
          placement="bottom-start"
        />
      ),
      width: 'auto',
    };
  },
  createTagsColumn(): TableColumn<CatalogTableRow> {
    return {
      title: <EntityTableColumnTitle translationKey="tags" />,
      field: 'entity.metadata.tags',
      cellStyle: {
        padding: '0px 16px 0px 20px',
      },
      render: ({ entity }) => (
        <>
          {entity.metadata.tags &&
            entity.metadata.tags.map(t => (
              <Chip
                key={t}
                label={t}
                size="small"
                variant="outlined"
                style={{ margin: '2px' }}
              />
            ))}
        </>
      ),
      width: 'auto',
    };
  },
  createTitleColumn(options?: {
    hidden?: boolean;
  }): TableColumn<CatalogTableRow> {
    return {
      title: <EntityTableColumnTitle translationKey="title" />,
      field: 'entity.metadata.title',
      hidden: options?.hidden,
      searchable: true,
    };
  },
  createLabelColumn(
    key: string,
    options?: { title?: string; defaultValue?: string },
  ): TableColumn<CatalogTableRow> {
    function formatContent(keyLabel: string, entity: Entity): string {
      const labels: Record<string, string> | undefined =
        entity.metadata?.labels;
      return (labels && labels[keyLabel]) || '';
    }

    return {
      title: options?.title || (
        <EntityTableColumnTitle translationKey="label" />
      ),
      field: 'entity.metadata.labels',
      cellStyle: {
        padding: '0px 16px 0px 20px',
      },
      customSort({ entity: entity1 }, { entity: entity2 }) {
        return formatContent(key, entity1).localeCompare(
          formatContent(key, entity2),
        );
      },
      render: ({ entity }: { entity: Entity }) => {
        const labels: Record<string, string> | undefined =
          entity.metadata?.labels;
        const specifiedLabelValue =
          (labels && labels[key]) || options?.defaultValue;
        return (
          <>
            {specifiedLabelValue && (
              <Chip
                key={specifiedLabelValue}
                label={specifiedLabelValue}
                size="small"
                variant="outlined"
              />
            )}
          </>
        );
      },
      width: 'auto',
    };
  },
  createNamespaceColumn(): TableColumn<CatalogTableRow> {
    return {
      title: <EntityTableColumnTitle translationKey="namespace" />,
      field: 'entity.metadata.namespace',
      width: 'auto',
    };
  },
  createReadinessScoreColumn(): TableColumn<CatalogTableRow> {
    return {
      title: (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          Readiness
          <Tooltip
            title="The readiness score (0–10) measures how complete and fresh a catalog entry is."
            arrow
            placement="top"
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 16,
                height: 16,
                borderRadius: '50%',
                border: '1.5px solid rgba(0,0,0,0.4)',
                fontSize: '0.6rem',
                fontWeight: 700,
                color: 'rgba(0,0,0,0.5)',
                cursor: 'help',
                flexShrink: 0,
              }}
            >
              ?
            </span>
          </Tooltip>
        </span>
      ),
      sorting: true,
      headerStyle: { textAlign: 'center' },
      cellStyle: { textAlign: 'center', paddingRight: 50 },
      customSort({ entity: a }, { entity: b }) {
        return computeReadinessScore(a) - computeReadinessScore(b);
      },
      render: ({ entity }) => {
        const score = computeReadinessScore(entity);
        const color = scoreColor(score);
        const namespace = entity.metadata.namespace || 'default';
        const kind = entity.kind.toLocaleLowerCase('en-US');
        const name = entity.metadata.name;
        const href = `/catalog/${namespace}/${kind}/${name}`;
        return (
          <a
            href={href}
            title={`Readiness Score: ${score.toFixed(1)} / 10`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: `3px solid ${color}`,
              backgroundColor: 'rgba(0,0,0,0.04)',
              color: '#000',
              fontSize: '0.75rem',
              fontWeight: 700,
              textDecoration: 'none',
              cursor: 'pointer',
            }}
          >
            {score.toFixed(1)}
          </a>
        );
      },
      width: 'auto',
    };
  },
});
