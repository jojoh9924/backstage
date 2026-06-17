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

import DocsIcon from '@material-ui/icons/Description';
import WarningIcon from '@material-ui/icons/Warning';

import { useRouteRef } from '@backstage/core-plugin-api';
import { useTranslationRef } from '@backstage/core-plugin-api/alpha';

import {
  TECHDOCS_ANNOTATION,
  TECHDOCS_EXTERNAL_ANNOTATION,
} from '@backstage/plugin-techdocs-common';
import { buildTechDocsURL } from '@backstage/plugin-techdocs-react';

import { RELATION_OWNED_BY } from '@backstage/catalog-model';
import { useEntity, getEntityRelations } from '@backstage/plugin-catalog-react';

import { techdocsTranslationRef } from '../../translation';
import { rootDocsRouteRef } from '../../routes';

// Note: If you update this hook, please also update the "useTechdocsReaderIconLinkProps" hook
// in the "plugins/catalog/src/components/AboutCard/AboutCard.tsx" file
/** @alpha */
export function useTechdocsReaderIconLinkProps() {
  const { entity } = useEntity();
  const viewTechdocLink = useRouteRef(rootDocsRouteRef);
  const { t } = useTranslationRef(techdocsTranslationRef);

  const hasTechdocs = !!(
    entity.metadata.annotations?.[TECHDOCS_ANNOTATION] ||
    entity.metadata.annotations?.[TECHDOCS_EXTERNAL_ANNOTATION]
  );
  const owners = getEntityRelations(entity, RELATION_OWNED_BY);
  const isTeamA = owners.some(ref => ref.name === 'team-a');
  const showAlert = !hasTechdocs && isTeamA;

  const icon = showAlert ? (
    <span
      style={{
        position: 'relative',
        display: 'inline-flex',
        overflow: 'visible',
      }}
    >
      <DocsIcon />
      <WarningIcon
        style={{
          position: 'absolute',
          top: -4,
          right: -10,
          fontSize: '0.9rem',
          color: '#e5a000',
          filter: 'drop-shadow(0 0 1px #fff)',
        }}
      />
    </span>
  ) : (
    <DocsIcon />
  );

  return {
    label: t('aboutCard.viewTechdocs'),
    disabled: !hasTechdocs || !viewTechdocLink,
    icon,
    href: buildTechDocsURL(entity, viewTechdocLink),
  };
}
