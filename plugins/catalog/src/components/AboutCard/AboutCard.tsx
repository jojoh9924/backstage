/*
 * Copyright 2020 The Backstage Authors
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

import { useCallback } from 'react';

import IconButton from '@material-ui/core/IconButton';
import CachedIcon from '@material-ui/icons/Cached';
import EditIcon from '@material-ui/icons/Edit';
import DocsIcon from '@material-ui/icons/Description';
import WarningIcon from '@material-ui/icons/Warning';
import CreateComponentIcon from '@material-ui/icons/AddCircleOutline';

import {
  AppIcon,
  HeaderIconLinkRow,
  IconLinkVerticalProps,
  Link,
} from '@backstage/core-components';
import { EntityInfoCard } from '@backstage/plugin-catalog-react';
import {
  alertApiRef,
  errorApiRef,
  useApp,
  useApi,
  useRouteRef,
} from '@backstage/core-plugin-api';
import { useTranslationRef } from '@backstage/core-plugin-api/alpha';

import {
  ScmIntegrationIcon,
  scmIntegrationsApiRef,
} from '@backstage/integration-react';

import {
  DEFAULT_NAMESPACE,
  ANNOTATION_EDIT_URL,
  ANNOTATION_LOCATION,
  RELATION_OWNED_BY,
  stringifyEntityRef,
} from '@backstage/catalog-model';
import {
  catalogApiRef,
  getEntitySourceLocation,
  getEntityRelations,
  useEntity,
} from '@backstage/plugin-catalog-react';
import { useEntityPermission } from '@backstage/plugin-catalog-react/alpha';
import { catalogEntityRefreshPermission } from '@backstage/plugin-catalog-common/alpha';

import {
  TECHDOCS_ANNOTATION,
  TECHDOCS_EXTERNAL_ANNOTATION,
} from '@backstage/plugin-techdocs-common';
import { buildTechDocsURL } from '@backstage/plugin-techdocs-react';

import { isTemplateEntityV1beta3 } from '@backstage/plugin-scaffolder-common';
import { taskCreatePermission } from '@backstage/plugin-scaffolder-common/alpha';

import { usePermission } from '@backstage/plugin-permission-react';

import { createFromTemplateRouteRef, viewTechDocRouteRef } from '../../routes';
import { catalogTranslationRef } from '../../alpha/translation';
import { useSourceTemplateCompoundEntityRef } from './hooks';
import { AboutContent } from './AboutContent';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
  linkContainer: {
    border: '1px solid var(--bui-border-1)',
    borderLeft: 'none',
    borderRight: 'none',
    marginBottom: 'var(--bui-space-6)',
  },
  connectSourceWrapper: {
    display: 'flex',
    justifyContent: 'left',
    paddingBottom: theme.spacing(1.5),
  },
  connectSourceBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px 5px',
    fontSize: '0.4rem',
    fontWeight: theme.typography.fontWeightBold,
    textTransform: 'none',
    letterSpacing: 0.1,
    color: theme.palette.primary.main,
    background: 'none',
    border: `1px solid ${theme.palette.primary.main}`,
    borderRadius: 12,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    textDecoration: 'none',
    '&:hover': {
      backgroundColor: 'rgba(21, 101, 192, 0.06)',
      textDecoration: 'none',
    },
  },
}));

export function useCatalogSourceIconLinkProps() {
  const { entity } = useEntity();
  const scmIntegrationsApi = useApi(scmIntegrationsApiRef);
  const { t } = useTranslationRef(catalogTranslationRef);
  const entitySourceLocation = getEntitySourceLocation(
    entity,
    scmIntegrationsApi,
  );
  return {
    label: t('aboutCard.viewSource'),
    disabled: !entitySourceLocation,
    icon: <ScmIntegrationIcon type={entitySourceLocation?.integrationType} />,
    href: entitySourceLocation?.locationTargetUrl,
  };
}

// TODO: This hook is duplicated from the TechDocs plugin for backwards compatibility
// Remove it when the the legacy frontend system support is dropped.
function useTechdocsReaderIconLinkProps(): IconLinkVerticalProps {
  const { entity } = useEntity();
  const viewTechdocLink = useRouteRef(viewTechDocRouteRef);
  const { t } = useTranslationRef(catalogTranslationRef);

  const hasTechdocs = !!(
    entity.metadata.annotations?.[TECHDOCS_ANNOTATION] ||
    entity.metadata.annotations?.[TECHDOCS_EXTERNAL_ANNOTATION]
  );
  const owners = getEntityRelations(entity, RELATION_OWNED_BY);
  const isTargetOwner = owners.some(ref => ref.name === 'guest');
  const showAlert = !hasTechdocs && isTargetOwner;

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

// TODO: This hook is duplicated from the Scaffolder plugin for backwards compatibility
// Remove it when the the legacy frontend system support is dropped.
function useScaffolderTemplateIconLinkProps(): IconLinkVerticalProps {
  const app = useApp();
  const { entity } = useEntity();
  const templateRoute = useRouteRef(createFromTemplateRouteRef);
  const { t } = useTranslationRef(catalogTranslationRef);
  const Icon = app.getSystemIcon('scaffolder') ?? CreateComponentIcon;
  const { allowed: canCreateTemplateTask } = usePermission({
    permission: taskCreatePermission,
  });

  return {
    label: t('aboutCard.launchTemplate'),
    icon: <Icon />,
    disabled: !templateRoute || !canCreateTemplateTask,
    href:
      templateRoute &&
      templateRoute({
        templateName: entity.metadata.name,
        namespace: entity.metadata.namespace || DEFAULT_NAMESPACE,
      }),
  };
}

function DefaultAboutCardSubheader() {
  const { entity } = useEntity();
  const catalogSourceIconLink = useCatalogSourceIconLinkProps();
  const techdocsreaderIconLink = useTechdocsReaderIconLinkProps();
  const scaffolderTemplateIconLink = useScaffolderTemplateIconLinkProps();

  const links = [catalogSourceIconLink, techdocsreaderIconLink];
  if (isTemplateEntityV1beta3(entity)) {
    links.push(scaffolderTemplateIconLink);
  }

  return <HeaderIconLinkRow links={links} />;
}

export interface InternalAboutCardProps {
  /** Icon link row rendered at the top of the card body. */
  iconLinks?: JSX.Element;
}

export function InternalAboutCard(props: InternalAboutCardProps) {
  const { iconLinks } = props;
  const classes = useStyles();
  const { entity } = useEntity();
  const catalogApi = useApi(catalogApiRef);
  const alertApi = useApi(alertApiRef);
  const errorApi = useApi(errorApiRef);
  const scmIntegrationsApi = useApi(scmIntegrationsApiRef);
  const templateRoute = useRouteRef(createFromTemplateRouteRef);
  const sourceTemplateRef = useSourceTemplateCompoundEntityRef(entity);
  const { allowed: canRefresh } = useEntityPermission(
    catalogEntityRefreshPermission,
  );
  const { t } = useTranslationRef(catalogTranslationRef);

  const entitySourceLocation = getEntitySourceLocation(
    entity,
    scmIntegrationsApi,
  );
  const sourceEmpty = !entitySourceLocation;
  const owners = getEntityRelations(entity, RELATION_OWNED_BY);
  const isTargetOwner = owners.some(ref => ref.name === 'guest');

  const entityMetadataEditUrl =
    entity.metadata.annotations?.[ANNOTATION_EDIT_URL];

  const entityLocation = entity.metadata.annotations?.[ANNOTATION_LOCATION];
  // Limiting the ability to manually refresh to the less expensive locations
  const allowRefresh =
    entityLocation?.startsWith('url:') || entityLocation?.startsWith('file:');
  const refreshEntity = useCallback(async () => {
    try {
      await catalogApi.refreshEntity(stringifyEntityRef(entity));
      alertApi.post({
        message: t('aboutCard.refreshScheduledMessage'),
        severity: 'info',
        display: 'transient',
      });
    } catch (e) {
      errorApi.post(e);
    }
  }, [catalogApi, entity, alertApi, t, errorApi]);

  const handleUpdate = useCallback(() => {
    if (entityMetadataEditUrl) {
      window.open(entityMetadataEditUrl, '_blank');
    }
  }, [entityMetadataEditUrl]);

  return (
    <EntityInfoCard
      title={t('aboutCard.title')}
      cardId="about"
      onUpdate={handleUpdate}
      headerActions={
        <>
          {allowRefresh && canRefresh && (
            <IconButton
              aria-label={t('aboutCard.refreshButtonAriaLabel')}
              title={t('aboutCard.refreshButtonTitle')}
              onClick={refreshEntity}
            >
              <CachedIcon />
            </IconButton>
          )}
          <IconButton
            component={Link}
            aria-label={t('aboutCard.editButtonAriaLabel')}
            disabled={!entityMetadataEditUrl}
            title={t('aboutCard.editButtonTitle')}
            to={entityMetadataEditUrl ?? '#'}
          >
            <EditIcon />
          </IconButton>
          {sourceTemplateRef && templateRoute && (
            <IconButton
              component={Link}
              title={t('aboutCard.createSimilarButtonTitle')}
              to={templateRoute({
                namespace: sourceTemplateRef.namespace,
                templateName: sourceTemplateRef.name,
              })}
            >
              <AppIcon id="scaffolder" />
            </IconButton>
          )}
        </>
      }
    >
      <div className={classes.linkContainer}>
        {iconLinks ?? <DefaultAboutCardSubheader />}
        {sourceEmpty && isTargetOwner && entityMetadataEditUrl && (
          <div className={classes.connectSourceWrapper}>
            <a
              href={entityMetadataEditUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={classes.connectSourceBtn}
            >
              Connect source
            </a>
          </div>
        )}
      </div>
      <AboutContent entity={entity} editUrl={entityMetadataEditUrl} />
    </EntityInfoCard>
  );
}

/**
 * Exported publicly via the EntityAboutCard
 *
 * NOTE: We generally do not accept pull requests to extend this class with props
 * and customizability. If you need to tweak it, consider making a bespoke card
 * in your own repository instead, that is perfect for your own needs.
 */
export function AboutCard() {
  return <InternalAboutCard />;
}
