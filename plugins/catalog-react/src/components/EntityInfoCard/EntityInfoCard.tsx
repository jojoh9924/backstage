/*
 * Copyright 2026 The Backstage Authors
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

import { ReactNode, useState } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Text,
  Flex,
} from '@backstage/ui';
import { makeStyles } from '@material-ui/core/styles';
import classNames from 'classnames';
import WarningIcon from '@material-ui/icons/Warning';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import { RELATION_OWNED_BY } from '@backstage/catalog-model';
import { useEntity } from '../../hooks/useEntity';
import { getEntityRelations } from '../../utils/getEntityRelations';

const PROMPT_BANNER_OWNERS = new Set(['team-a']);

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

function getLastUpdatedText(entityName: string): string {
  return (
    LAST_UPDATED_MAP[entityName] ||
    `${Math.floor(
      Math.abs((entityName.charCodeAt(0) * 7 + entityName.length * 13) % 28) +
        1,
    )} days ago`
  );
}

function isStale(updatedText: string): boolean {
  const monthMatch = updatedText.match(/(\d+)\s*months?\s*ago/);
  if (monthMatch) return parseInt(monthMatch[1], 10) >= 3;
  const yearMatch = updatedText.match(/(\d+)\s*years?\s*ago/);
  if (yearMatch) return true;
  return false;
}

const useStyles = makeStyles({
  root: {
    height: '100%',
  },
  title: {
    minWidth: 0,
    overflow: 'hidden',
  },
  lastUpdated: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: '0.75rem',
    color: 'var(--bui-color-text-subtle, #6b6b6b)',
    fontWeight: 400,
    marginTop: 2,
  },
  statusIconStale: {
    fontSize: '0.875rem',
    color: '#e5a000',
  },
  statusIconFresh: {
    fontSize: '0.875rem',
    color: '#2e7d32',
  },
  wrapper: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  stalePrompt: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 12px',
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: 'var(--bui-color-surface-2, #f5f5f5)',
    border: '3px solid #fff',
    fontSize: '0.8125rem',
    color: 'var(--bui-color-text-subtle, #6b6b6b)',
  },
  stalePromptIcon: {
    fontSize: '1.125rem',
    color: '#2e7d32',
    flexShrink: 0,
  },
  stalePromptText: {
    flex: 1,
  },
  stalePromptAction: {
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: '#1565c0',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '2px 4px',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
});

/** @public */
export interface EntityInfoCardProps {
  title?: ReactNode;
  headerActions?: ReactNode;
  footerActions?: ReactNode;
  children?: ReactNode;
  className?: string;
  /** Called when the user clicks "Update" on the stale-data prompt banner. */
  onUpdate?: () => void;
}

/** @public */
export function EntityInfoCard(props: EntityInfoCardProps) {
  const { title, headerActions, footerActions, children, className, onUpdate } =
    props;
  const classes = useStyles();

  const [confirmed, setConfirmed] = useState(false);

  let entityName: string | undefined;
  let entityStale = false;
  let showPromptBanner = false;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { entity } = useEntity();
    entityName = entity.metadata.name;
    entityStale = !confirmed && isStale(getLastUpdatedText(entityName));
    const owners = getEntityRelations(entity, RELATION_OWNED_BY);
    showPromptBanner = owners.some(ref => PROMPT_BANNER_OWNERS.has(ref.name));
  } catch {
    entityName = undefined;
  }

  return (
    <div className={classes.wrapper}>
      {entityStale && showPromptBanner && (
        <div className={classes.stalePrompt}>
          <CheckCircleIcon className={classes.stalePromptIcon} />
          <span className={classes.stalePromptText}>
            Is this still accurate?
          </span>
          <button
            type="button"
            className={classes.stalePromptAction}
            onClick={() => setConfirmed(true)}
          >
            Yes
          </button>
          <button
            type="button"
            className={classes.stalePromptAction}
            onClick={onUpdate}
          >
            Update
          </button>
        </div>
      )}
      <Card className={classNames(classes.root, className)}>
        {title && (
          <CardHeader>
            <Flex justify="between" align="center">
              <div className={classes.title}>
                <Text as="h3" variant="title-x-small" weight="bold">
                  {title}
                </Text>
                {entityName &&
                  (() => {
                    const text = confirmed
                      ? 'just now'
                      : getLastUpdatedText(entityName);
                    return (
                      <span className={classes.lastUpdated}>
                        {confirmed ||
                        !isStale(getLastUpdatedText(entityName)) ? (
                          <CheckCircleIcon
                            className={classes.statusIconFresh}
                          />
                        ) : (
                          <WarningIcon className={classes.statusIconStale} />
                        )}
                        Last updated {text}
                      </span>
                    );
                  })()}
              </div>
              {headerActions && (
                <Flex align="center" gap="1">
                  {headerActions}
                </Flex>
              )}
            </Flex>
          </CardHeader>
        )}
        <CardBody>{children}</CardBody>
        {footerActions && (
          <CardFooter className={classes.footer}>{footerActions}</CardFooter>
        )}
      </Card>
    </div>
  );
}
