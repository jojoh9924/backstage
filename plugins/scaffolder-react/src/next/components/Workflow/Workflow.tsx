/*
 * Copyright 2022 The Backstage Authors
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

import { stringifyEntityRef } from '@backstage/catalog-model';
import {
  Content,
  InfoCard,
  MarkdownContent,
  Progress,
} from '@backstage/core-components';
import { errorApiRef, useAnalytics, useApi } from '@backstage/core-plugin-api';
import { useTranslationRef } from '@backstage/frontend-plugin-api';
import { ReviewStepProps } from '@backstage/plugin-scaffolder-react';
import { JsonValue } from '@backstage/types';
import { makeStyles } from '@material-ui/core/styles';
import { ComponentType, useCallback, useEffect } from 'react';

import { SecretsContextProvider } from '../../../secrets/SecretsContext';
import { scaffolderReactTranslationRef } from '../../../translation';
import { useFilteredSchemaProperties } from '../../hooks/useFilteredSchemaProperties';
import { useTemplateParameterSchema } from '../../hooks/useTemplateParameterSchema';
import {
  useTemplateTimeSavedMinutes,
  useTemplateTimeSavedLabel,
} from '../../hooks/useTemplateTimeSaved';
import { Stepper, type StepperProps } from '../Stepper/Stepper';

const useStyles = makeStyles(theme => ({
  markdown: {
    /** to make the styles for React Markdown not leak into the description */
    '& :first-child': {
      marginTop: 0,
    },
    '& :last-child': {
      marginBottom: 0,
    },
  },
  timeSavedBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '4px 10px',
    borderRadius: 4,
    backgroundColor: theme.palette.grey[800],
    color: theme.palette.common.white,
    fontSize: 12,
    fontWeight: 500,
    lineHeight: 1.3,
    whiteSpace: 'nowrap' as const,
  },
  timeSavedIcon: {
    width: 14,
    height: 14,
    flexShrink: 0,
  },
}));

/**
 * @alpha
 */
export type WorkflowProps = {
  title?: string;
  description?: string;
  namespace: string;
  templateName: string;
  components?: {
    ReviewStepComponent?: ComponentType<ReviewStepProps>;
  };
  onError(error: Error | undefined): JSX.Element | null;
} & Pick<
  StepperProps,
  | 'extensions'
  | 'formProps'
  | 'components'
  | 'onCreate'
  | 'initialState'
  | 'layouts'
>;

/**
 * @alpha
 */
export const Workflow = (workflowProps: WorkflowProps): JSX.Element | null => {
  const { t } = useTranslationRef(scaffolderReactTranslationRef);
  const { title, description, namespace, templateName, onCreate, ...props } =
    workflowProps;

  const analytics = useAnalytics();
  const styles = useStyles();
  const templateRef = stringifyEntityRef({
    kind: 'Template',
    namespace: namespace,
    name: templateName,
  });

  const errorApi = useApi(errorApiRef);

  const { loading, manifest, error } = useTemplateParameterSchema(templateRef);

  const sortedManifest = useFilteredSchemaProperties(manifest);

  const minutesSaved = useTemplateTimeSavedMinutes(templateRef);
  const timeSavedLabel = useTemplateTimeSavedLabel(templateRef);

  const workflowOnCreate = useCallback(
    async (formState: Record<string, JsonValue>) => {
      await onCreate(formState);

      analytics.captureEvent('create', 'Task has been created', {
        value: minutesSaved,
        attributes: {
          templateSteps: sortedManifest?.steps?.length ?? 0,
        },
      });
    },
    [onCreate, analytics, minutesSaved, sortedManifest],
  );

  useEffect(() => {
    if (error) {
      errorApi.post(new Error(`Failed to load template, ${error}`));
    }
  }, [error, errorApi]);

  if (error) {
    return props.onError(error);
  }

  return (
    <Content>
      {loading && <Progress />}
      {sortedManifest && (
        <InfoCard
          title={title ?? sortedManifest.title}
          subheader={
            <MarkdownContent
              className={styles.markdown}
              linkTarget="_blank"
              content={
                description ??
                sortedManifest.description ??
                t('workflow.noDescription')
              }
            />
          }
          action={
            timeSavedLabel ? (
              <span className={styles.timeSavedBadge}>
                <svg
                  className={styles.timeSavedIcon}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                Est. time saved: {timeSavedLabel}
              </span>
            ) : undefined
          }
          noPadding
          titleTypographyProps={{ component: 'h2' }}
        >
          <Stepper
            manifest={sortedManifest}
            onCreate={workflowOnCreate}
            {...props}
          />
        </InfoCard>
      )}
    </Content>
  );
};

/**
 * @alpha
 */
export const EmbeddableWorkflow = (props: WorkflowProps) => (
  <SecretsContextProvider>
    <Workflow {...props} />
  </SecretsContextProvider>
);
